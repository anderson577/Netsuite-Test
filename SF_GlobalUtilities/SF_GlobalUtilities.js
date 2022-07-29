define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https'],
   function(record, runtime, search, serverWidget, format,https) {
     
    function posttoSF(data_obj,functionname){
        var keyname='Connect SF';
        var customrecord_sf_api_keySearchObj = search.create({
            type: "customrecord_sf_api_key",
            filters:
            [
               ["name","is",keyname]
            ],
            columns:
            [
               search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
               }),
               search.createColumn({name: "custrecord_sf_account", label: "Salesforce Account"})
            ]
         });
        var rec_api_key_id ='';
        
        customrecord_sf_api_keySearchObj.run().each(function(result){
            rec_api_key_id=result.id;
            return true;
        });
        if(rec_api_key_id!=''){
        
            var rec = record.load({
                type: "customrecord_sf_api_key",
                id: rec_api_key_id,
                isDynamic: false
            })  
            var consumer_key=rec.getValue('custrecord_sf_consumer_key');
            var consumer_secret=rec.getValue('custrecord_sf_consumer_secret');
            var username=rec.getValue('custrecord_sf_username');
            var password=rec.getValue('custrecord_sf_password');
            var account=rec.getValue('custrecord_sf_account');
            var token_url ='https://'+account+'/services/oauth2/token?grant_type=password&client_id='+consumer_key+'&client_secret='+consumer_secret+'&username='+username+'&password='+password;
          //  log.debug('token_url', token_url); 
            var response = https.post({url: token_url});
            var token = JSON.parse(response.body).access_token;//'00DBI0000000UPV!AQEAQJwqnG3FSlelNlevk_646ygntYepqrj1SxSldFgeJ8UvbTE3TjJdcI21zLyjcqeZa.f3kKb6hs_TJtCBGmpXQbe2ZJLf';
          //  log.debug('token', token)
            if(token!=null&&token!=''&&token!=undefined){
                var api_url = 'https://'+account+'/services/apexrest/'+functionname;
               
                
                var header = { 
                    "Authorization": "Bearer "+token, 
                    "Content-Type": "application/json" ,
                    "Accept": "application/json",
                };
    
             
                var response = https.post({
                    url: api_url,
                    headers: header,
                    body: JSON.stringify(data_obj)
                });
                log.debug('response',response)
                log.debug('response.code',response.code)
                if(response.code=="200"){
                    if(response.body!=''&&response.body!=null&&response.body!=undefined){
                        var body = JSON.parse(response.body);
                        return JSON.stringify({
                            status:'success',                                
                            data:body,
                            error_msg:''
                        }); 
                    }else{
                        log.debug('error_msg','error_msg:'+response.body)
                        return JSON.stringify({
                            status:'fail',                                
                            data:{},
                            error_msg:'response.body is null,確認是否為INACTIVE客戶!'
                        }); 
                    }
                  
                }
                else{
                    log.debug('error_msg','error_msg:'+response.body)
                    return JSON.stringify({
                        status:'fail',                                
                        data:{},
                        error_msg:response.body
                    }); 
                  
                }        
            }else{
                return '獲取token失敗!'; 
            }
        }else{
            return '獲取rec_api_key_id失敗!';  
        }
    
    }
    function updateSO(id){
        var rec = record.load({
            type: 'salesorder',
            id: id,
            isDynamic: false
        }) ;

        
        var sf_id = rec.getValue('custbody_sf_id');
        var sf_account = rec.getValue('custbody_sf_account');       
        if(sf_account!=''){
            log.debug('so_sf_account', sf_account);
            var item_L=[];
            var linecount = rec.getLineCount({ sublistId:'item'}); 
            for (var i = 0; i < linecount; i++){
                item_L.push({
                    name: rec.getSublistText({ sublistId: 'item', fieldId : 'item', line:i }),
                    quantity: rec.getSublistText({ sublistId: 'item', fieldId : 'quantity', line:i }),
                    rate: rec.getSublistText({ sublistId: 'item', fieldId : 'rate', line:i }),
                    amount: rec.getSublistText({ sublistId: 'item', fieldId : 'amount', line:i }),
                    tax1amt: rec.getSublistText({ sublistId: 'item', fieldId : 'tax1amt', line:i }),
                    grossamt: rec.getSublistText({ sublistId: 'item', fieldId : 'grossamt', line:i }),
                    department: rec.getSublistText({ sublistId: 'item', fieldId : 'department', line:i }),
                    classname: rec.getSublistText({ sublistId: 'item', fieldId : 'class', line:i }),                   
                });
               
            }
            var cus_rec = search.lookupFields({
                type: 'customrecord_sf_account',
                id: sf_account,
                columns: ['custrecord_sf_acc_id']
            });
            log.debug('so_cus_rec', cus_rec);
            var sf_opportunity = rec.getValue('custbody_sf_opportunity');
            var opp_id='';
            if(sf_opportunity!=''){
                var opp_rec = search.lookupFields({
                    type: 'customrecord_sf_opportunity',
                    id: sf_opportunity,
                    columns: ['custrecord_sf_opp_id']
                });
                opp_id=opp_rec.custrecord_sf_opp_id;
                log.debug('so_opp_rec', opp_rec);
            }
            var data= { 'Obj' : {
                cus_id:cus_rec.custrecord_sf_acc_id,
                opp_id:opp_id,
                so_id:sf_id,
                ns_id:rec.id,
                tranid:rec.getValue('tranid'),
                status:status_translate('so',rec.getValue('status')),
                trandate:rec.getValue('trandate')!=''?parseDate(rec.getValue('trandate')):'',
                department:rec.getText('department'),
                classname:rec.getText('class'),
                currency_t:rec.getText('currency'),
                subtotal:rec.getValue('subtotal'),
                taxtotal:rec.getValue('taxtotal'),
                total:rec.getValue('total'),
                startdate:rec.getValue('startdate')!=''?parseDate(rec.getValue('startdate')):'',
                enddate:rec.getValue('enddate')!=''?parseDate(rec.getValue('enddate')):'',
                memo:rec.getValue('memo'),
                itemlist:item_L
            } }; 
           
            log.debug('so_data', data); 
            var response_str=posttoSF(data,'NS_SO_API');
            log.debug('response_str', response_str); 
            var response =JSON.parse(response_str);
            log.debug('so_response', response); 
            rec.setValue({fieldId: 'custbody_sf_connect_status',value:response.status,ignoreFieldChange: true});
            rec.setValue({fieldId: 'custbody_sf_connect_message',value:response.error_msg,ignoreFieldChange: true});
            if(response.status=='success')
            rec.setValue({fieldId: 'custbody_sf_id',value:response.data.internalid,ignoreFieldChange: true});
            try {
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
            } catch (error) {
                log.error('so_error',error);
            }
        

        }
    }
    function updateInv(id,only){
      
        var rec = record.load({
            type: 'invoice',
            id: id,
            isDynamic: false
        }) ;

        var sf_id = rec.getValue('custbody_sf_id');
        var sf_account = rec.getValue('custbody_sf_account');      
        if(sf_account!=''){
            log.debug('inv_sf_account', sf_account);
            var item_L=[];
            var linecount = rec.getLineCount({ sublistId:'item'}); 
            for (var i = 0; i < linecount; i++){
                
                item_L.push({
                    name: rec.getSublistText({ sublistId: 'item', fieldId : 'item', line:i }),
                    quantity: rec.getSublistText({ sublistId: 'item', fieldId : 'quantity', line:i }),
                    rate: rec.getSublistText({ sublistId: 'item', fieldId : 'rate', line:i }),
                    amount: rec.getSublistText({ sublistId: 'item', fieldId : 'amount', line:i }),
                    tax1amt: rec.getSublistText({ sublistId: 'item', fieldId : 'tax1amt', line:i }),
                    grossamt: rec.getSublistText({ sublistId: 'item', fieldId : 'grossamt', line:i }),
                    department: rec.getSublistText({ sublistId: 'item', fieldId : 'department', line:i }),
                    classname: rec.getSublistText({ sublistId: 'item', fieldId : 'class', line:i }),                   
                });
            
            }
            var cus_rec = search.lookupFields({
                type: 'customrecord_sf_account',
                id: sf_account,
                columns: ['custrecord_sf_acc_id']
            });
            log.debug('inv_cus_rec', cus_rec); 
            var sf_opportunity = rec.getValue('custbody_sf_opportunity');
            var opp_id='';
            if(sf_opportunity!=''){
                var opp_rec = search.lookupFields({
                    type: 'customrecord_sf_opportunity',
                    id: sf_opportunity,
                    columns: ['custrecord_sf_opp_id']
                });
                opp_id=opp_rec.custrecord_sf_opp_id;
                log.debug('inv_opp_rec', opp_rec);
            }
            var data= { 'Obj' : {
                cus_id:cus_rec.custrecord_sf_acc_id,
                opp_id:opp_id,
                inv_id:sf_id,
                ns_id:rec.id,
                tranid:rec.getValue('tranid'),
                status:status_translate('inv',rec.getValue('status')),
                trandate:rec.getValue('trandate')!=''?parseDate(rec.getValue('trandate')):'',
                department:rec.getText('department'),
                classname:rec.getText('class'),
                currency_t:rec.getText('currency'),
                subtotal:rec.getValue('subtotal'),
                taxtotal:rec.getValue('taxtotal'),
                total:rec.getValue('total'),
                gui:rec.getValue('custbody1'),
                gui_date:rec.getValue('custbody10')!=''?parseDate(rec.getValue('custbody10')):'',
                startdate:rec.getValue('startdate')!=''?parseDate(rec.getValue('startdate')):'',
                enddate:rec.getValue('enddate')!=''?parseDate(rec.getValue('enddate')):'',
                memo:rec.getValue('memo'),
                itemlist:item_L
            } }; 
        
            log.debug('inv_data', data); 
            var response =JSON.parse(posttoSF(data,'NS_INV_API'));
            log.debug('inv_response', response); 
            rec.setValue({fieldId: 'custbody_sf_connect_status',value:response.status,ignoreFieldChange: true});
            rec.setValue({fieldId: 'custbody_sf_connect_message',value:response.error_msg,ignoreFieldChange: true});
            if(response.status=='success')
            rec.setValue({fieldId: 'custbody_sf_id',value:response.data.internalid,ignoreFieldChange: true});
            try {
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
            } catch (error) {
                log.error('inv_error',error);
            }
          
            var createdfrom = rec.getValue('createdfrom');
            if(createdfrom!=''&& only==false){
                updateSO(createdfrom);
            }
          

        }
    }
    function updatePO(id){
        var rec = record.load({
            type: 'purchaseorder',
            id: id,
            isDynamic: false
        }) ;
   

        var item_L=[],addList=[],account_L=['-1'],opp_L=['-1'];
        var linecount = rec.getLineCount({ sublistId:'item'}); 
        for (var i = 0; i < linecount; i++){
            item_L.push({
                name: rec.getSublistText({ sublistId: 'item', fieldId : 'item', line:i }),
                quantity: rec.getSublistText({ sublistId: 'item', fieldId : 'quantity', line:i }),
                rate: rec.getSublistText({ sublistId: 'item', fieldId : 'rate', line:i }),
                amount: rec.getSublistText({ sublistId: 'item', fieldId : 'amount', line:i }),
                tax1amt: rec.getSublistText({ sublistId: 'item', fieldId : 'tax1amt', line:i }),
                grossamt: rec.getSublistText({ sublistId: 'item', fieldId : 'grossamt', line:i }),
                department: rec.getSublistText({ sublistId: 'item', fieldId : 'department', line:i }),
                classname: rec.getSublistText({ sublistId: 'item', fieldId : 'class', line:i }),       
            });
            var sf_account=rec.getSublistValue({ sublistId: 'item', fieldId : 'custcol_sf_account', line:i });
            if(sf_account!='')account_L.push(sf_account);
            var sf_opportunity=rec.getSublistValue({ sublistId: 'item', fieldId : 'custcol_sf_opportunity', line:i });
            if(sf_opportunity!='')opp_L.push(sf_opportunity);
           
        }
    
        var sf_acc_L=search_acc(account_L);         
        var sf_opp_L=search_opp(opp_L);
      


        for (var i = 0; i < linecount; i++){
            var sf_account=rec.getSublistValue({ sublistId: 'item', fieldId : 'custcol_sf_account', line:i });
            var sf_acc='';
            if(sf_account!=''){
                for (var j = 0; j < sf_acc_L.length; j++){
                    if(sf_acc_L[j].id==sf_account){
                        sf_acc=sf_acc_L[j].sf_acc;
                        break;
                    }
                }
            }              
            var sf_opportunity=rec.getSublistValue({ sublistId: 'item', fieldId : 'custcol_sf_opportunity', line:i });
            var sf_opp='';
            if(sf_opportunity!=''){
                for (var j = 0; j < sf_opp_L.length; j++){
                    if(sf_opp_L[j].id==sf_opportunity){
                        sf_opp=sf_opp_L[j].sf_opp;
                        break;
                    }
                }
            }
            var check=false;
            for (var j = 0; j < addList.length; j++){
                if(sf_opp!=''){
                    if(addList[j].sf_opp==''){
                        if(addList[j].sf_acc==sf_acc){
                            addList[j].sf_opp=sf_opp;
                            check=true;
                            break;
                        }                          
                    }else{
                        if(addList[j].sf_acc==sf_acc && addList[j].sf_opp==sf_opp){
                            check=true;
                            break;
                        }
                    }                      
                }else{
                    if(addList[j].sf_acc==sf_acc){
                        check=true;
                        break;
                    }
                }                   
            }

            if(!check && (sf_acc!='' || sf_opp!='')){
                addList.push({
                    sf_acc:sf_acc,
                    sf_opp:sf_opp
                });
            }
           
        }
     
        log.debug('po_addList', addList); 

        var expense_L=[];
        var linecount = rec.getLineCount({ sublistId:'expense'}); 
        for (var i = 0; i < linecount; i++){
            expense_L.push({
                name: rec.getSublistText({ sublistId: 'expense', fieldId : 'account', line:i }),                   
                amount: rec.getSublistText({ sublistId: 'expense', fieldId : 'amount', line:i }),
                tax1amt: rec.getSublistText({ sublistId: 'expense', fieldId : 'tax1amt', line:i }),
                grossamt: rec.getSublistText({ sublistId: 'expense', fieldId : 'grossamt', line:i }),
                department: rec.getSublistText({ sublistId: 'expense', fieldId : 'department', line:i }),
                classname: rec.getSublistText({ sublistId: 'expense', fieldId : 'class', line:i }),       
            });
           
        }
     
        var data= { 'Obj' : {
            ns_id:rec.id,
            tranid:rec.getValue('tranid'),
            status:status_translate('po',rec.getValue('status')),
            trandate:rec.getValue('trandate')!=''?parseDate(rec.getValue('trandate')):'',
            department:rec.getText('department'),
            classname:rec.getText('class'),
            currency_t:rec.getText('currency'),
            subtotal:rec.getValue('subtotal'),
            taxtotal:rec.getValue('taxtotal'),
            total:rec.getValue('total'),
            memo:rec.getValue('memo'),
            itemlist:item_L,
            expenselist:expense_L,
            addList:addList,
        } }; 
       
        log.debug('po_data', data);

        if(addList.length>0){
            var response =JSON.parse(posttoSF(data,'NS_PO_API'));
            log.debug('po_response', response); 
            rec.setValue({fieldId: 'custbody_sf_connect_status',value:response.status,ignoreFieldChange: true});
            rec.setValue({fieldId: 'custbody_sf_connect_message',value:response.error_msg,ignoreFieldChange: true});         
            try {
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
            } catch (error) {
                log.error('po_error',error);
            }         
        }          
    }
    function parseDate(date_str){
        var date=new Date(date_str);
        log.debug('date', date.toISOString()); 
        var date_p=date.toISOString().split('T')[0];
        log.debug('date_p', date_p); 
        date_p=date_p.replace(/-/g,'/');
        return date_p;
    }
    function search_acc(account_L){
        var customrecord_sf_accountSearchObj = search.create({
            type: "customrecord_sf_account",
            filters:
            [
               ["internalid","anyof",account_L]
            ],
            columns:
            [
               'custrecord_sf_acc_id'
            ]
         });
         var sf_acc_L=[];
         customrecord_sf_accountSearchObj.run().each(function(result){
            sf_acc_L.push({
              id:result.id,
              sf_acc:result.getValue('custrecord_sf_acc_id')  
            });
            return true;
         });

         return sf_acc_L;
    }
    function search_opp(opp_L){
        var customrecord_sf_opportunitySearchObj = search.create({
            type: "customrecord_sf_opportunity",
            filters:
            [
               ["internalid","anyof",opp_L]
            ],
            columns:
            [           
               search.createColumn({name: "custrecord_sf_opp_id", label: "SALESFORCE OPPORTUNITY ID"})
            ]
         });
         var sf_opp_L=[];
         customrecord_sf_opportunitySearchObj.run().each(function(result){
            sf_opp_L.push({
                id:result.id,
                sf_opp:result.getValue({name: "custrecord_sf_opp_id", label: "SALESFORCE OPPORTUNITY ID"})  
            });
            return true;
         });
          

        return sf_opp_L;
    }
    function status_translate(type,status){
        if(type=='po'){
            if(status=='等待上司批准')status='Pending Supervisor Approval';
            if(status=='等待收貨')status='Pending Receipt';
            if(status=='上司拒收')status='Rejected by Supervisor';
            if(status=='部分收貨')status='Partially Received';
            if(status=='等待發帳單/部分收貨')status='Pending Billing/Partially Received';
            if(status=='等待發帳單')status='Pending Bill';
            if(status=='全部發帳單')status='Fully Billed';
            if(status=='已關閉')status='Closed';
            if(status=='已規劃')status='Planned';
        }
        if(type=='so'){
            if(status=='等待批准')status='Pending Approval';
            if(status=='待完成')status='Pending Fulfillment';
            if(status=='已取消')status='Cancelled';
            if(status=='部分完成')status='Partially Fulfilled';
            if(status=='等待發帳單/部分完成')status='Pending Billing/Partially Fulfilled';
            if(status=='等待發帳單')status='Pending Billing';
            if(status=='已發帳單')status='Billed';
            if(status=='已關閉')status='Closed';
        }
        if(type=='inv'){
            if(status=='未完成')status='Open';
            if(status=='全額支付')status='Paid In Full';
            if(status=='等待批准')status='Pending Approval';
            if(status=='已拒絶')status='Rejected';
            if(status=='已失效')status='Voided';
        }

        return status;
    }

   
   return {
    posttoSF: posttoSF,
    updateSO:updateSO,
    updateInv:updateInv,
    updatePO:updatePO
    };
});



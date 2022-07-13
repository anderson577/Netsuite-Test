/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    var html,div,img,bar;
    function pageInit(context) {
        var url=window.location.href;
        if(url.indexOf('unlayered=T')==-1 && url.indexOf('script=')!=-1){
            window.location.replace(url+'&unlayered=T');
        }else{
            html=document.getElementsByTagName("html")[0];
            div = document.createElement("div");
            div.id='Loading_div';
            div.setAttribute("style", "width:100%;height:100%;top:0;left:0;position:fixed;display:block;opacity:0.7;background-color:#fff;z-index:99;text-align:center;");       
            img = document.createElement("img");
            img.setAttribute("style", "position:absolute;top:45%;left:43%;z-index:100;width:10%;");       
            img.setAttribute("src", "https://4631466.app.netsuite.com/core/media/media.nl?id=338&c=4631466&h=CGENO9ikZrqmPg2-0PauwtEcJhGn_R66Kc1IWbLx0QsEJHoS");  
            img.setAttribute("alt", "Loading...");  
            div.appendChild(img);
            div.setAttribute("style", "pointer-events: none;");
            div.setAttribute("style", "visibility: hidden;");    
            bar=document.getElementById('ns_navigation');
            html.appendChild(div);        
        }    
    }
    function filter(context) {        
        window.onbeforeunload = null;
        var current_rec = currentRecord.get();
        current_rec.setValue({fieldId: 'custpage_invoice_picks',value:'{}',ignoreFieldChange: true});  

      
        // document.getElementById("pickdata").value = JSON.stringify(line);
        document.getElementById("main_form").submit();
    }
    function customerdeposit(context) {        
        window.onbeforeunload = null;      
        var current_rec = currentRecord.get();
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
        //var invoice_check=0;
        // for (var i = 0; i < linecount; i++) {
        //     var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',line:i });
        //     if(select_L==true)invoice_check+=1;             
        // } 
        // if(invoice_check!=0){
        //     alert('產生Customer Deposit不能選擇發票!');
        //     return;  
        // }
        var entityid=current_rec.getValue('custpage_select_cus');         
        if(entityid!=''&&entityid!=undefined && entityid!=null){
            var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_reconcili' })
            var reconcili_amt=0;
            var data_list=[];
            var select_currency='';
            for (var i = 0; i < linecount; i++) {
                var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });                            
               
                if(select_L==true){
                    var deposit_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_deposit_amount',line:i });
                    var balance_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_balance',line:i });
                    // if(deposit_amount!=balance_amount){
                    //     alert('請移除含對帳紀錄的對帳資料!');
                    //     return;  
                    // }                  
                    reconcili_amt+=parseFloat(balance_amount);
                    var select_id = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_id',line:i });               
                    data_list.push({
                        data_id:select_id,
                        balance_amount:balance_amount
                    }); 
                    select_currency= current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_currency',line:i });
                }
            }   
         
            if(reconcili_amt!=0){
                var deposit_data={
                    entityid:entityid,
                    reconcili_amt:reconcili_amt,
                    select_currency:select_currency,
                    data_list:data_list
                };
                var url='/app/accounting/transactions/custdep.nl?entity='+entityid+'&payment_data='+JSON.stringify(deposit_data);
                window.open(url,'_blank');
                Ext.Msg.show({
                    title: '提醒',width: 300,buttons: Ext.Msg.OK, msg:'開單後請記得重整頁面!',icon :Ext.MessageBox.INFO,
                    fn: function (button){                  
                        if(button == 'ok'){                                       
                            filter();
                        }
                    }
                });   
            }
        
        }
    }
    function fieldChanged(context) {
        window.onbeforeunload = null; 
        var current_rec = context.currentRecord; 
       
        if (context.fieldId == 'custpage_reconcili_select') {
        
            var select = current_rec.getCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select'});
            var index=current_rec.getCurrentSublistIndex({sublistId: 'custpage_cuslist_reconcili'});
            var customer = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_customer',line:index });
            var currency = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_currency',line:index });
            var account = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_company_account',line:index });
           
            var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_reconcili' })
            var customer_ck='',reconcili_amt=0,currency_ck='',account_ck='';
            for (var i = 0; i < linecount; i++) {
                var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });              
                var deposit_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_balance',line:i }); 
                if(select_L==true){
                   // console.log('deposit_amount',deposit_amount);
                    reconcili_amt+=parseFloat(deposit_amount);
                }
                if(i!=index){
                    var customer_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_customer',line:i });
                    var currency_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_currency',line:i });
                    var account_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_company_account',line:i });                       
                   
                    if(customer_L!=''&&select_L==true)customer_ck=customer_L;
                    if(currency_L!=''&&select_L==true)currency_ck=currency_L;
                    if(account_L!=''&&select_L==true)account_ck=account_L;
                }
            }              
            //console.log('reconcili_amt',reconcili_amt);
            current_rec.setValue({fieldId: 'custpage_select_reconcili_amt',value:reconcili_amt,ignoreFieldChange: true}); 
            if(currency_ck!=''&&currency_ck!=currency){
                if(select==true){
                    alert('請選擇相同幣別!');
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',value:false});
                    reconcili_amt=0;
                    for (var i = 0; i < linecount; i++) {
                        var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });                            
                        var deposit_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_balance',line:i });
                        if(select_L==true) reconcili_amt+=parseFloat(deposit_amount);
                    }                           
                    current_rec.setValue({fieldId: 'custpage_select_reconcili_amt',value:reconcili_amt,ignoreFieldChange: true}); 
                }  
                return;           
            }
            if(account_ck!=''&&account_ck!=account){
                if(select==true){
                    alert('請選擇相同公司銀行帳戶!');
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',value:false});
                    reconcili_amt=0;
                    for (var i = 0; i < linecount; i++) {
                        var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });                            
                        var deposit_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_balance',line:i });
                        if(select_L==true) reconcili_amt+=parseFloat(deposit_amount);
                    }                           
                    current_rec.setValue({fieldId: 'custpage_select_reconcili_amt',value:reconcili_amt,ignoreFieldChange: true}); 
                }  
                return;           
            }
            if(customer!=''){               
              
                if(select==true){                
                    if(customer_ck==''){
                        document.getElementById("custpage_select_cus").value = customer;                     
                        current_rec.setValue({fieldId: 'custpage_invoice_picks',value:JSON.stringify({}),ignoreFieldChange: false});                                              
                        load_invoice_data(current_rec,customer,0);                      
                    }else{
                        if(customer_ck!=customer){
                            alert('請選擇相同客戶!');
                            current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',value:false});
                            reconcili_amt=0;
                            for (var i = 0; i < linecount; i++) {
                                var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });                            
                                var deposit_amount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_balance',line:i });
                                if(select_L==true) reconcili_amt+=parseFloat(deposit_amount);
                            }                           
                            current_rec.setValue({fieldId: 'custpage_select_reconcili_amt',value:reconcili_amt,ignoreFieldChange: true}); 
                        }
                    }                  
                         
                }else{
                    if(customer_ck==''){
                        document.getElementById("custpage_select_cus").value = '';                     
                    }
                    if(currency_ck==''){
                        current_rec.setValue({fieldId: 'custpage_select_reconcili_amt',value:'',ignoreFieldChange: true});
                        current_rec.setValue({fieldId: 'custpage_cuslist_invoice_amt',value:'',ignoreFieldChange: true});  
                    }  
                }              
                
            }
         
            input_pay_amount(current_rec);
           
            
        } 
        if(context.fieldId=='custpage_pageid'){
            var customer = current_rec.getValue('custpage_select_cus');
            var pageid=current_rec.getValue('custpage_pageid');
            if(customer!=''&&pageid!=''){
                load_invoice_data(current_rec,customer,pageid);
            }           
        }
        if (context.fieldId == 'custpage_subsidiary') {
            var subsidiary = current_rec.getValue('custpage_subsidiary');
            var account_L=Account_List();
            var selectOptions = current_rec.getField({ fieldId: 'custpage_account' });
            var options = selectOptions.getSelectOptions({
                filter : '',
                operator : 'contains'
            });           
            options.forEach(function (result){
                selectOptions.removeSelectOption({
                    value: result.value,
                });
            });
            selectOptions.insertSelectOption({
                value : 'all',
                text :'-ALL-',
                isSelected : true
            });
            account_L.forEach(function (data){
                if(subsidiary=='all'){
                    selectOptions.insertSelectOption({
                        value : data.account_id,
                        text :data.account_n,
                        isSelected : false
                    });  
                }else{
                    if(data.subsidiary==subsidiary){
                        selectOptions.insertSelectOption({
                            value : data.account_id,
                            text :data.account_n,
                            isSelected : false
                        });   
                    }
                }
                         
            });  
        }    
    }
    function sublistChanged(context) {
        //console.log('context.operation',context.operation);
        if(context.operation == 'commit'){
            var current_rec = context.currentRecord; 
            var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
           
            var invoice_picks=JSON.parse(current_rec.getValue('custpage_invoice_picks'));
            for (var i = 0; i < linecount; i++) {
                var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',line:i });
                var invoice_amountremaining = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountremaining',line:i }); 
                var invoice_paymentamount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',line:i });
                var tranid = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_tranid',line:i });
                var currency = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_currency',line:i });
              
                var paymentamount=invoice_paymentamount;
                //console.log('paymentamount',paymentamount);
                if(paymentamount==''||paymentamount==undefined||paymentamount==null||paymentamount==0){
                    paymentamount=invoice_amountremaining;
                } 
                if(paymentamount>invoice_amountremaining){
                    paymentamount=invoice_amountremaining;
                }          
                if(paymentamount!=invoice_paymentamount) {              
                    current_rec.selectLine({sublistId: 'custpage_cuslist_invoice',line: i});
                    current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value: parseFloat(paymentamount),ignoreFieldChange: false});  
                    current_rec.commitLine({sublistId: 'custpage_cuslist_invoice',ignoreRecalc:true});     
                } 
                
                if(select_L==true){
                    invoice_picks['id_'+tranid+'@'+currency]=paymentamount;
                  
                }else{
                    delete invoice_picks['id_'+tranid+'@'+currency]; 
                }             
            } 
            var invoice_amt=0;
           
            for(var k in invoice_picks) {
                invoice_amt+=parseFloat(invoice_picks[k]);         
            }        
            current_rec.setValue({fieldId: 'custpage_cuslist_invoice_amt',value:invoice_amt,ignoreFieldChange: true});         
            current_rec.setValue({fieldId: 'custpage_invoice_picks',value:JSON.stringify(invoice_picks),ignoreFieldChange: true});   
        }
      
    }

    function load_page(){
        div.setAttribute("style", "visibility: visible;"); 
        bar.setAttribute("style", "pointer-events: none;");  
    }

    function close_page(){    
        div.setAttribute("style", "visibility: hidden;"); 
        bar.setAttribute("style", "pointer-events: auto;");
    }
    /**   
    * @param {object} current_rec 
    * @param {string} customer       
    */
    function load_invoice_data(current_rec,customer,pageId){
       
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' })
        for (var i = 0; i < linecount; i++) {
            current_rec.removeLine({sublistId:'custpage_cuslist_invoice',line:0,ignoreRecalc:true});
        }
        var selectOptions = current_rec.getField({ fieldId: 'custpage_pageid' });
        var options = selectOptions.getSelectOptions({
            filter : '',
            operator : 'contains'
        });
       
        options.forEach(function (result){
            selectOptions.removeSelectOption({
                value: result.value,
            });
        });
        var pageId = pageId;
        var pagesize = 50;
        // var retrieveSearch = runSearch(pagesize, customers, 'SalesOrd');
        var invoice_data=search_invoice_data(pagesize,pageId,customer);
     
        
        var pageCount = Math.ceil(invoice_data.AllCount / pagesize);
        log.debug("pageCount",pageCount)

        if (!pageId || pageId == '' || pageId < 0)
            pageId = 0;
        else if (pageId >= pageCount)
            pageId = pageCount - 1;
    
        for(i = 0; i < pageCount; i++){
            if(i == pageId){              
                selectOptions.insertSelectOption({
                    value : i,
                    text : ((i * pagesize) + 1) + ' - ' + ((i + 1) * pagesize),
                    isSelected : true
                });
            }else{
                selectOptions.insertSelectOption({
                    value : i,
                    text : ((i * pagesize) + 1) + ' - ' + ((i + 1) * pagesize)
                });
            }
        }
        var iv=0;
        var invoice_picks=JSON.parse(current_rec.getValue('custpage_invoice_picks'));
        invoice_data.list.forEach(function (result){
          


            current_rec.selectNewLine({sublistId: 'custpage_cuslist_invoice'});
            current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_id',value: result.id,ignoreFieldChange: true});  
            if('id_'+result.tranid+'@'+result.currency in invoice_picks ){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value: true,ignoreFieldChange: true});  
            }             
            if(result.trandate){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_trandate',value:  new Date(result.trandate) ,ignoreFieldChange: true});                
            }
            if(result.tranid){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_tranid',value: result.tranid,ignoreFieldChange: true});                
            }
            if(result.name){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_customer_name',value: result.name,ignoreFieldChange: true});            
            }
            if(result.status){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_status',value: result.status,ignoreFieldChange: true});             
            } 
            if(result.currency){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_currency',value: result.currency,ignoreFieldChange: true});             
            }    
            if(result.account){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_account',value: result.account,ignoreFieldChange: true});             
            }    
            if(result.amount){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amount',value: parseFloat(result.amount),ignoreFieldChange: true});               
            }
            if(result.amountpaid){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountpaid',value: parseFloat(result.amountpaid),ignoreFieldChange: true});             
            }  
            if(result.amountremaining){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountremaining',value: parseFloat(result.amountremaining),ignoreFieldChange: true});              
                if('id_'+result.tranid+'@'+result.currency in invoice_picks ){
                    current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value: parseFloat(invoice_picks['id_'+result.tranid+'@'+result.currency]),ignoreFieldChange: true});
                }else{
                    current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value: parseFloat(result.amountremaining),ignoreFieldChange: true});
                }  
                  
            }
          
            current_rec.commitLine({sublistId: 'custpage_cuslist_invoice',ignoreRecalc:true});                      
            iv++;
        });
        current_rec.setValue({fieldId: 'custpage_invoice_picks',value:JSON.stringify(invoice_picks),ignoreFieldChange: true});  
        current_rec.setValue({fieldId: 'custpage_cuslist_datacount',value:iv,ignoreFieldChange: true});  

    }
    /** 
    * @param {string} customer
    * @return {[]}      
    */
     function search_invoice_data(pagesize,pageId,customer){
        if(customer==''){
            return {AllCount:0,list:[]};;
        }
        var transactionSearchObj = search.create({
            type: "invoice",
            filters:
            [
               ["mainline","is","T"],
               "AND", 
               [["name","anyof",customer],"OR",["customer.custentity_parent","anyof",customer]],
               "AND", 
               ["status","anyof","CustInvc:A"]
            ],
            columns:
            [
               search.createColumn({
                  name: "trandate",
                  sort: search.Sort.ASC,
                  label: "Date"
               }), 
               search.createColumn({
                  name: "tranid",
                  sort: search.Sort.ASC,
                  label: "Document Number"
               }),          
               search.createColumn({name: "entity", label: "Name"}),
               search.createColumn({
                name: "accountnumber",
                join: "customer",
                label: "Account"
               }),    
               search.createColumn({name: "statusref", label: "Status"}),
               search.createColumn({name: "currency", label: "Currency"}),           
               search.createColumn({name: "fxamount", label: "Amount"}),
               search.createColumn({name: "fxamountpaid", label: "Amount Paid"}),
               search.createColumn({name: "fxamountremaining", label: "Amount Remaining"}),
            ]
         });
         var AllCount = transactionSearchObj.runPaged().count;
         var data={AllCount:AllCount,list:[]};  
         transactionSearchObj.runPaged({pageSize : pagesize}).fetch({
            index : pageId
        }).data.forEach(function (result){    
            data.list.push({
                id:result.id,             
                trandate:result.getValue('trandate'),
                tranid:result.getValue('tranid'),
                name:result.getText('entity'),
                status:result.getText('statusref'),
                currency:result.getText('currency'),
                account:result.getValue({
                    name: "accountnumber",
                    join: "customer",
                    label: "Account"
                }),
                amount:result.getValue('fxamount'),
                amountpaid:result.getValue('fxamountpaid'),
                amountremaining:result.getValue('fxamountremaining'),
            });
        });
         
        //  transactionSearchObj.run().each(function(result){
        //     data.list.push({
        //         id:result.id,             
        //         trandate:result.getValue('trandate'),
        //         tranid:result.getValue('tranid'),
        //         name:result.getText('entity'),
        //         status:result.getText('statusref'),
        //         currency:result.getText('currency'),
        //         account:result.getValue({
        //             name: "accountnumber",
        //             join: "customer",
        //             label: "Account"
        //         }),
        //         amount:result.getValue('fxamount'),
        //         amountpaid:result.getValue('fxamountpaid'),
        //         amountremaining:result.getValue('fxamountremaining'),
        //     });
        //     return true;
        //  }); 
        log.debug("data",data)
         return data;
    }
    function customerpayment(context) {
        var current_rec = currentRecord.get();
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_reconcili' })
        var data_list=[];
        var select_currency='';
        for (var i = 0; i < linecount; i++) {        
            var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });  
            if(select_L==true){
                var select_id = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_id',line:i });
                select_currency= current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_currency',line:i });
                data_list.push(select_id); 
            }          
        } 
        if(data_list.length>1){
            alert('一次只能選擇一筆對帳資料做Payment!');
            return;
        }
        var reconcili_amt=current_rec.getValue('custpage_select_reconcili_amt');         
        var invoice_amt=current_rec.getValue('custpage_cuslist_invoice_amt');
        if(invoice_amt>reconcili_amt){
            alert('發票金額大於剩餘對帳金額!');
            return;
        }         

        var entityid=current_rec.getValue('custpage_select_cus');         
        if(entityid!=''&&entityid!=undefined && entityid!=null){
            var payment_data={reconcili_id:data_list[0],currency:select_currency};
            var pay_list=[];           
            var invoice_picks=JSON.parse(current_rec.getValue('custpage_invoice_picks'));
            for(var k in invoice_picks){
                var invoice_paymentamount =parseFloat(invoice_picks[k]);
                var invoice_currency =k.split('@')[1];
                var invoice_tranid=k.split('@')[0].split('_')[1];
                if(invoice_currency!=select_currency){
                    alert('對帳資料與發票不同幣別!');
                    return;
                }
                pay_list.push({
                    invoice_tranid:invoice_tranid,
                    invoice_paymentamount:invoice_paymentamount,                                    
                });

            }               
            // for (var i = 0; i < linecount; i++) {
            //     var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',line:i });
            //     var invoice_tranid = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_tranid',line:i }); 
            //     var invoice_paymentamount = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',line:i });
            //     var invoice_currency = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_currency',line:i });                    
            //     if(select_L==true){
            //         if(invoice_currency!=select_currency){
            //             alert('對帳資料與發票不同幣別!');
            //             return;
            //         }
            //         pay_list.push({
            //             invoice_tranid:invoice_tranid,
            //             invoice_paymentamount:invoice_paymentamount,                                    
            //         });
            //     }            
            // } 
            payment_data.pay_list=pay_list;           
            var url='/app/accounting/transactions/custpymt.nl?entity='+entityid+'&payment_data='+JSON.stringify(payment_data);
            window.open(url,'_blank');
            Ext.Msg.show({
                title: '提醒',width: 300,buttons: Ext.Msg.OK, msg:'開單後請記得重整頁面!',icon :Ext.MessageBox.INFO,
                fn: function (button){                  
                    if(button == 'ok'){                                       
                        filter();
                    }
                }
            });   
        }
      
    }
    function input_pay_amount(current_rec){
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_reconcili' });      
        var select_currency='';
        for (var i = 0; i < linecount; i++) {        
            var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });  
            if(select_L==true){
                select_currency= current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_currency',line:i });
            }          
        } 
        var reconcili_amt=current_rec.getValue('custpage_select_reconcili_amt');
        reconcili_amt=reconcili_amt==''?0:parseFloat(reconcili_amt);
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
        var invoice_amt=0;             
        for (var i = 0; i < linecount; i++) {
            var currency = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_currency',line:i });
            if(currency!=select_currency){
                continue;
            } 
            current_rec.selectLine({sublistId: 'custpage_cuslist_invoice',line: i});         
            var amountremaining = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountremaining',line:i }); 
            current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value:false});
          
            if(reconcili_amt!=0){
                if(reconcili_amt>=amountremaining){
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value:amountremaining});
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value:true});                
                    reconcili_amt-=amountremaining;
                    invoice_amt+=amountremaining;
                   }else{
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value:reconcili_amt}); 
                    current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value:true});
                    invoice_amt+=reconcili_amt;                  
                    reconcili_amt=0;
                   }
            }else{
             
                current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_paymentamount',value:0}); 
            }        
           current_rec.commitLine({sublistId: 'custpage_cuslist_invoice',ignoreRecalc:true}); 
        }           
        current_rec.setValue({fieldId: 'custpage_cuslist_invoice_amt',value:invoice_amt,ignoreFieldChange: true}); 
    }
    function Account_List(){
        var AL=[];
        AL.push({account_n:'110309 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD花旗營業部 45006',account_id:'1374',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345006'});
        AL.push({account_n:'110316 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - USD花旗營業部 45219',account_id:'1375',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345219'});
        AL.push({account_n:'110317 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - HKD花旗營業部 45227',account_id:'1376',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345227'});
        AL.push({account_n:'110318 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - CNY花旗營業部 45235',account_id:'1377',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345235'});
        AL.push({account_n:'110302 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD玉山三重 16686',account_id:'227',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0325940016686'});
        AL.push({account_n:'110303 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD玉山內湖 33896',account_id:'228',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0462940033896'});
        AL.push({account_n:'110311 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - USD玉山重新 00199',account_id:'323',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0325441000199'});
        AL.push({account_n:'110304 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD土銀西湖 15881',account_id:'229',subsidiary:'博弘雲端科技股份有限公司',bank_account:'120001015881'});
        AL.push({account_n:'110344 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD花旗 44001',account_id:'1432',subsidiary:'宏庭科技股份有限公司',bank_account:'5833444001'});
        AL.push({account_n:'110345 現金及約當現金 : 銀行存款 : 宏庭銀行存款-外活 - USD花旗 44206',account_id:'1433',subsidiary:'宏庭科技股份有限公司',bank_account:'5833444206'});
        AL.push({account_n:'110331 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD土銀西湖 15961',account_id:'427',subsidiary:'宏庭科技股份有限公司',bank_account:'120001015961'});
        AL.push({account_n:'110341 現金及約當現金 : 銀行存款 : 宏庭銀行存款-外活 - USD土銀西湖 10215',account_id:'431',subsidiary:'宏庭科技股份有限公司',bank_account:'120101010215'});
        AL.push({account_n:'110332 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD玉山三重 15809',account_id:'428',subsidiary:'宏庭科技股份有限公司',bank_account:'0325940015809'});


       return AL;
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        customerdeposit:customerdeposit,
        sublistChanged: sublistChanged,
        filter:filter,
        customerpayment:customerpayment,        
    };
});
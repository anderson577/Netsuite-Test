/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js'],
 function(record, runtime, search, serverWidget, format,https,SF) {

    function beforeLoad(context) {
     
    }

    function beforeSubmit(context) {
    
    }

    function afterSubmit(context) {
        log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
        if (context.type == "edit" || context.type == "create"){        

            var id = context.newRecord.id;
            var type = context.newRecord.type;

            var rec = record.load({
                type: type,
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
         
            log.debug('addList', addList); 

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
                status:rec.getValue('status'),
                trandate:rec.getText('trandate'),
                department:rec.getText('department'),
                classname:rec.getText('class'),
                currency_t:rec.getText('currency'),
                subtotal:rec.getValue('subtotal'),
                taxtotal:rec.getValue('taxtotal'),
                total:rec.getValue('total'),
                itemlist:item_L,
                expenselist:expense_L,
                addList:addList,
            } }; 
           
            log.debug('data', data);

            if(addList.length>0){
                var response =JSON.parse(SF.posttoSF(data,'NS_PO_API'));
                log.debug('response', response); 
                rec.setValue({fieldId: 'custbody_sf_connect_status',value:response.status,ignoreFieldChange: true});
                rec.setValue({fieldId: 'custbody_sf_connect_message',value:response.error_msg,ignoreFieldChange: true});         
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
            }          
        
        }
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

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

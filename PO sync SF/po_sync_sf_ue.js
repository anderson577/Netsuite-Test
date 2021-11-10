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

        if ((context.type == "edit" && runtime.executionContext === runtime.ContextType.USER_INTERFACE)){        

            var id = context.newRecord.id;
            var type = context.newRecord.type;

            var rec = record.load({
                type: type,
                id: id,
                isDynamic: false
            }) ;

            var sf_account_ven = rec.getValue('custbody_sf_account_ven');

            if(sf_account_ven==''){
                return;
            }

            var item_L=[];
            var linecount = rec.getLineCount({ sublistId:'item'}); 
            for (var i = 0; i < linecount; i++){
                item_L.push({
                    name: rec.getSublistText({ sublistId: 'item', fieldId : 'item', line:i }),
                    quantity: rec.getSublistValue({ sublistId: 'item', fieldId : 'quantity', line:i }),
                    rate: rec.getSublistValue({ sublistId: 'item', fieldId : 'rate', line:i }),
                    amount: rec.getSublistValue({ sublistId: 'item', fieldId : 'amount', line:i }),
                    tax1amt: rec.getSublistValue({ sublistId: 'item', fieldId : 'tax1amt', line:i }),
                    grossamt: rec.getSublistValue({ sublistId: 'item', fieldId : 'grossamt', line:i }),
                    department: rec.getSublistText({ sublistId: 'item', fieldId : 'department', line:i }),
                    classname: rec.getSublistText({ sublistId: 'item', fieldId : 'class', line:i }),       
                });
               
            }
            var expense_L=[];
            var linecount = rec.getLineCount({ sublistId:'expense'}); 
            for (var i = 0; i < linecount; i++){
                expense_L.push({
                    name: rec.getSublistText({ sublistId: 'expense', fieldId : 'account', line:i }),                   
                    amount: rec.getSublistValue({ sublistId: 'expense', fieldId : 'amount', line:i }),
                    tax1amt: rec.getSublistValue({ sublistId: 'expense', fieldId : 'tax1amt', line:i }),
                    grossamt: rec.getSublistValue({ sublistId: 'expense', fieldId : 'grossamt', line:i }),
                    department: rec.getSublistText({ sublistId: 'expense', fieldId : 'department', line:i }),
                    classname: rec.getSublistText({ sublistId: 'expense', fieldId : 'class', line:i }),       
                });
               
            }
            var cus_rec = search.lookupFields({
                type: 'customrecord_sf_account',
                id: sf_account_ven,
                columns: ['custrecord_sf_acc_id']
            });
            log.debug('cus_rec', cus_rec); 
            var data= { 'Obj' : {
                cus_id:cus_rec.custrecord_sf_acc_id,
                po_id:rec.getValue('custbody_sf_id'),
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
                expenselist:expense_L
            } }; 
           
            log.debug('data', data);           
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
    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

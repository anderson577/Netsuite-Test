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
        if (context.type == "edit" || context.type == "create" ||context.type =="approve"){        

            var id = context.newRecord.id;
            var type = context.newRecord.type;


            var rec = record.load({
                type: type,
                id: id,
                isDynamic: false
            }) ;

            
            var sf_id = rec.getValue('custbody_sf_id');
            var sf_account = rec.getValue('custbody_sf_account');
            if(sf_account!=''){

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
                log.debug('cus_rec', cus_rec);
                var sf_opportunity = rec.getValue('custbody_sf_opportunity');
                var opp_id='';
                if(sf_opportunity!=''){
                    var opp_rec = search.lookupFields({
                        type: 'customrecord_sf_opportunity',
                        id: sf_opportunity,
                        columns: ['custrecord_sf_opp_id']
                    });
                    opp_id=opp_rec.custrecord_sf_opp_id;
                    log.debug('opp_rec', opp_rec);
                }
                var data= { 'Obj' : {
                    cus_id:cus_rec.custrecord_sf_acc_id,
                    opp_id:opp_id,
                    so_id:sf_id,
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
                    itemlist:item_L
                } }; 
               
                log.debug('data', data); 
                var response =JSON.parse(SF.posttoSF(data,'NS_SO_API'));
                log.debug('response', response); 
                rec.setValue({fieldId: 'custbody_sf_connect_status',value:response.status,ignoreFieldChange: true});
                rec.setValue({fieldId: 'custbody_sf_connect_message',value:response.error_msg,ignoreFieldChange: true});
                rec.setValue({fieldId: 'custbody_sf_id',value:response.data.internalid,ignoreFieldChange: true});
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
    
            }
           
          
        }
    }
    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

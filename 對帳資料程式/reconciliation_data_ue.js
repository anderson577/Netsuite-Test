/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search','N/ui/serverWidget'], function(record, runtime, config, search,serverWidget) {

    function beforeLoad(context) {
     
       
    }

    function beforeSubmit(context) {
        var rec = context.newRecord;
        var recon_transaction =rec.getValue('custrecord_recon_transaction');
        var deposit_amount =rec.getValue('custrecord_recon_deposit_amount');
        if(recon_transaction.length>0){
            var filter= ["internalid","anyof"];
            for(var i=0;i<recon_transaction.length;i++){
                filter.push(recon_transaction[i]);
            }
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                [
                   ["mainline","is","T"], 
                   "AND", 
                   filter
                ],
                columns:
                [                 
                   search.createColumn({name: "fxamount", label: "Amount"}),
                   search.createColumn({name: "custbody_payment_data", label: "payment_data"}),               
                ]
             });
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("transactionSearchObj result count",searchResultCount);
             var amount=0,hasdeposit=false,deposit_data='';
             transactionSearchObj.run().each(function(result){
                if(result.recordType=='customerdeposit'){
                    hasdeposit=true;
                    deposit_data=result.getValue('custbody_payment_data');
                }else{
                    amount+=parseFloat(result.getValue('fxamount'));
                }
               
                return true;
             });
             log.debug("amount",amount);
             deposit_amount-=amount;
           
             if(hasdeposit){
                log.debug("deposit_data",deposit_data);
                var deposit_data = JSON.parse(deposit_data);
                for(var i=0;i<deposit_data.data_list.length;i++){
                    var sub_data=deposit_data.data_list[i];
                    if(sub_data.data_id==rec.id){
                        deposit_amount-=parseFloat(sub_data.balance_amount);                       
                    }
                }
               
             }
             rec.setValue({fieldId: 'custrecord_recon_balance',value:deposit_amount,ignoreFieldChange: true});
           
        }else{
            rec.setValue({fieldId: 'custrecord_recon_balance',value:deposit_amount,ignoreFieldChange: true}); 
        }
        var recon_balance =rec.getValue('custrecord_recon_balance');
        rec.setValue({fieldId: 'custrecord_recon_reconciled',value:recon_balance==0?'已銷帳':'待銷帳',ignoreFieldChange: true});
        log.debug('context.type',context.type)    
        if (context.type == "create" ){


        }

    }

    function afterSubmit(context) {
     
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search','N/ui/serverWidget','N/error'], function(record, runtime, config, search,serverWidget,error) {

    function beforeLoad(context) {
        var rec = context.newRecord;
        if (context.type == "create"){
            var parameter=context.request.parameters;
            if(parameter!=null&&parameter!=undefined&&parameter!=''){
                var payment_data = context.request.parameters['payment_data'];      
                log.debug('payment_data', payment_data); 
                rec.setValue({fieldId: 'custbody_payment_data',value:payment_data});
                             
            }         
        }
    
       
    }

    function beforeSubmit(context) {
        if(context.type != "delete"){
            var current_rec = context.newRecord;
            var parameterValue =current_rec.getValue('custbody_payment_data'); 
            if(parameterValue!='' && parameterValue!=undefined && parameterValue!=null){ 
                var payment_data = JSON.parse(parameterValue);  
                var reconcili_amt =parseFloat(payment_data.reconcili_amt);           
                var payment =current_rec.getValue('payment'); 
                if(reconcili_amt!=payment){           
                    var err = error.create({
                        name: '注意',
                        message: '有綁定對帳資料，PAYMENT AMOUNT請輸入金額:'+reconcili_amt,
                        notifyOff: true
                    });
        
                    throw err;  
                }
            } 
        }    
     

    }

    function afterSubmit(context) {
        log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
        log.debug('context.type', context.type);
        if (context.type == "edit" || context.type == "create"||context.type == "delete"){ 
            var rec = context.newRecord;
            var parameterValue =rec.getValue('custbody_payment_data');
            log.debug('parameterValue', parameterValue);
            if(parameterValue!=''&&parameterValue!=null&&parameterValue!=undefined){
                var payment_data = JSON.parse(parameterValue); 
                log.debug('payment_data', payment_data);
                log.debug('payment_data.length', payment_data.data_list.length);                
                for(var i=0;i<payment_data.data_list.length;i++){
                    var sub_data=payment_data.data_list[i];
                    var reconcili_rec = record.load({
                        type: 'customrecord_reconciliation_data',
                        id: sub_data.data_id,
                        isDynamic: false
                    }) ;                    
                    var deposit_amount =reconcili_rec.getValue('custrecord_recon_deposit_amount');
                    log.debug("o_deposit_amount",deposit_amount);
                    var recon_transaction =reconcili_rec.getValue('custrecord_recon_transaction');
                    log.debug('recon_transaction', recon_transaction);
                    var check=false;
                    for(var j=0;j<recon_transaction.length;j++){
                        if(recon_transaction[j]==rec.id)check=true;
                    }
                    if(check==false){
                        recon_transaction.push(rec.id);
                    }                 
                    if(context.type != "delete")reconcili_rec.setValue({fieldId: 'custrecord_recon_transaction',value:recon_transaction,ignoreFieldChange: true}); 
                    if(recon_transaction.length>0){
                        var filter= ["internalid","anyof"];
                        for(var j=0;j<recon_transaction.length;j++){
                            filter.push(recon_transaction[j]);
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
                            for(var j=0;j<deposit_data.data_list.length;j++){
                                var sub_data=deposit_data.data_list[j];
                                if(sub_data.data_id==reconcili_rec.id){
                                    deposit_amount-=parseFloat(sub_data.balance_amount);                       
                                }
                            }
                           
                         }
                         log.debug("deposit_amount",deposit_amount);
                         reconcili_rec.setValue({fieldId: 'custrecord_recon_balance',value:deposit_amount,ignoreFieldChange: true});
                         var recon_balance =reconcili_rec.getValue('custrecord_recon_balance');
                         reconcili_rec.setValue({fieldId: 'custrecord_recon_reconciled',value:recon_balance==0?'已銷帳':'待銷帳',ignoreFieldChange: true});
                         reconcili_rec.save();  
                    } 
                }
            }   
           
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

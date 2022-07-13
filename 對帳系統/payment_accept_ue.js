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
                var payment_amount=0;     
                for(var i=0;i<payment_data.pay_list.length;i++){
                    var invoice_paymentamount=parseFloat(payment_data.pay_list[i].invoice_paymentamount);
                    payment_amount+=invoice_paymentamount;
                }
                var payment =current_rec.getValue('payment'); 
                if(payment_amount!=payment){
                    var err = error.create({
                        name: '注意',
                        message: '有綁定對帳資料，PAYMENT AMOUNT請輸入金額:'+payment_amount,
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
                log.debug('payment_data.reconcili_id', payment_data.reconcili_id);
                if(payment_data.reconcili_id!=''&&payment_data.reconcili_id!=null&&payment_data.reconcili_id!=undefined){
                        
                    var reconcili_rec = record.load({
                        type: 'customrecord_reconciliation_data',
                        id: payment_data.reconcili_id,
                        isDynamic: false
                    }) ;
                    var deposit_amount =reconcili_rec.getValue('custrecord_recon_deposit_amount');
                    var recon_transaction =reconcili_rec.getValue('custrecord_recon_transaction');
                    log.debug('recon_transaction', recon_transaction);
                    var check=false;
                    for(var i=0;i<recon_transaction.length;i++){
                        if(recon_transaction[i]==rec.id)check=true;
                    }
                    if(check==false){
                        recon_transaction.push(rec.id);
                    }                 
                    if(context.type != "delete")reconcili_rec.setValue({fieldId: 'custrecord_recon_transaction',value:recon_transaction,ignoreFieldChange: true}); 
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
                                if(sub_data.data_id==reconcili_rec.id){
                                    deposit_amount-=parseFloat(sub_data.balance_amount);                       
                                }
                            }
                           
                         }
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

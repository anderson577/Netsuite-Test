/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/ui/message','N/https', 'N/runtime' ], 
function(currentRecord, record, search, url, message ,https,runtime ) {
 
      function pageInit(context) {
        var current_rec = context.currentRecord;         
        var parameterValue =current_rec.getValue('custbody_payment_data');   
        console.log('parameterValue',parameterValue);
        
        if(parameterValue!='' && parameterValue!=undefined && parameterValue!=null&&current_rec.id == ''){                
                   var payment_data = JSON.parse(parameterValue);
                   log.debug('currency', payment_data.currency); 
                   current_rec.setText({fieldId: 'currency',text:payment_data.currency,ignoreFieldChange: false});                      
                //    var linecount = current_rec.getLineCount({ sublistId: 'apply'}); 
                //    log.debug('linecount', linecount); 
                //    for(var i=0;i<payment_data.length;i++){
                //         var invoice_tranid=payment_data[i].invoice_tranid;
                //         var invoice_paymentamount=payment_data[i].invoice_paymentamount;
                //         log.debug('invoice_tranid', invoice_tranid); 
                //         log.debug('invoice_paymentamount', invoice_paymentamount); 
                //         for(var j=0;j<linecount;j++){
                //             var refnum=current_rec.getSublistValue({sublistId: 'apply', fieldId: 'refnum', line: j});
                //             if(refnum==invoice_tranid){
                //                 log.debug('refnum', refnum);
                //                 current_rec.selectLine({sublistId: 'apply',line: j});
                //                 current_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount',value: parseFloat(invoice_paymentamount),ignoreFieldChange: false});  
                //                 current_rec.commitLine({sublistId: 'apply'});                             
                //             }
                //         }
                //    }
               

    
        } 
                 
      }
      function fieldChanged(context){
        log.debug('context', context); 
        var current_rec = context.currentRecord  
        if ((context.fieldId == "trandate"||context.fieldId == "account") && current_rec.id == ''){
            var parameterValue =current_rec.getValue('custbody_payment_data');  
            
            if(parameterValue!='' && parameterValue!=undefined && parameterValue!=null){                
                       var payment_data = JSON.parse(parameterValue);                
                       var linecount = current_rec.getLineCount({ sublistId: 'apply'}); 
                       log.debug('linecount', linecount); 
                       for(var i=0;i<payment_data.pay_list.length;i++){
                            var invoice_tranid=payment_data.pay_list[i].invoice_tranid;
                            var invoice_paymentamount=payment_data.pay_list[i].invoice_paymentamount;
                            log.debug('invoice_tranid', invoice_tranid); 
                            log.debug('invoice_paymentamount', invoice_paymentamount); 
                            for(var j=0;j<linecount;j++){
                                var refnum=current_rec.getSublistValue({sublistId: 'apply', fieldId: 'refnum', line: j});
                                if(refnum==invoice_tranid){
                                    log.debug('refnum', refnum);
                                    current_rec.selectLine({sublistId: 'apply',line: j});
                                    current_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount',value: parseFloat(invoice_paymentamount),ignoreFieldChange: false});
                                    current_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply',value: true,ignoreFieldChange: false});   
                                    current_rec.commitLine({sublistId: 'apply'});                             
                                }
                            }
                       }
                   
    
        
            }    
        }

      }
      function postSourcing(context) {

      }
      function saveRecord(context) {
        var current_rec = context.currentRecord;
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
                alert('有綁定對帳資料，PAYMENT AMOUNT請輸入金額:'+payment_amount);
                return false;
            }
        } 

        return true;
    }
      return {
          pageInit: pageInit, 
          fieldChanged: fieldChanged,
          postSourcing:postSourcing,
          saveRecord:saveRecord       
      }
  });
  
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
            current_rec.setValue({fieldId: 'payment',value:parseFloat(payment_data.reconcili_amt),ignoreFieldChange: true});
            current_rec.setText({fieldId: 'currency',text:payment_data.select_currency,ignoreFieldChange: true}); 
    
        } 
                 
      }
      function fieldChanged(context){
        log.debug('context', context); 
        var current_rec = context.currentRecord  
      

      }
      function saveRecord(context) {
        var current_rec = context.currentRecord;
        var parameterValue =current_rec.getValue('custbody_payment_data'); 
        if(parameterValue!='' && parameterValue!=undefined && parameterValue!=null){ 
            var payment_data = JSON.parse(parameterValue);  
            var reconcili_amt =parseFloat(payment_data.reconcili_amt);           
            var payment =current_rec.getValue('payment'); 
            if(reconcili_amt!=payment){
                alert('有綁定對帳資料，PAYMENT AMOUNT請輸入金額:'+reconcili_amt);
                return false;
            }
        } 

        return true;
    }
  
      return {
          pageInit: pageInit, 
          fieldChanged: fieldChanged,
          saveRecord:saveRecord       
      }
  });
  
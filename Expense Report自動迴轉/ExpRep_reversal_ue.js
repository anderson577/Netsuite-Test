/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/runtime','N/record', 'N/search','N/ui/serverWidget', 'N/format'], 
function(runtime,record,search,serverWidget,format) {

    function beforeLoad(context) {
        // Create Deposit
        // WHICH MODE WANNA ADD, CREATE, EDIT, VIEW
        var form = context.form     
        log.debug('context.type',context.type);
        var rec = context.newRecord;
      
        if (context.type === context.UserEventType.VIEW &&runtime.executionContext === runtime.ContextType.USER_INTERFACE) { 
            var statusRef= rec.getText('statusRef');
            log.debug('statusRef',statusRef);
            var payments= rec.getValue('payments');
            log.debug('payments',payments);
            if(statusRef=='approvedByAcct' && payments=='F'){ 
    
                form.addButton({
                    id: 'custpage_reversal',
                    label: '迴轉',
                    functionName: 'reversal'
                });  

                form.clientScriptModulePath =  './ExpRep_reversal_cs.js';
            } 

        }
     
    }

  
   
    function beforeSubmit(context) {
       
      

        
    }
    function afterSubmit(context) {
     
         
    }
   
    return {
        beforeLoad: beforeLoad,
        beforeSubmit:beforeSubmit,
        afterSubmit: afterSubmit,     
    }
});


/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/email','./SF_GlobalUtilities.js']
 , function(runtime, search, record,email,format,https,file,task,error,email,SF) {

   function execute(context) {

    
     try {
         var custscript_internalid_l=runtime.getCurrentScript().getParameter({ name: 'custscript_internalid_l' });
         log.debug("custscript_internalid_l", custscript_internalid_l);
         var custscript_sync_type=runtime.getCurrentScript().getParameter({ name: 'custscript_sync_type' });
         log.debug("custscript_sync_type", custscript_sync_type);
         var internalid_l=JSON.parse(custscript_internalid_l);
         for (var i = 0; i < internalid_l.length; i++){
            if(custscript_sync_type=='invoice'){
               SF.updateInv(internalid_l[i],true);
            }
            if(custscript_sync_type=='po'){
               SF.updatePO(internalid_l[i]);
            }            
        }


     } catch (error) {
        log.error('error', error);
        email.send({
         author: 25968,
         recipients: [25968,12774],
         subject: '注意!!更新SF串接PO,INV狀態錯誤',
         body: error,       
       });
     }
  
     
   }

  
  
   return {
       execute: execute
   }
});

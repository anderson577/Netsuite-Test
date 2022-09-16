/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/email', 'N/render','N/url']
 , function(runtime, search, record,email,format,https,file,task,error,email,render,url) {

   function execute(context) {

  
     try {


        var scriptUrl = url.resolveScript({
        scriptId: "customscript_dunning_letter_sl",
        deploymentId: "customdeploy_dunning_letter_sl",
        returnExternalUrl: true,
        params:{ cus_id:348,mode:'send',inv_L:'all'}
        });
        //log.debug('scriptUrl',scriptUrl);
        var response = https.get({url: scriptUrl});
        if(response.body=="success"){
          log.debug('cus:348',response);
        }else{
          log.error('cus:348',response);
        }
      
     } catch (error) {
        log.error('error', error);
        email.send({
         author: 25968,
         recipients: [25968],
         subject: '注意!催款信錯誤',
         body: error,       
       });
     }
  
     
   }
   
  
   return {
       execute: execute
   }
});

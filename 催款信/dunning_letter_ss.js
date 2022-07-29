/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/email', 'N/render']
 , function(runtime, search, record,email,format,https,file,task,error,email,render) {

   function execute(context) {

  
     try {
      var xmlTmplFile = file.load({
            id: "../Html/dunning_letter.html" ,
      });

      var renderer = render.create();
      renderer.templateContent = xmlTmplFile.getContents();
      

      var xmlStr = renderer.renderAsString();
      log.debug('xmlStr', xmlStr);
      email.send({
         author: 25968,
         recipients: [25968],
         subject: '【博弘雲端科技(股)公司】催收帳款通知信 - 曜智科技股份有限公司',
         body: xmlStr,       
       });
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

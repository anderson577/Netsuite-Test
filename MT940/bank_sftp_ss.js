/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/email','N/sftp','N/url']
 , function(runtime, search, record,email,format,https,file,task,error,email,sftp,url) {

   function execute(context) {
      
     try {
      var objConnection = sftp.createConnection({
         username: 'NSU01',
         passwordGuid: '90b26d2aa9ce488cafdb9cfb27523c23',//[customdeploy_bank_sftp_ss],ps:4321qwer
         url: 'chpw.nextlink.com.tw',
         directory: '',
        // hostKeyType:'rsa',
         hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQC4Oki+QxDzArz4T7ZtUrI+0B3gvkJwDlOY8G6Gj7ZOAFkz/9SmO5EUisfKt0ljVyVim/nJCKOdmKfgvjQ5j5c1rDidbTj/jw4frf461iT86NvAJIu31yNlQM+qfFT+t2xjlDn3x4JcduuSAeGZYWJ80uXg+qkEkIAvRGllt7yy/xWLssnrfl+/VDP6in10EWw3iIT8RkVoRkrWkavdFClsReh3F0f/NnBdIaGL0zFCTib2j7QIrwDIT8bwDanesTq6G9g+LemCDxSGm4KDMBRpHYA1WXM/TJYY1WVobdfA1l0KnPhyM7iqkVE/1Pn1apcRn7/TutHx2cONty8wkyJF'
     });

     log.debug('objConnection',objConnection);
     var folderObj = file.load({
      id: '../MT940F/mt940_folder.txt'
     });
     LoadData(objConnection,'Citi',folderObj,'customscript_load_mt940_sl','customdeploy_load_mt940_sl');//花旗銀行
     LoadData(objConnection,'Esun',folderObj,'customscript_load_esunbank_sl','customdeploy_load_esunbank_sl');//玉山銀行
     LoadData(objConnection,'Land',folderObj,'customscript_load_landbank_sl','customdeploy_load_landbank_sl');//土地銀行

     } catch (error) {
      log.debug('error',error)
     }
  
     
   }
   
  
  function formatDate(date) {
     var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI});
     return  newdateString.substr(0,newdateString.indexOf(' '))          
     
  }

  function LoadData(objConnection,bank,folderObj,scriptId,deploymentId){
    var file_list = objConnection.list({path: '/Pending/'+bank})
    log.debug('file_list',file_list)
    for(var i = 0; i < file_list.length; i++){
      log.debug('file',file_list[i].name);
      log.debug('file size',file_list[i].size);
     
      if(file_list[i].size>0){
         var downloadedFile = objConnection.download({
            directory: '/Pending/'+bank,
            filename: file_list[i].name
        });
     
        downloadedFile.encoding = file.Encoding.BIG5;
        downloadedFile.folder=folderObj.folder;
        downloadedFile.save();
     
        var scriptUrl = url.resolveScript({
         scriptId: scriptId,
         deploymentId: deploymentId,
         returnExternalUrl: true,
         params:{ filename: file_list[i].name}
         });
         var response = https.get({url: scriptUrl});
         log.debug(bank+'_data_'+i,response);
        //var data=downloadedFile.getContents();
        //log.debug('data',data)
         objConnection.move({
            from: '/Pending/'+bank+'/'+file_list[i].name,
            to: '/Archive/'+bank+'/'+file_list[i].name,
        });
      }
      // Archive File
    
  
  }
  }
  
  
   return {
       execute: execute
   }
});

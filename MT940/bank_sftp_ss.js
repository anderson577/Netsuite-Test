/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/sftp','N/url','N/config']
 , function(runtime, search, record,email,format,https,file,task,error,sftp,url,config) {
   
   var path='',move_path='';
   function execute(context) {
      
     try {
        var companyInfo = config.load({
            type: config.Type.COMPANY_INFORMATION
        });
        
        var companyid = companyInfo.getValue({
            fieldId: 'companyid'
        });
        log.debug('companyid',companyid);
       
        path=companyid.indexOf('_SB1')==-1?'/Pending/':'/Pending/';//!!!!上正式區須調整
        move_path=companyid.indexOf('_SB1')==-1?'/Archive/':'/Archive(SB)/';
       
        var objConnection = sftp.createConnection({
            username: 'NSU01',
            passwordGuid: '7733326a5b8247758178f5e2fd057cfd',//[customdeploy_bank_sftp_ss],ps:4321qwer
            url: 'exciti.nextlink.com.tw',
            directory: '',
            // hostKeyType:'rsa',
            hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQC4Oki+QxDzArz4T7ZtUrI+0B3gvkJwDlOY8G6Gj7ZOAFkz/9SmO5EUisfKt0ljVyVim/nJCKOdmKfgvjQ5j5c1rDidbTj/jw4frf461iT86NvAJIu31yNlQM+qfFT+t2xjlDn3x4JcduuSAeGZYWJ80uXg+qkEkIAvRGllt7yy/xWLssnrfl+/VDP6in10EWw3iIT8RkVoRkrWkavdFClsReh3F0f/NnBdIaGL0zFCTib2j7QIrwDIT8bwDanesTq6G9g+LemCDxSGm4KDMBRpHYA1WXM/TJYY1WVobdfA1l0KnPhyM7iqkVE/1Pn1apcRn7/TutHx2cONty8wkyJF'
        });

        log.debug('objConnection',objConnection);
        var folderObj = file.load({
        id: '../MT940F/mt940_folder.txt'
        });
        LoadData(objConnection,'Citi',folderObj);//花旗銀行
        LoadData(objConnection,'Esun',folderObj);//玉山銀行
        LoadData(objConnection,'Land',folderObj);//土地銀行 

     } catch (error) {
      log.debug('error',error);
      email.send({
        author: 25968,
        recipients: [25968],
        subject: '【BUG】虛擬帳戶SFTP主機連線錯誤',
        body: error,      
      });
     }
  
     
   }
   
  
  function formatDate(date) {
     var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI});
     return  newdateString.substr(0,newdateString.indexOf(' '))          
     
  }

  function LoadData(objConnection,bank,folderObj){
    var file_list = objConnection.list({path: path+bank})
    log.debug('file_list',file_list)
    for(var i = 0; i < file_list.length; i++){
      log.debug('file',file_list[i].name);
      log.debug('file size',file_list[i].size);
     
      if(file_list[i].size>0){
         var downloadedFile = objConnection.download({
            directory: path+bank,
            filename: file_list[i].name
        });
        downloadedFile.encoding = file.Encoding.BIG5;       
        downloadedFile.folder=folderObj.folder;
        downloadedFile.name=downloadedFile.name.indexOf('.txt')==-1?downloadedFile.name+'.txt':downloadedFile.name;
        downloadedFile.save();
     
        var initial_deploymentId = "";
        var deploy_obj = get_deploy_id("customscript_load_bank_data_ss");
        log.debug("deploy_obj", deploy_obj);

        if (deploy_obj != null) {
            deploy_obj.every(function (result) {
                var check = chk_deploy_status(result.internalid);
                //log.debug(result.internalid, result.scriptid + '-' + check)
                if (check) {
                    initial_deploymentId = result.scriptid;
                }
                return true;
            })
        }
        log.debug("initial_deploymentId", initial_deploymentId);           
        if (initial_deploymentId != '') {
            var scriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_load_bank_data_ss',
                deploymentId: initial_deploymentId,
                params: {
                  custscript_bank: bank,
                  custscript_filename:downloadedFile.name                   
                }
            });

            var scriptTaskId = scriptTask.submit();
        }

      
        //var data=downloadedFile.getContents();
        //log.debug('data',data)
         objConnection.move({
            from: path+bank+'/'+file_list[i].name,
            to: move_path+bank+'/'+file_list[i].name,
        });
      }
      // Archive File
    
  
  }
  }
  function get_deploy_id(scriptid) {
   var scriptdeploymentSearchObj = search.create({
       type: "scriptdeployment",
       filters:
           [
               ["script.scriptid", "startswith", scriptid]
           ],
       columns:
           [
               search.createColumn({
                   name: "title",
                   sort: search.Sort.ASC,
                   label: "Title"
               }),
               search.createColumn({ name: "scriptid", label: "Custom ID" }),
               search.createColumn({ name: "script", label: "Script ID" }),
               search.createColumn({ name: "recordtype", label: "Record Type" }),
               search.createColumn({ name: "status", label: "Status" }),
               search.createColumn({ name: "isdeployed", label: "Is Deployed" }),
               search.createColumn({ name: "scripttype", label: "Script Type" }),
               search.createColumn({ name: "internalid", label: "Internal ID" })
           ]
   });
   var results = new Array();
   scriptdeploymentSearchObj.run().each(function (result) {
       // .run().each has a limit of 4,000 results
       results.push({
           "internalid": result.getValue("internalid"),
           "scriptid": result.getValue("scriptid"),
       })
       return true;
   });

   return results;
}

function chk_deploy_status(deployid) {

   var scheduledscriptinstanceSearchObj = search.create({
       type: "scheduledscriptinstance",
       filters:
           [
               ["scriptdeployment.internalid", "anyof", deployid],
               "AND",
               ["status", "anyof", "PENDING", "PROCESSING", "RETRY"]
           ],
       columns:
           [
               search.createColumn({
                   name: "datecreated",
                   sort: search.Sort.ASC,
                   label: "Date Created"
               }),
               search.createColumn({ name: "startdate", label: "Start Date" }),
               search.createColumn({ name: "enddate", label: "End Date" }),
               search.createColumn({ name: "mapreducestage", label: "Map/Reduce Stage" }),
               search.createColumn({ name: "status", label: "Status" }),
               search.createColumn({ name: "percentcomplete", label: "Percent Complete" }),
               search.createColumn({
                   name: "scriptid",
                   join: "scriptDeployment",
                   label: "Custom ID"
               }),
               search.createColumn({ name: "taskid", label: "Task ID" })
           ]
   });
   var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
   if (searchResultCount == 0) {
       return true
   } else {
       return false
   }

}  

  
   return {
       execute: execute
   }
});

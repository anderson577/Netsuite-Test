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
         var end_ind=internalid_l.length>50?50:internalid_l.length;
         for (var i = 0; i < end_ind; i++){
            if(custscript_sync_type=='invoice'){
               SF.updateInv(internalid_l[i],true);
            }
            if(custscript_sync_type=='po'){
               SF.updatePO(internalid_l[i]);
            }            
        }
        if(internalid_l.length>50){
            var new_internalid_L=[];
            for (var j = 50; j < internalid_l.length; j++){
               new_internalid_L.push(internalid_l[j]);
           }
           if(new_internalid_L.length>0){
            var initial_deploymentId = ""
            var deploy_obj = get_deploy_id("customscript_refresh_sync_poinv_ss");
            log.debug("deploy_obj", deploy_obj);

            if (deploy_obj != null) {
                deploy_obj.every(function (result) {
                    var check = chk_deploy_status(result.internalid);
                    log.debug(result.internalid, result.scriptid + '-' + check)
                    if (check) {
                        initial_deploymentId = result.scriptid;
                    }
                    return true;
                })
            }           
            if (initial_deploymentId != '') {
                var scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_refresh_sync_poinv_ss',
                    deploymentId: initial_deploymentId,
                    params: {
                        custscript_internalid_l: JSON.stringify(new_internalid_L),
                        custscript_sync_type:custscript_sync_type                   
                    }
                });
    
                var scriptTaskId = scriptTask.submit();
            }
       
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

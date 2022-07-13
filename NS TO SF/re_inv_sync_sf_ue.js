/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','N/task'],
 function(record, runtime, search, serverWidget, format,https,task) {

    function beforeLoad(context) {
     
     
    }

    function beforeSubmit(context) {
    
    }

    function afterSubmit(context) {
        log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
        if (context.type == "edit" || context.type == "create" || context.type == "xedit"||context.type == "delete"){        
            var rec = context.newRecord;
            var linecount = rec.getLineCount({ sublistId:'apply'}); 
            log.debug('linecount', linecount);
            var internalid_L=[];
            for (var i = 0; i < linecount; i++){
                var trantype=rec.getSublistValue({ sublistId: 'apply', fieldId : 'trantype', line:i });             
                //log.debug('trantype', trantype);              
                if(trantype=='CustInvc'){  
                    var internalid=rec.getSublistValue({ sublistId: 'apply', fieldId : 'internalid', line:i });
                    log.debug('internalid', internalid); 
                    if(internalid_L.indexOf(internalid)==-1)internalid_L.push(internalid);
                }
            
            }
            if(internalid_L.length>0){
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
                            custscript_internalid_l: JSON.stringify(internalid_L),
                            custscript_sync_type:'invoice'                   
                        }
                    });
        
                    var scriptTaskId = scriptTask.submit();
                }
           
            } 

          
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
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

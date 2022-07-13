/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js'],
 function(record, runtime, search, serverWidget, format,https,SF) {

    function beforeLoad(context) {
        if (context.type == "create" || context.type == "copy"){ 
            var rec = context.newRecord;
            rec.setValue({fieldId: 'custbody_sf_connect_status',value:null,ignoreFieldChange: true});
            rec.setValue({fieldId: 'custbody_sf_connect_message',value:null,ignoreFieldChange: true});
            rec.setValue({fieldId: 'custbody_sf_id',value:null,ignoreFieldChange: true});

        }
     
    }

    function beforeSubmit(context) {
    
    }

    function afterSubmit(context) {
        log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
        if (context.type == "edit" || context.type == "create" || context.type == "xedit"){        

            var id = context.newRecord.id;           
            SF.updateInv(id,false);

          
        }
        if (context.type == "delete"){
            var createdfrom = context.newRecord.getValue('createdfrom');
            if(createdfrom!=''){
                SF.updateSO(createdfrom);
            }
        }
    }
   
    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

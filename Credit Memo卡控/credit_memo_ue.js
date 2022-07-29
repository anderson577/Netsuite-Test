/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js','N/error'],
 function(record, runtime, search, serverWidget, format,https,SF,error) {

    function beforeLoad(context) {
        var rec = context.newRecord;
        if (context.type == "create" ){ 
            var form=context.form;
            var apply = form.getSublist({
                id : 'apply'
            });
            log.debug("apply", apply);
            //apply.displayType = serverWidget.SublistDisplayType.HIDDEN;
            var tabs = form.getTabs();
            log.debug("tabs", tabs);
            var linecount = rec.getLineCount({ sublistId: 'apply'});
            for(var i=0;i<linecount;i++){
                //rec.setSublistValue({sublistId: 'apply',fieldId: 'apply',line: i,value:false});             
            }

            log.debug("linecount", linecount);

        }
    }

    function beforeSubmit(context) { 
  
    }

    function afterSubmit(context) {  
    }
   

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js'],
 function(record, runtime, search, serverWidget, format,https,SF) {

    function beforeLoad(context) {
        //log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
        if (context.type == "copy"){        

            var rec = context.newRecord;
            var entity=rec.getValue('entity');
            if(entity!=''){
                var cus_rec=search.lookupFields({
                    type: 'customer',
                    id: entity,
                    columns: ['terms']
                });
                log.debug('cus_rec', cus_rec);
                if(cus_rec.terms.length!=0){
                    rec.setValue({fieldId: 'terms',value:cus_rec.terms[0].value,ignoreFieldChange: true});
                }else{
                    rec.setValue({fieldId: 'terms',value:null,ignoreFieldChange: true});
                }                
                
            }
          
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

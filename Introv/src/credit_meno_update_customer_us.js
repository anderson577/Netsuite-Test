/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],
 function(record, runtime, search) {

    function beforeLoad(context) {
       
     
    }

    function beforeSubmit(context) {
    
    }

    function afterSubmit(context) {
        log.debug('context', context);
        log.debug('executionContext', runtime.executionContext);
   
        if (context.type == "edit" || context.type == "create" || context.type =="xedit"){  

            var newRecord = context.newRecord;
            var entity = newRecord.getValue({ fieldId:'entity'}); 
            
            log.debug('context.newRecord', context.newRecord);
            log.debug("entity",entity);
            if(!entity||context.type =="xedit"){
                entity = context.oldRecord.getValue({ fieldId:'entity'});
                log.debug("entity by type xedit",entity);
            }
            

            var customSearchObj = search.load({id:'customsearch_iv_insuff_credit_alert_3'});

              customSearchObj.filters.push(search.createFilter({
                name: 'internalidnumber',
                join: 'customer',
                operator: 'equalto',
                values: entity
            }));

             var searchResultCount = customSearchObj.runPaged().count;
              log.debug("customSearchObj result count",searchResultCount);
              var avg = '';
              customSearchObj.run().each(function(result){
                avg = result.getValue(result.columns[4]);
                return true;
              })

               var rec = record.load({
                    type: 'customer',
                    id: entity,
                    isDynamic: true
              });

              
              rec.setValue('custentity_iv_threemonthssales',avg);
              var recordId = rec.save();
             
        }  
    }
    

    return {
        afterSubmit: afterSubmit
    }
});

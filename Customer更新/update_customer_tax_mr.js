/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */


define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/config','N/action'],
    function(search, record, runtime, error, format, config,actionMod)
    {
        function getInputData(context){
            log.debug('In Get Input data Stage', context);

            var customerSearchObj = search.create({
                type: "customer",
                filters:
                [
                //    ["formulatext: TO_NUMBER({vatregnumber})","isempty",""], 
                //    "AND", 
                //    ["vatregnumber","isnot","N/A"]
                    ["vatregnumber","is",""], 
                    "AND", 
                    ["hasduplicates","is","T"]
                ],
                columns:
                [               
                ]
             });
          
             var searchResultCount = customerSearchObj.runPaged().count;
             log.debug("customerSearchObj result count",searchResultCount);
        
            
            return customerSearchObj;
        }

        function map(context){
            //log.debug('In Map Stage');
          var searchResult = JSON.parse(context.value);
          log.debug('searchResult',searchResult);
          try{
            var objRecord = record.load({
                type: searchResult.recordType, 
                id: searchResult.id,
                isDynamic: false,
            });
            // var vatregnumber= objRecord.getValue('vatregnumber');
            // var comments= objRecord.getValue('comments');

            // if(vatregnumber!=''){
            //     objRecord.setValue({fieldId: 'comments',value:comments+'\n舊Tax Number:'+vatregnumber,ignoreFieldChange: true}); 
            // }
            objRecord.setValue({fieldId: 'vatregnumber',value:'N/A',ignoreFieldChange: true});            
            objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            }); 
         
          
          }catch(e){
          
          }
           
            
        }        

        function summarize(context) {
            log.debug('In summarize Stage');
        }

      

     
       

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });
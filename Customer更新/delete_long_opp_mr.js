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
                    ["hasduplicates","is","T"], 
                    "AND", 
                    ["stage","anyof","PROSPECT","LEAD"], 
                    "AND", 
                    ["datecreated","before","2021/1/1"]                
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
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                [
                   ["mainline","is","T"], 
                   "AND", 
                   ["name","anyof",searchResult.id]
                ],
                columns:
                [  
                    search.createColumn({
                        name: "type",
                        sort: search.Sort.ASC,
                        label: "Type"
                     }),             
                ]
             });
           
             transactionSearchObj.run().each(function(result){
                record.delete({
                    type: result.recordType,
                    id: result.id,
                   });
                return true;
             });  
             
             var contactSearchObj = search.create({
                type: "contact",
                filters:
                [
                   ["company","anyof",searchResult.id]
                ],
                columns:
                [
                  
                ]
             });          
             contactSearchObj.run().each(function(result){
                record.delete({
                    type: result.recordType,
                    id: result.id,
                   });
                return true;              
             });

             var taskSearchObj = search.create({
                type: "task",
                filters:
                [
                   ["company","anyof",searchResult.id]
                ],
                columns:
                [
                   
                ]
             });
          
             taskSearchObj.run().each(function(result){
                record.delete({
                    type: result.recordType,
                    id: result.id,
                   });
                return true;
             });

             var phonecallSearchObj = search.create({
                type: "phonecall",
                filters:
                [
                   ["company","anyof",searchResult.id]
                ],
                columns:
                [                 
                ]
             });           
             phonecallSearchObj.run().each(function(result){
                record.delete({
                    type: result.recordType,
                    id: result.id,
                   });
                return true;
             });

            record.delete({
                type: searchResult.recordType,
                id: searchResult.id,
               });
         
         
          
          }catch(e){
            log.error('error-searchResult',searchResult);
            log.error("error",e);
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
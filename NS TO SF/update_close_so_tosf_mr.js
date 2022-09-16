/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/config','N/action'],
    function(search, record, runtime, error, format, config,actionMod)
    {
        function getInputData(context){
            log.debug('In Get Input data Stage', context);
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                   ["type","anyof","SalesOrd"], 
                   "AND", 
                   ["systemnotes.field","anyof","TRANDOC.KSTATUS"], //Document Status
                   "AND", 
                   ["systemnotes.newvalue","is","Closed"], 
                   "AND", 
                   ["status","anyof","SalesOrd:H"], //close
                   "AND", 
                   ["mainline","is","T"], 
                   "AND", 
                   ["systemnotes.date","on","yesterday"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "trandate",
                      sort: search.Sort.ASC,
                      label: "Date"
                   }),
                   search.createColumn({name: "print", label: "Print"}),
                   search.createColumn({name: "type", label: "Type"}),
                   search.createColumn({name: "payrollbatch", label: "Payroll Batch"}),
                   search.createColumn({
                      name: "tranid",
                      sort: search.Sort.ASC,
                      label: "Document Number"
                   }),
                   search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                   search.createColumn({name: "entity", label: "Name"}),                 
                ]
             });
             var searchResultCount = salesorderSearchObj.runPaged().count;
             log.debug("salesorderSearchObj result count",searchResultCount);
                    
        
            
            return salesorderSearchObj;
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
                 
            objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
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
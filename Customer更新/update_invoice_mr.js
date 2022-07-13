/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
// var SAVED_SEARCH_ID = 'customsearch127';

define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/config','N/action','./SF_GlobalUtilities.js'],
    function(search, record, runtime, error, format, config,actionMod,SF)
    {
        function getInputData(context){
            log.debug('In Get Input data Stage', context);          
                   
         
            var transactionSearchObj = search.create({
                type: "invoice",
                filters:
                [
                   ["mainline","is","T"], 
                   "AND", 
                   ["custbody_sf_id","isnotempty",""], 
                //    "AND", 
                //    ["internalid","anyof","619605"]
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
                   search.createColumn({
                      name: "tranid",
                      sort: search.Sort.ASC,
                      label: "Document Number"
                   }),
                   search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                   search.createColumn({name: "entity", label: "Name"}),
                   search.createColumn({name: "account", label: "Account"}),
                   search.createColumn({name: "statusref", label: "Status"}),
                   search.createColumn({name: "memo", label: "Memo"}),
                   search.createColumn({name: "currency", label: "Currency"}),
                   search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                   search.createColumn({name: "amount", label: "Amount"}),
                   search.createColumn({name: "custbody_sf_id", label: "SALESFORCE ID"})
                ]
             });
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("result count",searchResultCount);       
         
     
            return transactionSearchObj;
        }

        function map(context){
            //log.debug('In Map Stage');
          var searchResult = JSON.parse(context.value);
          log.debug('searchResult',searchResult);
          try{
            SF.updateInv(searchResult.id,false);           
         
          
          }catch(e){
            log.error('error',e);
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
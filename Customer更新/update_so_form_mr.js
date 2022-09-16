/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
// var SAVED_SEARCH_ID = 'customsearch127';

define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/config','N/action'],
    function(search, record, runtime, error, format, config,actionMod)
    {
        function getInputData(context){
            log.debug('In Get Input data Stage', context);
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                [
                   ["mainline","is","T"], 
                   "AND", 
                   ["createdby","anyof","24600"], 
                   "AND", 
                   ["trandate","on","2022/8/1"], 
                   "AND", 
                   ["status","anyof","SalesOrd:F"], 
                   "AND", 
                   ["customform","anyof","118"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "trandate",
                      sort: search.Sort.ASC,
                      label: "Date"
                   }),
                   search.createColumn({name: "type", label: "Type"}),
                   search.createColumn({name: "customform", label: "Custom Form"}),
                   search.createColumn({
                      name: "tranid",
                      sort: search.Sort.ASC,
                      label: "Document Number"
                   }),
                   search.createColumn({name: "transactionnumber", label: "Transaction Number"}),
                   search.createColumn({name: "entity", label: "Name"}),
                   search.createColumn({name: "account", label: "Account"}),
                   search.createColumn({name: "otherrefnum", label: "PO/Check Number"}),
                   search.createColumn({name: "statusref", label: "Status"}),
                   search.createColumn({name: "trackingnumbers", label: "Tracking Numbers"}),
                   search.createColumn({name: "memo", label: "Memo"}),
                   search.createColumn({name: "currency", label: "Currency"}),
                   search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                   search.createColumn({name: "amount", label: "Amount"})
                ]
             });
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("transactionSearchObj result count",searchResultCount);
          
        
            
            return transactionSearchObj;
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
            objRecord.setValue({fieldId: 'customform',value:156,ignoreFieldChange: true});            
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
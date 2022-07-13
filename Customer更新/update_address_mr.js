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
                   
         
       
            var group_list=[];        
         
            group_list= search.create({
                    type: "customrecord_sf_opportunity",
                    filters:
                    [
                       ["custrecord_sf_opp_acc","anyof","3301"]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "name",
                          sort: search.Sort.ASC,
                          label: "Name"
                       }),
                       search.createColumn({name: "custrecord_sf_opp_acc", label: "Salesforce Account"}),
                       search.createColumn({
                          name: "custrecord_sf_acc_customer",
                          join: "CUSTRECORD_SF_OPP_ACC",
                          label: "Customer"
                       }),
                       search.createColumn({name: "custrecord_sf_opp_id", label: "SALESFORCE OPPORTUNITY ID"}),
                       search.createColumn({name: "created", label: "Date Created"})
                    ]
                 });
                 var searchResultCount = group_list.runPaged().count;
                 log.debug("group_list result count",searchResultCount);
          
         
     
            return group_list;
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
             
            objRecord.setValue({fieldId: 'custrecord_sf_opp_acc',value:1222,ignoreFieldChange: true}); 
            objRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            }); 
         
          
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
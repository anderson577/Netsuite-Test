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
            var customrecord_sf_accountSearchObj = search.create({
                type: "customrecord_sf_account",
                filters:
                [
                   ["formulanumeric: case when {name}= {custrecord_correct_name} then 1 else 0 end","equalto","0"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                      label: "Name"
                   }),
                   search.createColumn({name: "custrecord_correct_name", label: "Correct Name"}),
                   search.createColumn({
                      name: "formulatext",
                      formula: "CASE WHEN {custrecord_sf_acc_customer.isperson}='T' THEN {custrecord_sf_acc_customer.altname} ELSE {custrecord_sf_acc_customer.companyname} END ",
                      label: "客戶名稱"
                   }),
                   search.createColumn({name: "custrecord_sf_acc_bu", label: "Business Unit (BU)"}),
                   search.createColumn({name: "custrecord_sf_acc_customer", label: "Customer"}),
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "custrecord_sf_acc_id", label: "Salesforce Account ID"}),
                   search.createColumn({name: "created", label: "Date Created"})
                ]
             });
             var searchResultCount = customrecord_sf_accountSearchObj.runPaged().count;
             log.debug("customrecord_sf_accountSearchObj result count",searchResultCount);        
          
        
            
            return customrecord_sf_accountSearchObj;
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
            objRecord.setValue({fieldId: 'custrecord_sf_acc_name',value:searchResult.values['formulatext'],ignoreFieldChange: true});           
            objRecord.setValue({fieldId: 'name',value:searchResult.values['custrecord_correct_name'],ignoreFieldChange: true});           
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
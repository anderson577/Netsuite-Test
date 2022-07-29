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
                   ["formulatext: CASE WHEN UPPER({custrecord_sf_acc_customer.altname}) LIKE UPPER( '%'||{custrecord_sf_acc_name}||'%') THEN 'Y' END ","isempty",""]
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                      label: "Name"
                   }),
                   search.createColumn({name: "custrecord_sf_acc_bu", label: "Business Unit (BU)"}),
                   search.createColumn({name: "custrecord_sf_acc_customer", label: "Customer"}),
                   search.createColumn({
                      name: "formulatext1",
                      formula: "CASE WHEN {custrecord_sf_acc_customer.isperson}='T' THEN  {custrecord_sf_acc_customer.altname} ELSE {custrecord_sf_acc_customer.companyname} END ",
                      label: "客戶名稱"
                   }),
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "custrecord_sf_acc_id", label: "Salesforce Account ID"}),
                   search.createColumn({name: "created", label: "Date Created"}),
                   search.createColumn({
                      name: "formulatext2",
                      formula: "CASE WHEN UPPER({custrecord_sf_acc_customer.altname}) LIKE UPPER( '%'||{custrecord_sf_acc_name}||'%') THEN 'Y' END ",
                      label: "名稱檢查"
                   })
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
            objRecord.setValue({fieldId: 'custrecord_sf_acc_name',value:searchResult.values['formulatext1'],ignoreFieldChange: true});
            var name=searchResult.values['formulatext1']+"("+searchResult.values['custrecord_sf_acc_bu'].text+")";           
            objRecord.setValue({fieldId: 'name',value:name,ignoreFieldChange: true});           
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
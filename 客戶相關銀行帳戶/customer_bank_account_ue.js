/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js','N/error'],
 function(record, runtime, search, serverWidget, format,https,SF,error) {

    function beforeLoad(context) {
      
    }

    function beforeSubmit(context) { 
        var rec = context.newRecord;
        var cba_customer=rec.getValue('custrecord_cba_customer');
        var customrecord_bank_account_relatedSearchObj = search.create({
            type: "customrecord_bank_account_related",
            filters:
            [
               ["custrecord_bar_related_customer","anyof",cba_customer]
            ],
            columns:
            [
               search.createColumn({name: "name", label: "Name"}),
               search.createColumn({
                  name: "custrecord_bar_related_customer",
                  sort: search.Sort.ASC,
                  label: "Related Customer"
               })
            ]
         });
         var bank_account_id='';
         customrecord_bank_account_relatedSearchObj.run().each(function(result){
            bank_account_id=result.id;
            return true;
         });

         if(bank_account_id==''){
            var bank_account_rec = record.create({
                type: 'customrecord_bank_account_related',
                isDynamic: false                   
            });
            bank_account_rec.setValue({fieldId: 'custrecord_bar_related_customer',value:cba_customer});
            bank_account_rec.setValue({fieldId: 'name',value:cba_customer});
            bank_account_id=bank_account_rec.save();
            record.submitFields({
                type: 'customer',
                id: cba_customer,
                values: {
                    'custentity_bank_account_related': bank_account_id
                }
            });
         }
         
         rec.setValue({fieldId: 'custrecord_cba_bank_account_related',value:bank_account_id});
       
    }

    function afterSubmit(context) {  
    }
   

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

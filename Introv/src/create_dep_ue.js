/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search'], function(record, runtime, config, search) {

    function beforeLoad(context) {
        log.debug('beforeLoad context', context)
    }

    function beforeSubmit(context) {

        log.debug('beforeSubmit context.newRecord', context)
    
    }

    function afterSubmit(context) {

        log.debug('afterSubmit context.newRecord', context)
        
        // if (context.type == "create"){
        //     // var id = context.newRecord.id;
        //     // var type = context.newRecord.type;

        //     var rec = context.newRecord

        //     // log.debug('rec', rec)

        //     var linecount = rec.getLineCount({ sublistId: 'apply'});
        //     var dlinecount = rec.getLineCount({ sublistId: 'deposit'});

        //     // log.debug('linecount', linecount)

        //     var configRecObj = config.load({
        //         type: config.Type.COMPANY_PREFERENCES
        //     });
        //     // log.debug('configRecObj', configRecObj.getValue('custscript_iv_caa_bankaccount'))

        //     if(linecount > 0){
        //         var scriptObj = runtime.getCurrentScript();
        //         // log.debug( "Remaining governance units 1: ", scriptObj.getRemainingUsage() );
        //         for(var i = 0; i < linecount; i++){

        //             if(rec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: i}) == true && rec.getSublistValue({sublistId: 'apply', fieldId: 'trantype', line: i}) == 'Custom'){

        //                 var cd_rec = record.create({
        //                     type: "customerdeposit" ,
        //                     isDynamic: false
        //                 });
                        
        //                 cd_rec.setValue({
        //                     fieldId: "customer",
        //                     value:  rec.getValue("customer"),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "payment",
        //                     value:  rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i}),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "class",
        //                     value:  rec.getValue("class"),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "department",
        //                     value:  rec.getValue("department"),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "account",
        //                     value:  configRecObj.getValue('custscript_iv_caa_bankaccount'),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "custbody_iv_advance_id",
        //                     value:  rec.getSublistValue({sublistId: 'apply', fieldId: 'doc', line: i}),
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "custbody21",
        //                     value:  runtime.getCurrentUser().id,
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.setValue({
        //                     fieldId: "custbody_iv_taxincluded",
        //                     value:  true,
        //                     ignoreFieldChange: false
        //                 });

        //                 var taxamt = Math.round((Number(rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) * 100) / 105)
        //                 log.debug('taxamt', taxamt)

        //                 cd_rec.setValue({
        //                     fieldId: "custbody_iv_remaining",
        //                     value:  Number(rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) - taxamt,
        //                     ignoreFieldChange: false
        //                 });

        //                 cd_rec.save();
        //                 // log.debug( "Remaining governance units 2: ", scriptObj.getRemainingUsage() );
        //             }
        //         }
        //     }

        //     if(dlinecount > 0){
        //         var scriptObj = runtime.getCurrentScript();
        //         // log.debug( "Remaining governance units 1: ", scriptObj.getRemainingUsage() );
        //         for(var i = 0; i < dlinecount; i++){

        //             if(rec.getSublistValue({sublistId: 'deposit', fieldId: 'apply', line: i}) == true){

        //                 var taxremain = search.lookupFields({
        //                     type: "customerdeposit",
        //                     id: rec.getSublistValue({sublistId: 'deposit', fieldId: 'doc', line: i}),
        //                     columns: ['custbody_iv_remaining']
        //                 }); 
        //                 log.debug('taxremain', taxremain)

        //                 var amt = rec.getSublistValue({sublistId: 'deposit', fieldId: 'amount', line: i})

        //                 var taxamt = Math.round((Number(amt) * 100) / 105)
        //                 // log.debug('amount '+i, taxamt)
        //                 taxamt = Number(amt) - taxamt

        //                 record.submitFields({
        //                     type: 'customerdeposit',
        //                     id: rec.getSublistValue({sublistId: 'deposit', fieldId: 'doc', line: i}),
        //                     values: {
        //                         custbody_iv_remaining: Number(taxremain.custbody_iv_remaining) - Number(taxamt)
        //                     }
        //                 });
        //             }
        //         }
        //     }
        // }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

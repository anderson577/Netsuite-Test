/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search'], function(record, runtime, config, search) {

    function beforeLoad(context) {
        // log.debug('context',runtime.executionContext)
        if ((context.type === "view" || context.type === "edit") && runtime.executionContext === runtime.ContextType.USER_INTERFACE) {   
            log.debug('context.type', context.type)
            
            var rec = context.newRecord

            var cus_rec = record.load({
                type: 'customer',
                id: rec.getValue('custrecord_iv_cl_customer'),
                isDynamic: false
            });

            rec.setValue({
                fieldId: "custrecord_iv_cl_inst_balance",
                value: cus_rec.getValue('balance'),
                ignoreFieldChange: false
            });


            rec.setValue({
                fieldId: "custrecord_iv_cl_inst_unbilledorders",
                value: cus_rec.getValue('unbilledorders'),
                ignoreFieldChange: false
            });

        }  
    }

    function beforeSubmit(context) {
        // log.debug('beforeSubmit context.type', context.type)
    }

    function afterSubmit(context) {

    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
/**
* @NApiVersion 2.x
* @NScriptType WorkflowActionScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/format', 'N/url', 'N/task'],
function(runtime, search, record, format, url, task) {
    function onAction(scriptContext) {
        
        var newRecord = scriptContext.newRecord;
        // log.debug("newRecord",newRecord)
        var orderid = newRecord.id;
        var ordertype = newRecord.type;
        // log.debug('ordertype', ordertype)
        var scriptObj = runtime.getCurrentScript();
        // log.debug( "Remaining governance units 1: ", scriptObj.getRemainingUsage() );

        try{

            var customerSearchObj = search.create({
                type: "customer",
                filters:
                [
                    ["internalid","anyof", newRecord.getValue('custrecord_iv_cl_customer')]
                ],
                columns:
                [
                    "fxbalance",
                    "fxunbilledorders",
                    "creditlimit"
                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count",searchResultCount);
            var ori_creditlimit = 0
            var ori_balance = 0
            customerSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                ori_creditlimit = result.getValue('creditlimit')
                ori_balance = result.getValue('fxbalance')
                
                record.submitFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    values: {
                        'custrecord_iv_cl_apv_balance': result.getValue('fxbalance'),
                        'custrecord_iv_cl_apv_unbilledorders': result.getValue('fxunbilledorders'),
                        'custrecord_iv_cl_cus_creditlimit': result.getValue('creditlimit'),
                        // 'custrecord_iv_cl_cus_creditlimit': 1600000,
                    }
                });

                return true;
            });

            // log.debug( "Remaining governance units 2: ", scriptObj.getRemainingUsage() );

//            var creditlimit = search.lookupFields({
//                type: "customer",
//                id: newRecord.getValue('custrecord_iv_cl_customer'),
//                columns: ['creditlimit']
//            }).creditlimit;
            // log.debug('creditlimit', creditlimit)
            // log.debug( "Remaining governance units 3: ", scriptObj.getRemainingUsage() );

            record.submitFields({
                type: 'customer',
                id: newRecord.getValue('custrecord_iv_cl_customer'),
                values: {
                    'creditlimit': Number(ori_creditlimit) + Number(newRecord.getValue('custrecord_iv_cl_creditaplc_amt')),
                    //'creditlimit': Number(creditlimit) + Number(newRecord.getValue('custrecord_iv_cl_creditaplc_amt')) + Number(ori_balance),
                    // 'creditlimit': 1600000,
                }
            });

            // log.debug( "Remaining governance units 4: ", scriptObj.getRemainingUsage() );

            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                    ["type","anyof","SalesOrd"], 
                    "AND", 
                    ["custbody_iv_credit_application_id","anyof", orderid], 
                    "AND", 
                    ["mainline","is","T"]
                ],
                columns:
                [
                    "internalid"
                ]
            });
            var searchResultCount = salesorderSearchObj.runPaged().count;
            // log.debug("salesorderSearchObj result count",searchResultCount);
            salesorderSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results

                var inv_rec = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: result.getValue('internalid'),
                    toType: record.Type.INVOICE,
                    isDynamic: false
                });
                // log.debug('inv_rec', inv_rec);
                inv_rec.save();

                return true;
            });

            // log.debug( "Remaining governance units 5: ", scriptObj.getRemainingUsage() );

            record.submitFields({
                type: 'customer',
                id: newRecord.getValue('custrecord_iv_cl_customer'),
                values: {
                    'creditlimit': Number(ori_creditlimit)
                }
            });

            record.submitFields({
                type: newRecord.type,
                id: newRecord.id,
                values: {
                    'custrecord_iv_cl_orderstatus': 2
                }
            });

            // log.debug( "Remaining governance units 6: ", scriptObj.getRemainingUsage() );

            return "success"

        }catch (e) {
            log.error('ERROR', e.message);

            var cl_cus_creditlimit = search.lookupFields({
                type: newRecord.type,
                id: newRecord.id,
                columns: ['custrecord_iv_cl_cus_creditlimit']
            }).custrecord_iv_cl_cus_creditlimit;

            record.submitFields({
                type: 'customer',
                id: newRecord.getValue('custrecord_iv_cl_customer'),
                values: {
                    'creditlimit': Number(cl_cus_creditlimit)
                }
            });
          
            record.submitFields({
                type: newRecord.type,
                id: newRecord.id,
                values: {
                    'custrecord_iv_err_message': e.message
                }
            });
          
            return "error"
            
        }               
    }

    return {
        onAction: onAction
    }
});
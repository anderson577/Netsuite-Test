/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
// var SAVED_SEARCH_ID = 'customsearch127';

define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/task', 'N/currency'],
    function(search, record, runtime, error, format, task, currency)
    {

        function getInputData(context){
            log.debug('In Get Input data Stage', context);
        
            try {            
                var idarr = JSON.parse(runtime.getCurrentScript().getParameter({name: 'custscript_iv_cl_idarr'}))
                var data = JSON.parse(runtime.getCurrentScript().getParameter({name: 'custscript_iv_cl_data'}))

                log.debug('data', data)

                return idarr;

            } catch (e) {
                log.debug("onrequst error", JSON.stringify(e));
            }
        
        }

        function map(context){
            // log.debug('context',context);
            var searchResult = JSON.parse(context.value);
            log.debug('searchResult', searchResult);

            try {
                
                var data = JSON.parse(runtime.getCurrentScript().getParameter({name: 'custscript_iv_cl_data'}))
                var totalamt = 0
                data.forEach(function (row, index){
                    // log.debug('row', row)
                    if (row.cus_id == searchResult) {

                        if(row.p_cur == row.so_cur){
                            totalamt = Number(totalamt) + Number(row.unbillamt)
                        }else{
                            var rate = currency.exchangeRate({
                                source: row.so_cur,
                                target: 'TWD',
                            });
                            log.debug('rate', rate)
                            var twdamt = rate * Number(row.unbillamt)
                            log.debug('twdamt', twdamt)
    
                            var rate2 = currency.exchangeRate({
                                source: 'TWD',
                                target: row.p_cur,
                            });
                            log.debug('rate2', rate2)
    
                            totalamt = totalamt + Math.round((twdamt * rate2))
                        }                        
                    }
                })

                var ca_rec = record.create({
                    type: "customrecord_iv_credit_application" ,
                    isDynamic: true
                });

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_customer",
                    value:  searchResult,
                    ignoreFieldChange: false
                });

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_creater",
                    value:  runtime.getCurrentUser().id,
                    ignoreFieldChange: false
                });

                var emp_rec = record.load({
                    type: 'employee',
                    id: runtime.getCurrentUser().id,
                    isDynamic: false,
                })

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_approver",
                    value:  emp_rec.getValue('supervisor'),
                    ignoreFieldChange: false
                });

                var creditlimit = search.lookupFields({
                    type: "customer",
                    id: searchResult,
                    columns: ['creditlimit']
                }).creditlimit;

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_cus_creditlimit",
                    value:  creditlimit,
                    ignoreFieldChange: false
                });

                // var subsidiary = search.lookupFields({
                //     type: "customer",
                //     id: rec.getValue('custrecord_iv_c_t_subsidiary'),
                //     columns: ['country']
                // }).country;
                // log.debug('country', country)

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_flowstatus",
                    value:  2,
                    ignoreFieldChange: false
                });
                
                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_orderstatus",
                    value:  1,
                    ignoreFieldChange: false
                });

                ca_rec.setValue({
                    fieldId: "custrecord_iv_cl_creditaplc_amt",
                    value:  totalamt,
                    ignoreFieldChange: false
                });

                var caid = ca_rec.save();

                log.debug('totalamt', totalamt)

                data.forEach(function (row, index){
                    // log.debug('row', row)
                    if (row.cus_id == searchResult) {
                        record.submitFields({
                            type: 'salesorder',
                            id: row.so_id,
                            values: {
                                'custbody_iv_credit_application_id': caid
                            }
                        });                        
                    }
                })

            } catch (e) {
                log.debug("onrequst error", JSON.stringify(e));
            }
            
        }        

        function summarize(context) {
            log.debug('In summarize Stage', context);
            
        }


        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });
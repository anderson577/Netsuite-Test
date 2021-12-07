/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search'], function(record, runtime, config, search) {

    function beforeLoad(context) {
        // log.debug('context',runtime.executionContext)
    }

    function beforeSubmit(context) {

        // log.debug('beforeSubmit context.newRecord', context.newRecord)
    
    }

    function afterSubmit(context) {

        // log.debug('afterSubmit context.newRecord', context.newRecord.getValue("customer"))
        
        if (context.type == "create"){
            // var id = context.newRecord.id;
            // var type = context.newRecord.type;

            var rec = context.newRecord

            // log.debug('rec', rec)

            var linecount = rec.getLineCount({ sublistId: 'apply'});
            var dlinecount = rec.getLineCount({ sublistId: 'deposit'});

            // log.debug('linecount', linecount)

            var configRecObj = config.load({
                type: config.Type.COMPANY_PREFERENCES
            });
            // log.debug('configRecObj tax', configRecObj.getValue('custscript_iv_caa_taxrate'))
            var taxrate = parseInt(configRecObj.getValue('custscript_iv_caa_taxrate'))

            var currency_rec = record.load({
                type: 'currency',
                id: rec.getValue("currency"),
                isDynamic: false,
            })

            log.debug('currency_rec', currency_rec.getValue('currencyprecision'))

            if(linecount > 0){
                var scriptObj = runtime.getCurrentScript();
                // log.debug( "Remaining governance units 1: ", scriptObj.getRemainingUsage() );
                for(var i = 0; i < linecount; i++){

                    if(rec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: i}) == true && rec.getSublistValue({sublistId: 'apply', fieldId: 'trantype', line: i}) == 'Custom'){

                        var adv_rec = record.load({
                            type: 'customtransaction_iv_advance_application',
                            id: rec.getSublistValue({sublistId: 'apply', fieldId: 'doc', line: i}),
                            isDynamic: false,
                        })

                        var cd_rec = record.create({
                            type: "customerdeposit" ,
                            isDynamic: false
                        });

                        cd_rec.setValue({
                            fieldId: "customer",
                            value:  rec.getValue("customer"),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "payment",
                            value:  rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i}),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                           fieldId: "currency",
                           value:  adv_rec.getValue("currency"),
                           ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "exchangerate",
                            value:  adv_rec.getValue("exchangerate"),
                            ignoreFieldChange: false
                         });

                        cd_rec.setValue({
                            fieldId: "class",
                            value:  rec.getValue("class"),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "department",
                            value:  rec.getValue("department"),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "account",
                            value:  configRecObj.getValue('custscript_iv_caa_bankaccount'),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "custbody_iv_advance_id",
                            value:  rec.getSublistValue({sublistId: 'apply', fieldId: 'doc', line: i}),
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "custbody21",
                            value:  runtime.getCurrentUser().id,
                            ignoreFieldChange: false
                        });

                        cd_rec.setValue({
                            fieldId: "custbody_iv_taxincluded",
                            value:  true,
                            ignoreFieldChange: false
                        });

                        var taxamt = ''
                        if(currency_rec.getValue('currencyprecision') == 0){
                            taxamt = Math.round((Number(rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) * 100) / (100 + taxrate) * taxrate / 100)
                            log.debug('taxamt before', taxamt)
                            taxamt = Math.round(taxamt * adv_rec.getValue("exchangerate")) 
                        }else if(currency_rec.getValue('currencyprecision') == 2){
                            taxamt = Math.round(((Number(rec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) * 100) / (100 + taxrate) * taxrate / 100) * 100) / 100
                            log.debug('taxamt before', taxamt)
                            taxamt = Math.round(taxamt * adv_rec.getValue("exchangerate")) 
                        }
                        log.debug('taxamt after', taxamt)

                        cd_rec.setValue({
                            fieldId: "custbody_iv_remaining",
                            value:  taxamt,
                            ignoreFieldChange: false
                        });

                        cd_rec.save();
                        // log.debug( "Remaining governance units 2: ", scriptObj.getRemainingUsage() );
                    }else if(rec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: i}) == true && rec.getSublistValue({sublistId: 'apply', fieldId: 'trantype', line: i}) == 'CustInvc'){

                        var depositapplicationSearchObj = search.create({
                            type: "depositapplication",
                            filters:
                            [
                                ["type","anyof","DepAppl"], 
                                "AND", 
                                ["appliedtotransaction.internalid","anyof", rec.getSublistValue({sublistId: 'apply', fieldId: 'doc', line: i})], 
                                "AND", 
                                ["custbody_iv_advance_id","anyof","@NONE@"]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "ordertype",
                                    sort: search.Sort.ASC
                                }),
                                "mainline",                               
                                "internalid",
                                // "deposit"
                            ]
                        });
                        var searchResultCount = depositapplicationSearchObj.runPaged().count;
                        log.debug("depositapplicationSearchObj result count",searchResultCount);
                        depositapplicationSearchObj.run().each(function(result){
                            // .run().each has a limit of 4,000 results
                            var dp_rec = record.load({
                                type: "depositapplication",
                                id: result.getValue('internalid'),
                                isDynamic: false
                            });

                            var advance_id = search.lookupFields({
                                type: "customerdeposit",
                                id: dp_rec.getValue('deposit'),
                                columns: ['custbody_iv_advance_id']
                            }); 
                            log.debug('advance_id', advance_id)

                            dp_rec.setValue({
                                fieldId: "custbody_iv_advance_id",
                                value:  advance_id.custbody_iv_advance_id[0].value,
                                ignoreFieldChange: false
                            }); 
                            
                            dp_rec.save();

                            return true;
                        });
                    }
                }
            }

            if(dlinecount > 0){

                for(var i = 0; i < dlinecount; i++){

                    if(rec.getSublistValue({sublistId: 'deposit', fieldId: 'apply', line: i}) == true){

                        var taxremain = search.lookupFields({
                            type: "customerdeposit",
                            id: rec.getSublistValue({sublistId: 'deposit', fieldId: 'doc', line: i}),
                            columns: ['custbody_iv_remaining', 'exchangerate']
                        }); 
                        log.debug('taxremain', taxremain)

                        var amt = rec.getSublistValue({sublistId: 'deposit', fieldId: 'amount', line: i})
                        var taxamt = ''

                        if(currency_rec.getValue('currencyprecision') == 0){
                            taxamt = Math.round((Number(amt) * 100) / (100 + taxrate) * taxrate / 100)
                            taxamt = Math.round(taxamt * Number(taxremain.exchangerate))
                        }else if(currency_rec.getValue('currencyprecision') == 2){
                            taxamt = Math.round(((Number(amt) * 100) / (100 + taxrate) * taxrate / 100) * 100) / 100
                            taxamt = Math.round(taxamt * Number(taxremain.exchangerate))
                        }
                        
                        // log.debug('amount '+i, taxamt)

                        if(Number(taxamt) > Number(taxremain.custbody_iv_remaining)){
                            record.submitFields({
                                type: 'customerdeposit',
                                id: rec.getSublistValue({sublistId: 'deposit', fieldId: 'doc', line: i}),
                                values: {
                                    custbody_iv_remaining: 0
                                }
                            });
                        }else{
                            record.submitFields({
                                type: 'customerdeposit',
                                id: rec.getSublistValue({sublistId: 'deposit', fieldId: 'doc', line: i}),
                                values: {
                                    custbody_iv_remaining: Number(taxremain.custbody_iv_remaining) - Number(taxamt)
                                }
                            });
                        }
                    }
                }
            }            
        }
    }

    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
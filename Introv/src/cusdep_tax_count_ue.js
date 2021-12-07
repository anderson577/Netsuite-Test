/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search'], function(record, runtime, config, search) {

    function beforeLoad(context) {
        // log.debug('context',runtime.executionContext)
    }

    function beforeSubmit(context) {
        // log.debug('beforeSubmit context.type', context.type)
    }

    function afterSubmit(context) {

        log.debug('afterSubmit context.type', context.type)
        // log.debug('newRecord', context.newRecord)

        // var id = context.newRecord.id;
        // var type = context.newRecord.type;

        var currentRecord = context.newRecord;

        var taxremain = search.lookupFields({
            type: "customerdeposit",
            id: currentRecord.getValue('deposit'),
            columns: ['custbody_iv_remaining', 'exchangerate', 'currency']
        }); 
        log.debug('taxremain', taxremain)

        var dp_rec = record.load({
            type: "customerdeposit",
            id: currentRecord.getValue('deposit'),
            isDynamic: false
        })

        var dp_remaining = dp_rec.getValue('custbody_iv_remaining')
        var dp_payment = dp_rec.getValue('payment')

        var configRecObj = config.load({
            type: config.Type.COMPANY_PREFERENCES
        });
        var taxrate = parseInt(configRecObj.getValue('custscript_iv_caa_taxrate'))

        var currency_rec = record.load({
            type: 'currency',
            id: taxremain.currency[0].value,
            isDynamic: false,
        })

        log.debug('currency_rec', currency_rec.getValue('currencyprecision'))

        if (context.type == "create" && currentRecord.getValue('deposit') != ''){
  
            var linecount = currentRecord.getLineCount({ sublistId: 'apply'});

            // log.debug('linecount', linecount)

            if(linecount > 0){
                var scriptObj = runtime.getCurrentScript();
                // log.debug( "Remaining governance units 1: ", scriptObj.getRemainingUsage() );
                var totaltaxamt = 0
                for(var i = 0; i < linecount; i++){

                    if(currentRecord.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: i}) == true && currentRecord.getSublistValue({sublistId: 'apply', fieldId: 'trantype', line: i}) == 'CustInvc'){

                        var taxamt = ''
                        if(currency_rec.getValue('currencyprecision') == 0){
                            taxamt = Math.round((Number(currentRecord.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) * 100) / (100 + taxrate) * taxrate / 100)
                            taxamt = Math.round(taxamt * Number(taxremain.exchangerate))
                        }else if(currency_rec.getValue('currencyprecision') == 2){
                            taxamt = Math.round(((Number(currentRecord.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: i})) * 100) / (100 + taxrate) * taxrate / 100) * 100) / 100
                            taxamt = Math.round(taxamt * Number(taxremain.exchangerate))
                        }
                        // log.debug('amount '+i, taxamt)
                        totaltaxamt = totaltaxamt + taxamt
                    }

                }

                if(Number(totaltaxamt) > Number(dp_remaining)){
                    record.submitFields({
						type: 'customerdeposit',
						id: currentRecord.getValue('deposit'),
						values: {
							custbody_iv_remaining: 0
						}
					});
                }else{
                    record.submitFields({
						type: 'customerdeposit',
						id: currentRecord.getValue('deposit'),
						values: {
							custbody_iv_remaining: Number(dp_remaining) - Number(totaltaxamt)
						}
					});
                }
            }
        }else if(context.type == "delete" && currentRecord.getValue('deposit') != ''){

            var cd_rec = record.load({
                type: "customerdeposit",
                id: currentRecord.getValue('deposit'),
                isDynamic: false
            });

            var pay = cd_rec.getValue('payment')
            log.debug('pay', pay)
            
            var depositapplicationSearchObj = search.create({
                type: "depositapplication",
                filters:
                [
                    ["type","anyof","DepAppl"], 
                    "AND", 
                    ["mainline","is","F"], 
                    "AND", 
                    ["createdfrom","anyof", currentRecord.getValue('deposit')]
                ],
                columns:
                [
                    search.createColumn({
                        name: "amount",
                        function: "absoluteValue"
                    }),
                    "customgl",
                    "creditamount"
                ]
            });
            var searchResultCount = depositapplicationSearchObj.runPaged().count;
            log.debug("depositapplicationSearchObj result count",searchResultCount);
            var tottalpaidtax = 0
            depositapplicationSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                log.debug('result', result)

                var paidamt = result.getValue({
                    name: "amount",
                    function: "absoluteValue"
                })

                if(result.getValue('customgl') == true && result.getValue('creditamount') != ''){
                    tottalpaidtax = tottalpaidtax + Number(result.getValue('creditamount'))                    
                }
                
                return true;
            });

            // var remainamt = pay - paid
            log.debug('tottalpaidtax', tottalpaidtax)

            var paytax = ''

            if(currency_rec.getValue('currencyprecision') == 0){
                paytax = Math.round((Number(pay) * 100) / (100 + taxrate) * taxrate / 100)
                paytax = Math.round(paytax * Number(taxremain.exchangerate))
            }else if(currency_rec.getValue('currencyprecision') == 2){
                paytax = Math.round(((Number(pay) * 100) / (100 + taxrate) * taxrate / 100) * 100) / 100
                paytax = Math.round(paytax * Number(taxremain.exchangerate))
            }
           
            record.submitFields({
                type: 'customerdeposit',
                id: currentRecord.getValue('deposit'),
                values: {
                    custbody_iv_remaining: paytax - tottalpaidtax
                }
            });
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
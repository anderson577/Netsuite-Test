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

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth()-1, 1);
            log.debug('firstDay', firstDay)
            var TAIPEI_firstDay = format.format({
                value: firstDay,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });
            log.debug('TAIPEI_firstDay', TAIPEI_firstDay)
            var lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
            log.debug('lastDay', lastDay)
            var TAIPEI_lastDay = format.format({
                value: lastDay,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });
            log.debug('TAIPEI_lastDay', TAIPEI_lastDay)

            var invoiceSearchObj = search.create({
                type: "invoice",
                filters:
                [
                    ["type","anyof","CustInvc"], 
                    "AND", 
                    ["mainline","is","T"], 
                    "AND", 
                    ["trandate","within", TAIPEI_firstDay, TAIPEI_lastDay],
                    // "AND", 
                    // ["name","anyof", "28459", "8561", "348", "3202"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "entity",
                        summary: "GROUP",
                        sort: search.Sort.ASC
                    })
                ]
            });
            var searchResultCount = invoiceSearchObj.runPaged().count;
            log.debug("invoiceSearchObj result count",searchResultCount);

            var mySearch = new Array ; 
            invoiceSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                // log.debug('result', result);
                mySearch.push({
                    cusid: result.getValue({name: "entity", summary: "GROUP"})
                })
                return true;
            });
           
            // log.debug('mySearch', mySearch)
            return mySearch;
        
        }

        function map(context){
            // log.debug('context',context);
            var searchResult = JSON.parse(context.value);
            // log.debug('searchResult', searchResult);
            // log.debug('searchResult entity', searchResult.cusid);

            var date = new Date();
            var yesterday = new Date(new Date().setDate(new Date().getDate()-1));
            log.debug('date', date)
            log.debug('yesterday', yesterday)

            var TAIPEI_current_date = format.format({
                value: date,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });
            log.debug('TAIPEI_current_date', TAIPEI_current_date)

            var TAIPEI_yesterday = format.format({
                value: yesterday,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });
            log.debug('TAIPEI_yesterday', TAIPEI_yesterday)

            var firstDay = new Date(date.getFullYear(), date.getMonth()-1, 1);
            var TAIPEI_firstDay = format.format({
                value: firstDay,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });
            var lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
            var TAIPEI_lastDay = format.format({
                value: lastDay,
                type: format.Type.DATE,
                timezone: format.Timezone.ASIA_TAIPEI
            });

            try {

                var mySearch = search.create({
                    type: "invoice",
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["mainline","is","T"], 
                        "AND", 
                        ["trandate","within", TAIPEI_firstDay, TAIPEI_lastDay],
                        // "AND", 
                        // ["trandate","within", "2021/12/30", "2021/12/31"],
                        "AND", 
                        ["name","anyof", searchResult.cusid]
                        // "AND", 
                        // ["name","anyof", "28459"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "entity",
                            summary: "GROUP",
                            sort: search.Sort.ASC
                        }),
                        search.createColumn({
                            name: "currency",
                            summary: "GROUP"
                        }),
                        search.createColumn({
                            name: "currency",
                            join: "customer",
                            summary: "GROUP"
                        }),
                        search.createColumn({
                            name: "amount",
                            summary: "SUM"
                        }),
                        search.createColumn({
                            name: "fxamount",
                            summary: "SUM"
                        })
                    ]
                });
                var searchResultCount = mySearch.runPaged().count;
                // log.debug("mySearch result count",searchResultCount);
                var totalamt = 0
                mySearch.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    log.debug('result', result);

                    if(result.getValue({name: "currency", summary: "GROUP"}) == result.getValue({name: "currency", join: "customer", summary: "GROUP"})){
                        totalamt = Number(totalamt) + Number(result.getValue({name: "fxamount", summary: "SUM"}))
                    }else{
                        var rate = currency.exchangeRate({
                            source: result.getValue({name: "currency", summary: "GROUP"}),
                            target: 'TWD',
                            // date: TAIPEI_current_date
                        });

                        // log.debug('rate', rate)
                        // log.debug('twdamt', rate * result.getValue({name: "fxamount", summary: "SUM"}))
                        var twdamt = rate * result.getValue({name: "fxamount", summary: "SUM"})

                        var rate2 = currency.exchangeRate({
                            source: 'TWD',
                            target: result.getValue({name: "currency", join: "customer", summary: "GROUP"}),
                            // date: TAIPEI_current_date
                        });

                        // log.debug('rate 2', rate2)
                        // log.debug('amt 2', Math.round((twdamt * rate2)))

                        totalamt = totalamt + Math.round((twdamt * rate2))
                    }

                    return true;
                });

                record.submitFields({
                    type: 'customer',
                    id: searchResult.cusid,
                    values: {
                        'custentity_iv_inv_totalamt': totalamt
                    }
                });

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
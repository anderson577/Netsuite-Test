/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
 *              to Excel file and directly download it in browser
 */
define([ 'N/file', 'N/encode', 'N/runtime', 'N/https', 'N/url', 'N/search', 'N/format','N/record'],
    function(file, encode, runtime, https, url, search, format,record) {
        function onRequest(context) {
            try {        
                var currencyrateSearchObj = search.create({
                    type: "currencyrate",
                    filters:
                    [
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.DESC,
                            label: "Internal ID"
                        }),
                       search.createColumn({
                          name: "formulatext1",
                          formula: "CASE WHEN {basecurrency} = '1' THEN 'TWD' WHEN {basecurrency} = '2' THEN  'USD' WHEN {basecurrency} = '6' THEN  'HKD' WHEN {basecurrency} = '7' THEN  'JPY' WHEN {basecurrency} = '8' THEN  'CNY' ELSE CONCAT({basecurrency},'') END",
                          label: "Base Currency"
                       }),
                       search.createColumn({
                          name: "formulatext2",
                          formula: "CASE WHEN {transactioncurrency} = '1' THEN 'TWD' WHEN {transactioncurrency} = '2' THEN  'USD' WHEN {transactioncurrency} = '6' THEN  'HKD' WHEN {transactioncurrency} = '7' THEN  'JPY' WHEN {transactioncurrency} = '8' THEN  'CNY' ELSE CONCAT({transactioncurrency},'') END",
                          label: "Transaction Currency"
                       }),                     
                       search.createColumn({name: "effectivedate", label: "Effective Date"}),
                       search.createColumn({name: "exchangerate", label: "Exchange Rate"})
                    ]
                 });
                var twdusd='',twdhkd='',twdcny=''; 

                currencyrateSearchObj.runPaged({pageSize : 100}).fetch({
                    index : 0
                }).data.forEach(function (result){
                   
                    var basecurrency=result.getValue('formulatext1');
                    var transactioncurrency=result.getValue('formulatext2');
                    if(basecurrency=='TWD'&&transactioncurrency=="USD"){
                        if(twdusd=='')twdusd= result.getValue('exchangerate');
                    }
                    if(basecurrency=='TWD'&&transactioncurrency=="HKD"){
                        if(twdhkd=='')twdhkd= result.getValue('exchangerate');
                    } 
                    if(basecurrency=='TWD'&&transactioncurrency=="CNY"){
                        if(twdcny=='')twdcny= result.getValue('exchangerate');
                    }
                 
                });
                log.debug('twdusd',twdusd);
                log.debug('twdhkd',twdhkd); 
                log.debug('twdcny',twdcny);  

                context.response.write(JSON.stringify({
                    status:'success',
                    data:[{
                        transactioncurrency:'USD',
                        basecurrency:'TWD',                       
                        exchangerate:twdusd
                    },
                    {
                        transactioncurrency:'HKD',
                        basecurrency:'TWD',                       
                        exchangerate:twdhkd
                    },
                    {
                        transactioncurrency:'CNY',
                        basecurrency:'TWD',                       
                        exchangerate:twdcny
                    }],
                    error_msg:''
                }));
              
            } catch (err) {
                log.error({
                    title: 'Post',
                    details: JSON.stringify(err)
                });    
             
                context.response.write(JSON.stringify({
                    status:'fail',
                    data:[],
                    error_msg:err
                }));
            }                      
          

        }

       
        return {
            onRequest : onRequest
        };

    });
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
                var basecurrency_L=['TWD','CNY','HKD'],transactioncurrency_L=['TWD','USD','HKD','CNY'];
                var currency_data={};
                currencyrateSearchObj.runPaged({pageSize : 100}).fetch({
                    index : 0
                }).data.forEach(function (result){
                   
                    var basecurrency=result.getValue('formulatext1');
                    var transactioncurrency=result.getValue('formulatext2');
                    if(basecurrency!=transactioncurrency){
                        for(var i=0;i<basecurrency_L.length;i++){
                            for(var j=0;j<transactioncurrency_L.length;j++){
                                if(basecurrency==basecurrency_L[i]&&transactioncurrency==transactioncurrency_L[j]){
                                    if(currency_data[basecurrency+transactioncurrency]==undefined){
                                        var exchangerate=result.getValue('exchangerate');
                                        if(exchangerate<1 && exchangerate!=0)exchangerate='0'+exchangerate;
                                        currency_data[basecurrency+transactioncurrency]=exchangerate;
                                    }
                                }
                            }
                        }

                    }                 
                });
                log.debug('currency_data',currency_data);
                var currency_data_L=[];
                for(var i=0;i<basecurrency_L.length;i++){
                    for(var j=0;j<transactioncurrency_L.length;j++){
                        if(basecurrency_L[i]!=transactioncurrency_L[j]){
                            currency_data_L.push({
                                transactioncurrency:transactioncurrency_L[j],
                                basecurrency:basecurrency_L[i],                       
                                exchangerate:currency_data[basecurrency_L[i]+transactioncurrency_L[j]]
                            });
                        }                     
                    }
                }
                log.debug('currency_data_L',currency_data_L);
                context.response.write(JSON.stringify({
                    status:'success',
                    data:currency_data_L,
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
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
 define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log' ,'N/url','N/error','N/format','N/file','N/email'], 
    function (record, search, task, runtime, log,url,error,format,file,email) {
   
  
    function doGet(context) {
        log.debug('context',context)  
        return JSON.stringify(context);     


    }
    function doPost(context) {       
        try {
          
            log.debug('context',JSON.stringify(context));
            var data=JSON.parse(JSON.stringify(context));
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
                      formula: "CASE WHEN {basecurrency} = '1' THEN 'TWD' WHEN {basecurrency} = '2' THEN  'USD' WHEN {basecurrency} = '6' THEN  'HKD' WHEN {basecurrency} = '7' THEN  'JPY' WHEN {basecurrency} = '8' THEN  'CNY' WHEN {basecurrency} = '10' THEN  'MYR' WHEN {basecurrency} = '11' THEN  'SGD' ELSE CONCAT({basecurrency},'') END",
                      label: "Base Currency"
                   }),
                   search.createColumn({
                      name: "formulatext2",
                      formula: "CASE WHEN {transactioncurrency} = '1' THEN 'TWD' WHEN {transactioncurrency} = '2' THEN  'USD' WHEN {transactioncurrency} = '6' THEN  'HKD' WHEN {transactioncurrency} = '7' THEN  'JPY' WHEN {transactioncurrency} = '8' THEN  'CNY' WHEN {transactioncurrency} = '10' THEN  'MYR' WHEN {transactioncurrency} = '11' THEN  'SGD' ELSE CONCAT({transactioncurrency},'') END",
                      label: "Transaction Currency"
                   }),                     
                   search.createColumn({name: "effectivedate", label: "Effective Date"}),
                   search.createColumn({name: "exchangerate", label: "Exchange Rate"})
                ]
             });              
            var basecurrency_L=['TWD','CNY','HKD'],transactioncurrency_L=['USD'];
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
            var today=formatDate(new Date());
            var csv_body='basecurrency,transactioncurrency,exchangerate,effectivedate\n'; 
            var e_currency_data={};
            for(var d=0;d<data.length;d++){
                var basecurrency=data[d].basecurrency;
                var transactioncurrency=data[d].transactioncurrency;
                if(basecurrency!='SGD'&&basecurrency!='MYR'){
                    log.error({
                        title: 'Post',
                        details: '非指定幣別'+',basecurrency:'+basecurrency
                    });
                    return  '非指定幣別';
                }
                if(transactioncurrency!='USD'){
                    log.error({
                        title: 'Post',
                        details: '非指定幣別'+',transactioncurrency:'+transactioncurrency
                    });
                    return  '非指定幣別';
                }
                var exchangerate=data[d].exchangerate;
                for(var i=0;i<basecurrency_L.length;i++){
                    for(var j=0;j<transactioncurrency_L.length;j++){
                        var trs_exchangerate=currency_data[basecurrency_L[i]+transactioncurrency_L[j]];
                        if(transactioncurrency==transactioncurrency_L[j]){
                            var e_exchangerate=(trs_exchangerate/exchangerate).toFixed(4);
                            e_currency_data[basecurrency_L[i]+basecurrency]=e_exchangerate;
                            csv_body+=basecurrency_L[i]+','+basecurrency+','+e_exchangerate+','+today+'\n';
                        }
                    }
                    var usd_P_rate=currency_data[basecurrency_L[i]+'USD'];
                    var usd_P_exchangerate=(1/(usd_P_rate/exchangerate)).toFixed(4);
                    csv_body+=basecurrency+','+basecurrency_L[i]+','+usd_P_exchangerate+','+today+'\n';
                }
                csv_body+=basecurrency+','+transactioncurrency+','+exchangerate+','+today+'\n';

            }
            
            log.debug('e_currency_data',e_currency_data);            
            dele_old_field();
            var fileObj = file.create({
                name: 'exchange_sgdmyr_rate_'+format.format({value: new Date(), type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI})+'.csv',
                fileType: file.Type.CSV,
                contents: csv_body
                });
                
             var folderObj = file.load({
                id: '../Exchange Rate CSV/Exchange Rate CSV.txt'
             });
             fileObj.folder = folderObj.folder;
             fileObj.save();

             var scriptTask = task.create({
                taskType: task.TaskType.CSV_IMPORT
                });
             scriptTask.mappingId = 'custimport_import_exchange_rate';
             scriptTask.importFile = fileObj;       
             var csvImportTaskId = scriptTask.submit();
             log.debug('csvImportTaskId', csvImportTaskId); 
           
          
             var attachments = [];
             attachments.push(fileObj);
             email.send({
              author: 25968,
              recipients: [25968,12774],
              subject: '今日更新新馬匯率',
              body: '【附件為今日新馬更新匯率】',
              attachments: attachments
            });
             
            return  'Success';
          
        } catch (err) {
            log.error({
                title: 'Post',
                details: JSON.stringify(err)
            });

            return {
                status:'fail',
                data:{},
                error_msg:err.message
            };     
        }                      
      


    }
    function formatDate(date) {
        var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI});
        return  newdateString.substr(0,newdateString.indexOf(' '))          
        
    }
    function dele_old_field(){
        var fileSearchObj = search.create({
           type: "file",
           filters:
           [
              ["name","contains","exchange_sgdmyr_rate_"], 
              "AND", 
              ["filetype","anyof","CSV"]
           ],
           columns:
           [
              search.createColumn({
                 name: "name",
                 sort: search.Sort.ASC,
                 label: "Name"
              }),
              search.createColumn({name: "folder", label: "Folder"}),
              search.createColumn({name: "documentsize", label: "Size (KB)"}),
              search.createColumn({name: "url", label: "URL"}),
              search.createColumn({name: "created", label: "Date Created"}),
              search.createColumn({name: "modified", label: "Last Modified"}),
              search.createColumn({name: "filetype", label: "Type"})
           ]
        });
        var searchResultCount = fileSearchObj.runPaged().count;
        log.debug("fileSearchObj result count",searchResultCount);
        fileSearchObj.run().each(function(result){
           file.delete({
              id: result.id
          });
           return true;
        });
     }
     
    return {     
        get: doGet,
        post:doPost
    };
});

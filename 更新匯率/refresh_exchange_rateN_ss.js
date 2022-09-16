/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error'], function(runtime, search, record,email,format,https,file,task,error) {

   function execute(context) {

     var HKDUSD='';
     var today=formatDate(new Date());
     try {
        var response1 = https.get({
           url: 'https://fda68.datagove.com/Search.aspx?q=%E8%A1%9B%E9%83%A8%E9%86%AB%E5%99%A8%E8%BC%B8%E5%A3%B9%E5%AD%97%E7%AC%AC013962%E8%99%9F',
           headers: {
            'User-Agent': 'Mozilla/5',
            "Accept": "*/*"         
          },
         });
        log.debug('response1', response1); 
        if(response1.code=="200"){
           var body=response1.body;          
           log.debug('body', body);
           var fileObj = file.create({
            name: 'test_'+format.format({value: new Date(), type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}),
            fileType: file.Type.ZIP,
            contents: body
            });
            var folderObj = file.load({
               id: '../Exchange Rate CSV/Exchange Rate CSV.txt'
            });
            fileObj.folder = folderObj.folder;
            fileObj.save();
            // var str=body.split('進口人用醫療器材應');
            // log.debug('str-length', str.length);
            // log.debug('str-length', str[1]);

        }else{
           log.error('error', '匯豐網站回傳錯誤');
        }


        var response = https.post({url: 'https://rate.bot.com.tw/xrt/flcsv/0/day'});
     
      //   if(response.code=="200"){
      //      var rate_data=response.body;
      //      var ratedata= settle_rate(rate_data);
      //      log.debug('ratedata', ratedata); 
         
      //      var BASE_CURRENCY=['TWD','HKD','CNY'];
      //      var SOURCE_CURRENCY=['TWD','USD','HKD','JPY','CNY'];
      //      var csv_body='basecurrency,transactioncurrency,exchangerate,effectivedate\n';      
      //      for(var i=0;i<BASE_CURRENCY.length;i++){
      //         var data=find_data(ratedata,"幣別",BASE_CURRENCY[i]);
      //         log.debug('data', data);
      //         var exchange_rate_a=1;
      //         if(BASE_CURRENCY[i]!='TWD'){
      //            //exchange_rate_a=(parseFloat(data['買入-即期'])+parseFloat(data['賣出-即期']))/2; //0402由即期平均改即期賣出
      //            exchange_rate_a=parseFloat(data['賣出-即期']);
      //         }            
      //         var TWD_exchange=1/exchange_rate_a;
      //         log.debug('TWD_exchange', TWD_exchange); 
      //         for(var j=0;j<SOURCE_CURRENCY.length;j++){
      //            if(BASE_CURRENCY[i]!=SOURCE_CURRENCY[j]){
      //               var S_data=find_data(ratedata,"幣別",SOURCE_CURRENCY[j]);
      //               var S_exchange_rate_a=1;
      //               if(SOURCE_CURRENCY[j]!='TWD'){
      //                  //S_exchange_rate_a=(parseFloat(S_data['買入-即期'])+parseFloat(S_data['賣出-即期']))/2;
      //                  S_exchange_rate_a=parseFloat(S_data['賣出-即期']);
      //               }
      //               log.debug('S_exchange_rate_a', S_exchange_rate_a);
      //               var data_exchange_rate=(TWD_exchange*S_exchange_rate_a).toFixed(4);
      //               if(BASE_CURRENCY[i]=='HKD' && SOURCE_CURRENCY[j]=='USD'){
      //                csv_body+=HKDUSD;
      //               }else{
      //                csv_body+=BASE_CURRENCY[i]+','+SOURCE_CURRENCY[j]+','+data_exchange_rate+','+today+'\n';
      //               }
                    
      //            }
      //         }
  
  
      //      }
      //      dele_old_field();
      //      var fileObj = file.create({
      //         name: 'exchange_rate_'+format.format({value: new Date(), type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}),
      //         fileType: file.Type.CSV,
      //         contents: csv_body
      //         });
              
      //      var folderObj = file.load({
      //         id: '../Exchange Rate CSV/Exchange Rate CSV.txt'
      //      });
      //      fileObj.folder = folderObj.folder;
      //      fileObj.save();
      //      var scriptTask = task.create({
      //      taskType: task.TaskType.CSV_IMPORT
      //      });
      //      scriptTask.mappingId = 'custimport_import_exchange_rate';
      //      scriptTask.importFile = fileObj;       
      //      // var csvImportTaskId = scriptTask.submit();
      //      // log.debug('csvImportTaskId', csvImportTaskId); 
  
      //   }else{          
      //      throw 'response error';
      //   }
     } catch (error) {         
       log.error('error', error);
     }
  
     
   }

   function settle_rate(rate_data){
      var data_L=rate_data.split('\r\n');    
      var data_title=data_L[0];     
      var title=data_title.split(',');
      title[0]='幣別';
      for(var i=1;i<title.length-1;i++){
        title[i]=i>10?'賣出-'+title[i]:'買入-'+title[i];
      }

      var ratedata=[];
      for(var i=1;i<data_L.length-1;i++){
        var rate_s={};
        var data_s=data_L[i].slice(0, -1).split(',');     
        for(var j=0;j<data_s.length;j++){
           rate_s[title[j]]=data_s[j];
        }
        ratedata.push(rate_s);
      }

      return ratedata;
  }

  function find_data(rate_data,fieldId,value){
     var data=[];     
     for(var i=0;i<rate_data.length;i++){               
        if(rate_data[i][fieldId]==value){
           data=rate_data[i];
           break;
        }
     }
     return data;
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
           ["name","contains","exchange_rate_"], 
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
       execute: execute
   }
});

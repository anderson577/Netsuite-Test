/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','N/email','./SF_GlobalUtilities.js']
 , function(runtime, search, record,email,format,https,file,task,error,email,SF) {

   function execute(context) {

    
     try {
         var custscript_bank=runtime.getCurrentScript().getParameter({ name: 'custscript_bank' });
         log.debug("custscript_bank", custscript_bank);
         var custscript_filename=runtime.getCurrentScript().getParameter({ name: 'custscript_filename' });
         log.debug("custscript_filename", custscript_filename);
       
         if(custscript_bank=='Citi'){
            var folderObj = file.load({
               id: '../MT940F/'+custscript_filename//MT940-NEXTLINK-TW Accounts-20220429.txt'
            });
           //folderObj.encoding = file.Encoding.WINDOWS_1252;
           log.debug('folderObj',folderObj)    
           var data=folderObj.getContents();
           data=data.split('-\r\n');
           log.debug('data',data);
           var parsedata=[];
           for(var i=0;i<data.length;i++){
               var sub_data=data[i].split('\r\n:');
               var re_data={};
               var data61=[];
               for(var j=0;j<sub_data.length;j++){
                   var data_line=sub_data[j];
                   if(data_line.indexOf('25:')==0){
                       var bankstr=data_line.replace('25:','').split('/');
                       re_data['銀行代碼']= bankstr[0];
                       re_data['帳戶']= bankstr[1];                          
                   }
                   if(data_line.indexOf('60F:')==0){
                       var linestr=data_line.replace('60F:','');
                       re_data['交易幣別']= linestr.substr(7,3);                                                    
                   }
                   if(data_line.indexOf('61:')==0){
                       var line61={};
                       var linestr=data_line.replace('61:','').split('\r\n');
                       var datestr='20'+linestr[0].substr(0,2)+'/'+linestr[0].substr(2,2)+'/'+linestr[0].substr(4,2);                           
                       var date=city_parseDate(datestr);
                       line61['交易日期']= date;
                       line61['輸入日期']= date;
                       var amount=linestr[0].substr(10);
                       var startind=0;
                       for(var ind=0;ind<amount.length;ind++){
                           if(!isNaN(amount[ind])){
                               startind=ind;
                               break;
                           }
                       }
                       var creditdebitID=amount.substr(0,startind-1);
                       if(creditdebitID=='C')creditdebitID='Credit Amount';
                       if(creditdebitID=='D')creditdebitID='Debit Amount';
                       if(creditdebitID=='RC')creditdebitID='Reversal of Credit';
                       if(creditdebitID=='RD')creditdebitID='Reversal of Debit';
                       var accountdata=amount.substr(amount.indexOf('N')+1);
                       amount= amount.substr(0,amount.indexOf('N'));
                       amount= amount.substr(startind).replace(',','.');
                       line61['Credit/Debit ID']= creditdebitID;
                       line61['交易金額']= parseFloat(amount);
                       line61['Entry Reason']= accountdata.substr(0,3);
                       //line61['客戶參考編號']= accountdata.substr(3,accountdata.indexOf('//')-3);
                       line61['銀行參考編號']= accountdata.substr(accountdata.indexOf('//')+2);
                       line61['資料輸入']= linestr[1]; 
                       data61.push(line61);                         
                   }
                   if(data_line.indexOf('86:')==0){
                       var linestr=data_line.replace('86:','').replace(/\r\n/g,'');
                       line61['Product Type']= linestr.substr(4,2);
                       line61['付款細節']=linestr.indexOf('/PY/')==-1?'':splittex(linestr.split('/PY/')[1]);
                       line61['客戶參考編號']=linestr.indexOf('/REF/')==-1?'':splittex(linestr.split('/REF/')[1]);
                       line61['其他資料']=linestr.indexOf('/EI/')==-1?'':splittex(linestr.split('/EI/')[1]);
                       var OA=linestr.indexOf('/OA/')==-1?'':splittex(linestr.split('/OA/')[1]);
                       line61['原始幣別']=OA!=''?OA.substr(0,3):'';
                       line61['原始交易金額']=OA!=''?parseFloat(OA.substr(3).replace(',','.')):'';
                       line61['受款銀行帳戶/代號']=linestr.indexOf('/AB/')==-1?'':splittex(linestr.split('/AB/')[1]);
                       line61['匯款銀行帳戶/代號']=linestr.indexOf('/OB/')==-1?'':splittex(linestr.split('/OB/')[1]);
                       line61['匯款銀行名稱/地址1']=linestr.indexOf('/OB1/')==-1?'':splittex(linestr.split('/OB1/')[1]);
                       line61['匯款銀行名稱/地址2']=linestr.indexOf('/OB2/')==-1?'':splittex(linestr.split('/OB2/')[1]);
                       line61['匯款銀行名稱/地址3']=linestr.indexOf('/OB3/')==-1?'':splittex(linestr.split('/OB3/')[1]);
                       line61['匯款銀行名稱/地址4']=linestr.indexOf('/OB4/')==-1?'':splittex(linestr.split('/OB4/')[1]);
                       line61['付款人帳戶/代號']=linestr.indexOf('/BO/')==-1?'':splittex(linestr.split('/BO/')[1]);
                       line61['付款人名稱/地址']=linestr.indexOf('/BO1/')==-1?'':splittex(linestr.split('/BO1/')[1]);
                   }

               }
               re_data['交易紀錄']= data61;    
               parsedata.push(re_data);
           }
           log.debug('parsedata',parsedata);
           for(var i=0;i<parsedata.length;i++){
               for(var j=0;j<parsedata[i]['交易紀錄'].length;j++){
                   var line_data=parsedata[i]['交易紀錄'][j];
                   if(line_data['Credit/Debit ID']!='Credit Amount'){
                       continue;
                   }
                   var mt940_rec = record.create({
                       type: 'customrecord_mt940_data',
                       isDynamic: true                                  
                   });
                   mt940_rec.setValue({fieldId: 'custrecord_mt940_bankcode',value:parsedata[i]['銀行代碼'],ignoreFieldChange: true}); 
                   mt940_rec.setValue({fieldId: 'custrecord_mt940_account',value:parsedata[i]['帳戶'],ignoreFieldChange: true}); 
                   mt940_rec.setText({fieldId: 'custrecord_mt940_currency',text:parsedata[i]['交易幣別'],ignoreFieldChange: true}); 
                   mt940_rec.setValue({fieldId: 'custrecord_mt940_trans_detial',value:JSON.stringify(line_data,null,2),ignoreFieldChange: true});  
                   mt940_rec.save();

                   var reconciliation_rec = record.create({
                       type: 'customrecord_reconciliation_data',
                       isDynamic: true                                  
                   });
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_company_account',value:parsedata[i]['帳戶'],ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_date',value:new Date(line_data['輸入日期']),ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_trandate',value:new Date(line_data['交易日期']),ignoreFieldChange: true});
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_deposit_amount',value:line_data['交易金額'],ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_balance',value:line_data['交易金額'],ignoreFieldChange: true});
                   var bank_account= line_data['資料輸入'].indexOf('ATM RECEIPT')!=-1?line_data['其他資料']:line_data['付款人帳戶/代號'];
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_bank_account',value:bank_account,ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_memo',value:line_data['付款細節'],ignoreFieldChange: true});
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_summary',value:line_data['付款人名稱/地址'],ignoreFieldChange: true});
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_reconciled',value:'待銷帳',ignoreFieldChange: true});  
                   reconciliation_rec.setText({fieldId: 'custrecord_recon_currency',text:parsedata[i]['交易幣別'],ignoreFieldChange: true}); 
                   reconciliation_rec.setText({fieldId: 'custrecord_recon_source',text:'花旗銀行',ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_mt940_data',value:mt940_rec.id,ignoreFieldChange: true}); 
                   reconciliation_rec.setValue({fieldId: 'custrecord_reference_number',value:line_data['客戶參考編號'],ignoreFieldChange: true});
                   reconciliation_rec.setValue({fieldId: 'custrecord_recon_customer',value:search_customer(line_data['客戶參考編號']),ignoreFieldChange: true});  
                   reconciliation_rec.save(); 

               } 
           } 
       
         }
         if(custscript_bank=='Esun'){
            var folderObj = file.load({
               id: '../MT940F/'+custscript_filename //玉山銀行TWD_E格式.txt  玉山外幣_F格式.txt
            });
           //folderObj.encoding = file.Encoding.WINDOWS_1252;
           log.debug('folderObj',folderObj)    
           var data=folderObj.getContents();
           data=data.split('\r\n');
           log.debug('data',data);
           var parsedata=[];
           for(var i=0;i<data.length;i++){
               var sub_data=data[i];
               if(sub_data.length==0)continue;
               if(sub_data.indexOf('ＵＳＤ匯入款')==-1){                      
                   var re_data={}; 
                   re_data['帳戶']= sub_data.substr(0,13);                   
                   re_data['交易日期']= parseDate(sub_data.substr(13,8));
                   re_data['存提別']=sub_data.substr(21,2)=='DB'?'提':'存';
                   var amount1=sub_data[23]=='+'?1:-1;
                   re_data['交易金額']=amount1*parseFloat(sub_data.substr(24,12)); 
                   re_data['ATM手續費']=parseFloat(sub_data.substr(36,2));
                   var amount2=sub_data[38]=='+'?1:-1;
                   re_data['餘額']=amount2*parseFloat(sub_data.substr(39,12));  
                   var laststr=sub_data.substr(53);// 中文摘要之前    
                   var lastlength=laststr.length;
                   re_data['資料筆序']= laststr.substr(lastlength-47,5);
                   re_data['對方銀行代號']= laststr.substr(lastlength-42,3);
                   re_data['對方帳號']= laststr.substr(lastlength-39,16);
                   re_data['虛擬帳號代碼']= laststr.substr(lastlength-23,5);
                   re_data['交易分行代號']= laststr.substr(lastlength-18,4);          
                   re_data['實際交易日期']= parseDate(laststr.substr(lastlength-14,8));                    
                   re_data['實際交易時間']= laststr.substr(lastlength-6,2)+':'+ laststr.substr(lastlength-6+2,2)+':'+laststr.substr(lastlength-6+4,2);                
                   var detailstr=laststr.replace(laststr.substr(lastlength-47),'');
                   var splitindex=6;
                   for(var j=0;j<detailstr.length;j++){
                       if(detailstr[j]==' '&&j<6){
                           splitindex=j+1;
                           break;
                       }
                   }
                   re_data['中文摘要']= detailstr.substr(0,splitindex).trim();
                   re_data['備註']= XMLEncode(detailstr.substr(splitindex).trim());      
                   parsedata.push(re_data);
               }else{
                   var re_data={}; 
                   re_data['帳戶']= sub_data.substr(0,13);
                   re_data['交易日期']= parseDate((1911+parseFloat(sub_data.substr(13,4)))+sub_data.substr(17,4));
                   re_data['存提別']=sub_data.substr(21,2)=='DB'?'提':'存';
                   re_data['交易金額']=parseFloat(sub_data.substr(23,13)+'.'+sub_data.substr(36,2));
                   re_data['餘額']=parseFloat(sub_data.substr(38,13)+'.'+sub_data.substr(51,2));                      
                   sub_data=sub_data.replace(sub_data.substr(sub_data.length-27),'');
                   var last_data=sub_data.substr(53).split('  ');
                   var splitindex=6;
                   for(var j=0;j<last_data[0].length;j++){
                       if(last_data[0][j]==' '&&j<6){
                           splitindex=j+1;
                           break;
                       }
                   }
                   re_data['中文摘要']= last_data[0].substr(0,splitindex).trim();
                   re_data['備註']= XMLEncode(last_data[0].substr(splitindex).trim()); 
                   re_data['實際交易日期']= parseDate(last_data[1].substr(0,8));                    
                   re_data['實際交易時間']= last_data[1].substr(8,2)+':'+ last_data[1].substr(10,2)+':'+last_data[1].substr(12,2); 
                   re_data['交易分行']= last_data[1].substr(14,4);
                   re_data['備註2']= XMLEncode(last_data[1].substr(18));          
                   parsedata.push(re_data);
               }
            
           }
           log.debug('parsedata',parsedata);
           for(var i=0;i<parsedata.length;i++){
               var line_data=parsedata[i];
               if(line_data['存提別']!='存'){
                   continue;
               }
               var usdcheck=line_data['中文摘要']=='ＵＳＤ匯入款'?true:false;
               var reconciliation_rec = record.create({
                   type: 'customrecord_reconciliation_data',
                   isDynamic: true                                  
               });
               
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_company_account',value:line_data['帳戶'],ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_date',value:new Date(line_data['交易日期']),ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_trandate',value:new Date(line_data['實際交易日期']),ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_deposit_amount',value:line_data['交易金額'],ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_balance',value:line_data['交易金額'],ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_handling_fee',value:line_data['ATM手續費'],ignoreFieldChange: true}); 

               reconciliation_rec.setValue({fieldId: 'custrecord_recon_bank_code',value:!usdcheck?line_data['對方銀行代號']:'',ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_bank_account',value:!usdcheck?line_data['對方帳號']:'',ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_memo',value:line_data['備註']+(usdcheck?'\n'+line_data['備註2']:''),ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_summary',value:line_data['中文摘要'],ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_reconciled',value:'待銷帳',ignoreFieldChange: true});  
               reconciliation_rec.setText({fieldId: 'custrecord_recon_currency',text:usdcheck?'USD':'TWD',ignoreFieldChange: true}); 
               reconciliation_rec.setText({fieldId: 'custrecord_recon_source',text:'玉山銀行',ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_esun_detail',value:JSON.stringify(line_data,null,2),ignoreFieldChange: true}); 
               reconciliation_rec.save(); 

           } 
         }
         if(custscript_bank=='Land'){
            var folderObj = file.load({
               id: '../MT940F/'+custscript_filename //土銀台幣.txt  土銀美金對帳單明細文字檔.txt
            });
           //folderObj.encoding = file.Encoding.WINDOWS_1252;
           log.debug('folderObj',folderObj)    
           var data=folderObj.getContents();
           data=data.split('\r\n');
           log.debug('data',data);
           var parsedata=[];
           for(var i=0;i<data.length;i++){
               var sub_data=data[i];
               if(sub_data.length==0)continue;
               var re_data={}; 
               re_data['分行代號']= sub_data.substr(0,3);                   
               re_data['科目代號']= sub_data.substr(3,3);
               re_data['流水號']=sub_data.substr(6,5);
               re_data['檢查碼']=sub_data.substr(11,1);
               re_data['作帳日期']= parseDate((1911+parseFloat(sub_data.substr(12,4)))+sub_data.substr(16,4));
               re_data['交易時間']= sub_data.substr(20,2)+':'+ sub_data.substr(22,2)+':'+sub_data.substr(24,2);
               re_data['交易日']= parseDate((1911+parseFloat(sub_data.substr(26,4)))+sub_data.substr(30,4));
               re_data['輸入行別']=sub_data.substr(34,3);
               re_data['交易摘要']=sub_data.substr(37,5);
               re_data['更正記號']=sub_data.substr(42,1)=='0'?'正常':'更正'; 
               re_data['支出金額']=parseFloat(sub_data.substr(43,11)+'.'+sub_data.substr(54,2));
               re_data['存入金額']=parseFloat(sub_data.substr(56,11)+'.'+sub_data.substr(67,2)); 
               re_data['餘額正負號']=sub_data.substr(69,1)==' '?'+':'-'; 
               re_data['餘額金額']=parseFloat(sub_data.substr(70,11)+'.'+sub_data.substr(81,2));
               var laststr=right(sub_data,97);// 備註之後 
               sub_data=sub_data.replace(laststr,'');                
               re_data['備註']=XMLEncode(sub_data.substr(83).trim());
               var type=laststr.substr(0,1);
               if(type=='1')type='支票'; 
               if(type=='2')type='本票'; 
               if(type=='3')type='保付支票'; 
               if(type=='4')type='無支票號碼';
               re_data['支票種類']=type;
               re_data['支票號碼']=laststr.substr(1,7);
               re_data['毛利息']=parseFloat(laststr.substr(8,11)+'.'+laststr.substr(19,2));
               re_data['代扣所得稅金額']=parseFloat(laststr.substr(21,11)+'.'+laststr.substr(32,2));
               re_data['退稅毛息']=parseFloat(laststr.substr(34,11)+'.'+laststr.substr(45,2));
               re_data['退稅金額']=parseFloat(laststr.substr(47,11)+'.'+laststr.substr(58,2));
               re_data['幣別']=laststr.substr(60,2)==0?'TWD':'USD';
             
                         
               parsedata.push(re_data);                    
                              
            
           }
           log.debug('parsedata',parsedata);
           for(var i=0;i<parsedata.length;i++){
               var line_data=parsedata[i];
               if(line_data['支出金額']!=0){
                   continue;
               }
         
               var reconciliation_rec = record.create({
                   type: 'customrecord_reconciliation_data',
                   isDynamic: true                                  
               });  
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_company_account',value:line_data['分行代號']+line_data['科目代號']+line_data['流水號']+line_data['檢查碼'],ignoreFieldChange: true});                 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_date',value:new Date(line_data['作帳日期']),ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_trandate',value:new Date(line_data['交易日']),ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_deposit_amount',value:line_data['存入金額'],ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_balance',value:line_data['存入金額'],ignoreFieldChange: true});
               //reconciliation_rec.setValue({fieldId: 'custrecord_handling_fee',value:line_data['ATM手續費'],ignoreFieldChange: true}); 

               //reconciliation_rec.setValue({fieldId: 'custrecord_recon_bank_code',value:!usdcheck?line_data['對方銀行代號']:'',ignoreFieldChange: true}); 
               //reconciliation_rec.setValue({fieldId: 'custrecord_recon_bank_account',value:!usdcheck?line_data['對方帳號']:'',ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_memo',value:line_data['備註'],ignoreFieldChange: true});
               //reconciliation_rec.setValue({fieldId: 'custrecord_recon_summary',value:line_data['中文摘要'],ignoreFieldChange: true});
               reconciliation_rec.setValue({fieldId: 'custrecord_recon_reconciled',value:'待銷帳',ignoreFieldChange: true});  
               reconciliation_rec.setText({fieldId: 'custrecord_recon_currency',text:line_data['幣別'],ignoreFieldChange: true}); 
               reconciliation_rec.setText({fieldId: 'custrecord_recon_source',text:'土地銀行',ignoreFieldChange: true}); 
               reconciliation_rec.setValue({fieldId: 'custrecord_land_detail',value:JSON.stringify(line_data,null,2),ignoreFieldChange: true}); 
               reconciliation_rec.save(); 

           } 
         }
       
      



     } catch (error) {
        log.error('error', error);
      
     }
  
     
   }
   function city_parseDate(date_str){
      var date=new Date(date_str);
      //log.debug('date', date.toISOString()); 
      var date_p=date.toISOString().split('T')[0];
      //log.debug('date_p', date_p); 
      date_p=date_p.replace(/-/g,'/');
      return date_p;
  }
  function parseDate(date_str){
   date_str=date_str.substr(0,4)+'/'+date_str.substr(4,2)+'/'+date_str.substr(6,2);
   var date=new Date(date_str);
   //log.debug('date', date.toISOString()); 
   var date_p=date.toISOString().split('T')[0];
   //log.debug('date_p', date_p); 
   date_p=date_p.replace(/-/g,'/');
   return date_p;
}
  function splittex(str){
      var re_str=str;
      if(re_str.indexOf('/')!=-1){
          re_str=re_str.substr(0,re_str.indexOf('/'));
      }
      return re_str;
  }
  function right(str, num){
   return str.substring(str.length-num,str.length)
  }
  function XMLEncode(str){
      str=str.replace(/\<br\/\>/g," ");
      return str;
  }
  function search_customer(reference_number){
    var cus_id='';
    if(reference_number!=''){
        var customerSearchObj = search.create({
            type: "customer",
            filters:
            [
               ["custentity_vacc_check_number","is",reference_number]
            ],
            columns:
            [
             
            ]
         });
         var searchResultCount = customerSearchObj.runPaged().count;
         log.debug("customerSearchObj result count",searchResultCount);
         customerSearchObj.run().each(function(result){
            cus_id=result.id;
            return true;
         });
    }
   
    return cus_id;
    
  }



   return {
       execute: execute
   }
});

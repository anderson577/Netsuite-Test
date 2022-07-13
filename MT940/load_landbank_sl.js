/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search','N/file','N/log','N/ui/serverWidget','N/runtime','N/record','N/url'], 

function(search, file, log, ui, runtime, record, url) {

    function onRequest(context) {

        try {
            var request  = context.request;
            var response = context.response;
            //log.debug('request',request)                             
            log.debug('request.method',request.method)    
            if (request.method === 'GET'){
                var folderObj = file.load({
                    id: '../MT940F/'+request.parameters.filename //土銀台幣.txt  土銀美金對帳單明細文字檔.txt
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
               
                response.write(JSON.stringify(parsedata,null,2));
                
            }else if(request.method === 'POST'){
    
            }
        } catch (error) {
            log.debug('error',error); 
        }
      
    
     
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
    return {
        onRequest: onRequest
    }
});
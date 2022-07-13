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
                    id: '../MT940F/'+request.parameters.filename //玉山銀行TWD_E格式.txt  玉山外幣_F格式.txt
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
                        re_data['備註']= detailstr.substr(splitindex).trim();      
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
                        re_data['備註']= last_data[0].substr(splitindex).trim(); 
                        re_data['實際交易日期']= parseDate(last_data[1].substr(0,8));                    
                        re_data['實際交易時間']= last_data[1].substr(8,2)+':'+ last_data[1].substr(10,2)+':'+last_data[1].substr(12,2); 
                        re_data['交易分行']= last_data[1].substr(14,4);
                        re_data['備註2']= last_data[1].substr(18);          
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
    return {
        onRequest: onRequest
    }
});
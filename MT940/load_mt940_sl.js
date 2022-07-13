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
                    id: '../MT940F/'+request.parameters.filename//MT940-NEXTLINK-TW Accounts-20220429.txt'
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
                            var date=parseDate(datestr);
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
                        reconciliation_rec.save(); 

                    } 
                } 
                response.write(JSON.stringify(parsedata,null,2));
                
                
            }else if(request.method === 'POST'){
    
            }
        } catch (error) {
            log.debug('error',error); 
        }
      
    
     
    }
    function parseDate(date_str){
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
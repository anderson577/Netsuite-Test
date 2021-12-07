function customizeGlImpact(transactionRecord, standardLines, customLines, book){
    // nlapiLogExecution('Debug','transactionRecord', transactionRecord);
    var recType = transactionRecord.getRecordType();
    nlapiLogExecution('Debug','recType', recType);
    // var id = transactionRecord.getId();
    nlapiLogExecution('Debug','custbody_iv_advance_id', transactionRecord.getFieldValue('custbody_iv_advance_id'));

    if(recType =='depositapplication' && transactionRecord.getFieldValue('custbody_iv_advance_id') != ''){

        var companyInfo = nlapiLoadConfiguration('companypreferences');

        var taxaccount = companyInfo.getFieldValue('custscript_iv_caa_taxaccount');
        var depositaccount = companyInfo.getFieldValue('custscript_iv_caa_depositaccount');
        var taxvendor = companyInfo.getFieldValue('custscript_iv_caa_taxvendor');
        var taxrate = parseInt(companyInfo.getFieldValue('custscript_iv_caa_taxrate'));
        nlapiLogExecution('Debug','taxaccount', taxaccount);
        nlapiLogExecution('Debug','depositaccount', depositaccount);

        var taxamt = transactionRecord.getFieldValue('applied');
        
        var currency_rec = nlapiLoadRecord('currency', transactionRecord.getFieldValue('currency'))
        nlapiLogExecution('Debug','currencyprecision', currency_rec.getFieldValue('currencyprecision'));
        if(currency_rec.getFieldValue('currencyprecision') == 0){
            taxamt = Math.round((Number(taxamt) * 100) / (100 + taxrate) * taxrate / 100)
            taxamt = Math.round(taxamt * transactionRecord.getFieldValue('exchangerate'))
        }else if(currency_rec.getFieldValue('currencyprecision') == 2){
            taxamt = Math.round(((Number(taxamt) * 100) / (100 + taxrate) * taxrate / 100) * 100) / 100
            taxamt = Math.round(taxamt * transactionRecord.getFieldValue('exchangerate'))
        }
        
        nlapiLogExecution('Debug','taxamt', taxamt);

        var depo_id = transactionRecord.getFieldValue('deposit')
        var buId = transactionRecord.getFieldValue('department');
        var classId = transactionRecord.getFieldValue('class');
        var cusId = transactionRecord.getFieldValue('customer');
        // nlapiLogExecution('Debug','cusId', cusId);

        var remaining = nlapiLookupField('customerdeposit', depo_id, 'custbody_iv_remaining');
        nlapiLogExecution('Debug','remaining', remaining);

        var newLine = customLines.addNewLine();                            
            newLine.setAccountId(parseInt(depositaccount));
            if(remaining >= taxamt){
                newLine.setCreditAmount(taxamt);
            }else{
                newLine.setCreditAmount(remaining);
            }            
            //newLine.setMemo("custom GL");
            newLine.setEntityId(parseInt(cusId));
            if(buId!='')
                newLine.setDepartmentId(parseInt(buId));
            if(classId!='')
                newLine.setClassId(parseInt(classId));     

        var newLine = customLines.addNewLine();
            newLine.setAccountId(parseInt(taxaccount));
            if(remaining > taxamt){
                newLine.setDebitAmount(taxamt);
            }else{
                newLine.setDebitAmount(remaining);
            }            
            //newLine.setMemo("custom GL");
            newLine.setEntityId(parseInt(taxvendor));
            if(buId!='')
                newLine.setDepartmentId(parseInt(buId));
            if(classId!='')
                newLine.setClassId(parseInt(classId));

    }    
}

//除法 
function accDiv(arg1,arg2){   
    var t1=0,t2=0,r1,r2;   
    try{t1=arg1.toString().split(".")[1].length}catch(e){}   
    try{t2=arg2.toString().split(".")[1].length}catch(e){}   
    with(Math){   
        r1=Number(arg1.toString().replace(".",""))   
        r2=Number(arg2.toString().replace(".",""))  
        return accMul((r1/r2),pow(10,t2-t1));   
    }   
}


//除法 
function accDiv(arg1,arg2){   
    var t1=0,t2=0,r1,r2;   
    try{t1=arg1.toString().split(".")[1].length}catch(e){}   
    try{t2=arg2.toString().split(".")[1].length}catch(e){}   
    with(Math){   
        r1=Number(arg1.toString().replace(".",""))   
        r2=Number(arg2.toString().replace(".",""))  
        return accMul((r1/r2),pow(10,t2-t1));   
    }   
}

//乘法   
function accMul(arg1,arg2){    
    var m=0,s1=arg1.toString(),s2=arg2.toString();    
    try{m+=s1.split(".")[1].length}catch(e){}    
    try{m+=s2.split(".")[1].length}catch(e){}    
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)    
}

function fetch_pos_payment(cs_Id){
    var pos_payment = new Array;
    var customrecord_iv_pos_payment_listSearch = nlapiSearchRecord("customrecord_iv_pos_payment_list",null,
    [
        ["custrecord_iv_ppl_source_cash_sales","anyof",cs_Id]
    ], 
    [
        new nlobjSearchColumn("custrecord_iv_ppl_payment_method"), 
        new nlobjSearchColumn("custrecord_iv_ppl_payment_account"), 
        new nlobjSearchColumn("custrecord_iv_ppl_payment_amt"),
        new nlobjSearchColumn("custrecord_iv_ptl_service_fee_acct","CUSTRECORD_IV_PPL_PAYMENT_METHOD",null), 
        new nlobjSearchColumn("custrecord_iv_ptl_service_fee","CUSTRECORD_IV_PPL_PAYMENT_METHOD",null), 
        new nlobjSearchColumn("formulanumeric").setFormula("{custrecord_iv_ppl_payment_amt}*{custrecord_iv_ppl_payment_method.custrecord_iv_ptl_service_fee}")
    ]
    );
    if(customrecord_iv_pos_payment_listSearch){
        for(var i = 0; i < customrecord_iv_pos_payment_listSearch.length; i++){
            nlapiLogExecution('Debug','source_acc:', customrecord_iv_pos_payment_listSearch[i]);
            var account = customrecord_iv_pos_payment_listSearch[i].getValue('custrecord_iv_ppl_payment_account');
            var amount = customrecord_iv_pos_payment_listSearch[i].getValue('custrecord_iv_ppl_payment_amt');
            var memo = customrecord_iv_pos_payment_listSearch[i].getText('custrecord_iv_ppl_payment_method');
            var service_account = customrecord_iv_pos_payment_listSearch[i].getValue("custrecord_iv_ptl_service_fee_acct","CUSTRECORD_IV_PPL_PAYMENT_METHOD",null);
            var service_amount = customrecord_iv_pos_payment_listSearch[i].getValue("formulanumeric")
            if(account!=''){
                pos_payment.push({
                    account: account,
                    amount: amount ,
                    memo: memo,
                    service_account: service_account,
                    service_amount: service_amount,
                })
            }
        }
    }

    return pos_payment
}

function search_acc_id(number){
    var accountSearch = nlapiSearchRecord("account",null,
    [
       ["number","is",number]
    ], 
    [
       new nlobjSearchColumn("internalid"), 
       new nlobjSearchColumn("number")     
    ]
    );
  var accID='';
    if(accountSearch){
        for(var i = 0; i < accountSearch.length; i++){
            accID = accountSearch[i].getValue("internalid")
            break;
        }
    }

    return accID
}
 

 
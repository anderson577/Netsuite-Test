/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define([ 'N/record', 'N/search', 'N/file', 'N/render', 'N/log', 'N/format', 'N/https', 'N/url', 'N/runtime'],
function( record, search, file, render, log, format, https, url, runtime) {
    function onRequest(context) {
    	      
        var id = context.request.parameters.id;
        var type = context.request.parameters.type; 
        log.debug('id',id);
        log.debug('type',type);    

        try {
            var exprept_rec = record.load({type: type ,id: id,isDynamic: true});
            var entity_id=exprept_rec.getValue('entity');
            log.debug('entity_id',entity_id);
            var subsidiary=exprept_rec.getValue('subsidiary');
            var subsidiary_t=exprept_rec.getText('subsidiary');
            var employee_rec = search.lookupFields({
                type: 'employee',
                id: entity_id,
                columns: ['department','class']
            });
            log.debug('employee_rec',employee_rec);
            var tranid=exprept_rec.getValue('tranid');
            var total=exprept_rec.getValue('total');
            var currency=exprept_rec.getValue('expensereportcurrency');
            log.debug('total',total);
            log.debug('subsidiary_t',subsidiary_t);
    
         
       
            var payment_rec = record.create({
                type: 'vendorpayment',
                isDynamic: true,
                defaultValues: {
                    entity: entity_id,                                
                }           
            });

       

            payment_rec.setValue({fieldId: 'apacct',value:search_account('220900'),ignoreFieldChange: true});      
            var account='';
            if(subsidiary_t=='博弘雲端科技股份有限公司')account=search_account('110610');
            if(subsidiary_t=='宏庭科技股份有限公司')account=search_account('110620');
            if(subsidiary_t=='Nextlink (HK) Technology CO., Limited')account=search_account('110630');
            log.debug('subsidiary_t',subsidiary_t);
            log.debug('account',account);
            
            //payment_rec.setText({fieldId: 'approvalstatus',text:'Approved',ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'account',value:account,ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'subsidiary',value:subsidiary,ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'department',value:employee_rec.department[0].value,ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'class',value:employee_rec.class[0].value,ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'trandate',value:exprept_rec.getValue('trandate'),ignoreFieldChange: true});
            payment_rec.setValue({fieldId: 'postingperiod',value:exprept_rec.getValue('postingperiod'),ignoreFieldChange: true});
            var numberOfTransactions = payment_rec.getLineCount({ sublistId:'apply' });
            for (var i = 0; i < numberOfTransactions; i++) {
                payment_rec.selectLine({sublistId: 'apply',line: i,});
                var doc = payment_rec.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'doc' });
                if(doc==id){
                    payment_rec.setCurrentSublistValue({sublistId: 'apply',fieldId: 'apply',value: true}); 
                    payment_rec.commitLine({sublistId: 'apply'});
                }
            }
            log.debug('payment_rec',payment_rec);
            payment_rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });  
    
            var journal_rec = record.create({
                type: 'journalentry',
                isDynamic: true,
                defaultValues: {
                    subsidiary: subsidiary
                }           
            });
            var memo='迴轉自Expense Report #'+tranid;
            journal_rec.setValue({fieldId: 'memo',value:memo,ignoreFieldChange: true});
            journal_rec.setValue({fieldId: 'currency',value:currency,ignoreFieldChange: true});
           // journal_rec.setText({fieldId: 'approvalstatus',text:'Approved',ignoreFieldChange: true});
            journal_rec.setValue({fieldId: 'trandate',value:exprept_rec.getValue('trandate'),ignoreFieldChange: true});
            journal_rec.setValue({fieldId: 'postingperiod',value:exprept_rec.getValue('postingperiod'),ignoreFieldChange: true});
            journal_rec.insertLine({sublistId: 'line',line: 0});
            journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value: account});
            journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'debit',value: total});
            journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'memo',value: memo});
            journal_rec.commitLine({sublistId: 'line'});
            var line=1;
            var expenseLinecount = exprept_rec.getLineCount({ sublistId:'expense' });
            for (var i = 0; i < expenseLinecount; i++) {
                var expens_account= exprept_rec.getSublistValue({sublistId: 'expense',fieldId: 'expenseaccount',line:i});
                var expens_amount= exprept_rec.getSublistValue({sublistId: 'expense',fieldId: 'amount',line:i});
                var expens_grossamt= exprept_rec.getSublistValue({sublistId: 'expense',fieldId: 'grossamt',line:i});
                var expens_department= exprept_rec.getSublistValue({sublistId: 'expense',fieldId: 'department',line:i});
                var expens_class= exprept_rec.getSublistValue({sublistId: 'expense',fieldId: 'class',line:i});
                journal_rec.insertLine({sublistId: 'line',line: line});
                journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value: expens_account});
                journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'credit',value: expens_grossamt==''?expens_amount:expens_grossamt});
                journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'memo',value: memo});
                journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'department',value: expens_department});
                journal_rec.setCurrentSublistValue({sublistId: 'line',fieldId: 'class',value: expens_class});
                journal_rec.commitLine({sublistId: 'line'});
                line++;
            }
            log.debug('journal_rec',journal_rec); 
            journal_rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            }); 
    
            var expense_url  = url.resolveRecord({recordType: type ,recordId:id ,isEditMode: false});
            var payment_url = url.resolveRecord({recordType: payment_rec.type,recordId: payment_rec.id,isEditMode: false});
            var journal_url = url.resolveRecord({recordType: journal_rec.type,recordId: journal_rec.id,isEditMode: false});
            var html = "<script>window.open('"+payment_url+"','_blank');window.open('"+journal_url+"','_blank');window.open('"+expense_url+"','_self');</script>";
            context.response.write( html );
        } catch (error) {
            log.error('context',context);
            log.error('error',error);
            var html = "<body>錯誤信息:<br/>"+error+"<br/>請通知管理人員!</body>";
            context.response.write( html );

        }

    
    	
    	return;
    	
	}
    function search_account(number){
        var accountSearchObj = search.create({
            type: "account",
            filters:
            [
                ["number","is",number]
            ],
            columns:
            [
               search.createColumn({name: "number", label: "Number"}),             
            ]
         });
         var account_id = '';
     
         accountSearchObj.run().each(function(result){
            account_id=result.id;
            return true;
         });


         return account_id;
    }
  

    return {
        onRequest: onRequest
    };
    
});
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    
    function pageInit(context) {
        var url=window.location.href;
      
    }
    function filter(context) {        
        window.onbeforeunload = null;
        var current_rec = currentRecord.get();      
      
        // document.getElementById("pickdata").value = JSON.stringify(line);
        document.getElementById("main_form").submit();
    }
    
    function fieldChanged(context) {
        window.onbeforeunload = null; 
        var current_rec = context.currentRecord; 
        if (context.fieldId == 'custpage_pt_customer') {
            var recipients_selectOptions = current_rec.getField({ fieldId: 'custpage_recipients' });
            if(recipients_selectOptions!=null){                   
                recipients_selectOptions.removeSelectOption({
                    value: null,
                });         
            }
        

            var invoice_recipients_selectOptions = current_rec.getField({ fieldId: 'custpage_invoice_recipients' });
            if(invoice_recipients_selectOptions!=null){                     
                invoice_recipients_selectOptions.removeSelectOption({
                    value: null,
                });
            }
           
        }
    

      
    }
    function sublistChanged(context) {
        //console.log('context.operation',context.operation);
     
      
    }
    function select_all(context){
        var current_rec = currentRecord.get();
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
       
      
        for (var i = 0; i < linecount; i++) {
            current_rec.selectLine({sublistId: 'custpage_cuslist_invoice',line: i});
            current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value: true,ignoreFieldChange: false});           
            current_rec.commitLine({sublistId: 'custpage_cuslist_invoice',ignoreRecalc:true});  
        } 
      
    }
    function cancel_all(context){
        var current_rec = currentRecord.get();
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
       
      
        for (var i = 0; i < linecount; i++) {
            current_rec.selectLine({sublistId: 'custpage_cuslist_invoice',line: i});
            current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',value: false,ignoreFieldChange: false});           
            current_rec.commitLine({sublistId: 'custpage_cuslist_invoice',ignoreRecalc:true});  
        } 
      
    }
    function view() {
        var current_rec = currentRecord.get();
       
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' });
        var cus_id='',inv_id_L=[];
        for (var i = 0; i < linecount; i++) {
            var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_select',line:i });
            cus_id = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_customer_id',line:i });
            if(select_L==true){
                var inv_id = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_id',line:i });
                inv_id_L.push(inv_id);
            }
        }
        if(inv_id_L.length==0){
            alert('請至少選擇一張發票!');  
            return;
        } 
		var scriptUrl = url.resolveScript({
			scriptId: 'customscript_dunning_letter_sl',
			deploymentId: 'customdeploy_dunning_letter_sl',
			returnExternalUrl: false,
			params:{ cus_id:cus_id,mode:'view',inv_L:JSON.stringify(inv_id_L)}
        });
        log.debug("scriptUrl",scriptUrl)
		
		window.open(scriptUrl, "_blank");

	}
    function send() {
        var current_rec = currentRecord.get();
        var recipients=current_rec.getValue('custpage_recipients'); 
        var email_L=[];
        for (var i = 0; i < recipients.length; i++) {
            if(recipients[i].indexOf('#@')!=-1){
                var mail=recipients[i].split('#@')[0];
                if(email_L.indexOf(mail)==-1)email_L.push(mail);
            }
        }
        console.log('email_L',email_L);

	}
   
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,  
        sublistChanged: sublistChanged,
        filter:filter,
        select_all:select_all,
        cancel_all:cancel_all,
        view:view,
        send:send
    };
});
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime', 'N/format'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime,format) {

    
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

            
            var sales_team_selectOptions = current_rec.getField({ fieldId: 'custpage_sales_team' });
            if(sales_team_selectOptions!=null){                     
                sales_team_selectOptions.removeSelectOption({
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
        var bu=current_rec.getValue('budata');
		var scriptUrl = url.resolveScript({
			scriptId: 'customscript_dunning_letter_sl',
			deploymentId: 'customdeploy_dunning_letter_sl',
			returnExternalUrl: false,
			params:{ bu:bu,cus_id:cus_id,mode:'view',inv_L:JSON.stringify(inv_id_L),send_L:''}
        });
        log.debug("scriptUrl",scriptUrl)
		console.log('scriptUrl',scriptUrl);
		window.open(scriptUrl, "_blank");

	}
    function send() {
        var current_rec = currentRecord.get();
        var email_L=[],email_L_str='';
        var recipients=current_rec.getValue('custpage_recipients');
        for (var i = 0; i < recipients.length; i++) {
            if(recipients[i].indexOf('#@')!=-1){
                var mail=recipients[i].split('#@')[0];
                if(email_L.indexOf(mail)==-1)email_L.push(mail);
            }
        }

        var invoice_recipients=current_rec.getValue('custpage_invoice_recipients');
        for (var i = 0; i < invoice_recipients.length; i++) {
            if(invoice_recipients[i].indexOf('#@')!=-1){
                var mail=invoice_recipients[i].split('#@')[0];
                if(email_L.indexOf(mail)==-1)email_L.push(mail);
            }
        }

        // var sales_team_recipients=current_rec.getValue('custpage_sales_team');
        // for (var i = 0; i < sales_team_recipients.length; i++) {
        //     if(sales_team_recipients[i].indexOf('#@')!=-1){
        //         var mail=sales_team_recipients[i].split('#@')[0];
        //         if(email_L.indexOf(mail)==-1)email_L.push(mail);
        //     }
        // }
        console.log('email_L',email_L);
        if(email_L.length==0){
            alert('請至少選擇一位收件人!');  
            return;
        } 
        for(var i = 0; i < email_L.length; i++){
            if(i!=0)email_L_str+=',';
            email_L_str+=email_L[i];
        }
           
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
        var bu=current_rec.getValue('budata');
		var scriptUrl = url.resolveScript({
			scriptId: 'customscript_dunning_letter_sl',
			deploymentId: 'customdeploy_dunning_letter_sl',
			returnExternalUrl: false,
			params:{ bu:bu,cus_id:cus_id,mode:'send',inv_L:JSON.stringify(inv_id_L),send_L:email_L_str}
        });
        log.debug("scriptUrl",scriptUrl)
        var domain_url = 'https://' + url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
          });
          scriptUrl=domain_url + scriptUrl;      
          var response = https.post({url:scriptUrl});  
          
          var rec_status= response.body;
          
          if(rec_status=='success'){
            var cus_rec = record.load({
                type: 'customer', 
                id: cus_id,
                isDynamic: false,
            });
            var date = new Date();
            var TAIPEI_current_date = format.format({
                value: date,
                type: format.Type.DATETIMETZ,
                timezone: format.Timezone.ASIA_TAIPEI
            })             
            TAIPEI_current_date=TAIPEI_current_date.substr(0,TAIPEI_current_date.indexOf(' '));                 
            if(bu=='AWS')cus_rec.setText({fieldId: 'custentity_aws_last_dunning_date',text:TAIPEI_current_date,ignoreFieldChange: true});
            if(bu=='GCP')cus_rec.setText({fieldId: 'custentity_gcp_last_dunning_date',text:TAIPEI_current_date,ignoreFieldChange: true}); 
            if(bu=='GWS')cus_rec.setText({fieldId: 'custentity_gws_last_dunning_date',text:TAIPEI_current_date,ignoreFieldChange: true});  
            cus_rec.save(); 
            Ext.Msg.show({title: 'success',width: 250,buttons: Ext.Msg.OK, msg:'已成功發送'});
          }else{
            Ext.Msg.show({title: 'error',width: 250,buttons: Ext.Msg.OK, msg:'出錯，請重新整理再試!'});
          }        
		
	

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
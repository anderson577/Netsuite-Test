/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    function pageInit(context) {

    }

    function ToSearch() {      
        window.onbeforeunload = null;
        document.getElementById("custpage_search_data").value='';
        var current_rec = currentRecord.get();
        var parameter1 = current_rec.getValue({fieldId : 'custpage_parameter1'});    
      
        var vurl = url.resolveScript({
            scriptId: 'customscript_connectsf_handler_sl',
            deploymentId: 'customdeploy_connectsf_handler_sl',
            returnExternalUrl: false,
            params: {parameter1: parameter1}
          });
  
        var domain_url = 'https://' + url.resolveDomain({
        hostType: url.HostType.APPLICATION,
        accountId: runtime.accountId
        });
        vurl=domain_url + vurl;      
        var response = https.post({url:vurl});
        var obj = JSON.parse(response.body);
        var pretty = JSON.stringify(obj, undefined, 4);
        document.getElementById("custpage_search_data").value=pretty;      
        document.getElementById("main_form").submit();    
    }

  
    
    return {
        pageInit: pageInit,         
        ToSearch: ToSearch,      
    };
});
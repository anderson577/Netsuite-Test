/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search','N/file','N/log','N/ui/serverWidget','N/runtime','N/record','N/url'], 

function(search, file, log, ui, runtime, record, url) {

    function onRequest(context) {

        var request  = context.request;
        var response = context.response;
        // log.debug('request',request)                             

        if (request.method === 'GET'){
            var form = ui.createForm({
                title: 'Salesforce Test'
            });

            form.addButton({
                id : 'custpage_search',
                label : '查詢',
                functionName: "ToSearch"
            });
             

            var filter1 = form.addFieldGroup({
                id: 'filter1',
                label: 'setion1'
            });

            form.clientScriptModulePath = "./ConnectSF_cs.js";
            

            var field_filter = form.addField({
                id : 'custpage_parameter1',
                type : ui.FieldType.TEXT,
                label : '參數',
                container: "filter1" 
            });
            var field_search_data = form.addField({
                id : 'custpage_search_data',
                type : ui.FieldType.TEXTAREA,
                label : '解析內容',
                container: "filter1" 
            });
            field_search_data.updateDisplaySize({
                height : 15,
                width : 60
            });
            var savedata = form.addField({ 
                id: "savedata", 
                label: "Save Data", 
                type: ui.FieldType.TEXT, 
            });            
            savedata.defaultValue = 'F';  
            savedata.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        

          
            
            response.writePage(form);
            
            
        }else if(request.method === 'POST'){
            var form = ui.createForm({
                title: 'Salesforce Test'
            });

            form.addButton({
                id : 'custpage_search',
                label : '查詢',
                functionName: "ToSearch"
            });
             

            var filter1 = form.addFieldGroup({
                id: 'filter1',
                label: 'setion1'
            });

            form.clientScriptModulePath = "./ConnectSF_cs.js";
            

            var field_filter = form.addField({
                id : 'custpage_parameter1',
                type : ui.FieldType.TEXT,
                label : '參數',
                container: "filter1" 
            });
            field_filter.defaultValue = context.request.parameters.custpage_parameter1;   

            var field_search_data = form.addField({
                id : 'custpage_search_data',
                type : ui.FieldType.TEXTAREA,
                label : '解析內容',
                container: "filter1" 
            });
            field_search_data.updateDisplaySize({
                height : 15,
                width : 60
            });
            field_search_data.defaultValue = context.request.parameters.custpage_search_data;   


            var savedata = form.addField({ 
                id: "savedata", 
                label: "Save Data", 
                type: ui.FieldType.TEXT, 
            });
            savedata.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        

          
            
            response.writePage(form);

        }
    
     
    }
 
    return {
        onRequest: onRequest
    }
});
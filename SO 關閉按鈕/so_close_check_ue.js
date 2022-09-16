/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/runtime','N/record', 'N/search','N/ui/serverWidget', 'N/format',"N/error"], 
function(runtime,record,search,serverWidget,format,error) {

    function beforeLoad(context) {

        if(context.type=='view'){
            var rec = context.newRecord;
            var statusRef=rec.getValue('statusRef');
            if(statusRef!='closed' && statusRef!='fullyBilled'){
                context.form.removeButton('closeremaining');
                context.form.addButton({
                    id: 'custpage_close_order',
                    label: "關閉訂單",
                    functionName: 'close_order'
                });
                context.form.clientScriptModulePath = './so_close_check_cs.js';
            }        
        }
     
    }

  
   
    function beforeSubmit(context) {
     
        
    }
    function afterSubmit(context) {
     
         
    }
   
    return {
        beforeLoad: beforeLoad,
        beforeSubmit:beforeSubmit,
        afterSubmit: afterSubmit,     
    }
});


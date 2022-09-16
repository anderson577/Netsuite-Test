/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js','N/error'],
 function(record, runtime, search, serverWidget, format,https,SF,error) {

    function beforeLoad(context) {
        var rec = context.newRecord;
        if (context.type == "create" ){ 
            var user_roleId=runtime.getCurrentUser().roleId;
            if(user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk    
                var form=context.form;
                var hideFld = form.addField({
                    id:'custpage_hide_buttons',
                    label:'not shown - hidden',
                    type: serverWidget.FieldType.INLINEHTML
                });
                var scr = "";
                // scr += 'jQuery("#payall").hide();';
                // scr += 'jQuery("#autoapply").hide();';
                scr += 'setTimeout(function(){jQuery("#clear").click();},2000);';
                
                hideFld.defaultValue = "<script>jQuery(function($){require([], function(){" + scr + ";})})</script>";             
            }

        }
    }

    function beforeSubmit(context) { 
        var rec = context.newRecord;
        if (context.type == "create" ){ 
            var user_roleId=runtime.getCurrentUser().roleId;
            if(user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk    
                var applied =rec.getValue('applied');
                if(applied!=0){                  
                    var err = error.create({
                        name: '注意',
                        message: '財務人員才可建立有Apply的Credit Memo!',
                        notifyOff: true
                    });
        
                    throw err;  
                }     
            }
        }          
    }

    function afterSubmit(context) {  
    }
   

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

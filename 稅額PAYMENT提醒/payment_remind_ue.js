/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/config', 'N/search','N/ui/serverWidget'], function(record, runtime, config, search,serverWidget) {

    function beforeLoad(context) {
        var rec = context.newRecord;
        if (context.type == "create"){            
            if(context.request!=undefined){
                var parameter=context.request.parameters;
                if(parameter!=null&&parameter!=undefined&&parameter!=''){
                    var account = context.request.parameters['account'];      
                    log.debug('account', account); 
                    if(account!='' && account!=undefined && account!=null){                
                        rec.setValue({fieldId: 'account',value:account,ignoreFieldChange: true});
                        if(rec.type=='vendorpayment')rec.setValue({fieldId: 'apacct',value:1400,ignoreFieldChange: true});//應付稅捐
        
                    }    
                }       
            }           
        }
        var new_create=rec.getValue('custbody_new_create');
        if(new_create==true && context.type=='view'){
            var hideFld = context.form.addField({
                id:'custpage_hide_app_buttons',
                label:'not shown - hidden',
                type: serverWidget.FieldType.INLINEHTML
            });
            var account ='';
            var subsidiary = rec.getText('subsidiary');
            var entityid;
            if(subsidiary.indexOf('博弘雲端科技股份有限公司')!=-1){
                entityid=3019;
                account=229;//博弘銀行存款-活存 - TWD土銀西湖 15881
            }
            if(subsidiary.indexOf('宏庭科技股份有限公司')!=-1){
                entityid=3016;
                account=427;//宏庭銀行存款-活存 - TWD土銀西湖 15961
            }
            var urltype='';
            if(rec.type=='vendorpayment')urltype='vendpymt';
            if(rec.type=='vendorprepayment')urltype='vprep';
            var url='/app/accounting/transactions/'+urltype+'.nl?entity='+entityid+'&account='+account;
         
            var scr =  "Ext.Msg.show({"+
                "title: '提醒',width: 300,buttons: Ext.Msg.OK, msg:'請記得建立稅額!',icon :Ext.MessageBox.INFO,"+
                "fn: function (button){"+                   
                    "if(button == 'ok'){"+                                       
                        "window.open('"+url+"','_blank');"+
                    "}"+
                "}"+
            "});";                 
         
            hideFld.defaultValue = "<script>jQuery(function($){require([], function(){" + scr + ";})})</script>";
            record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    custbody_new_create: false
                }
            });
        }
       
    }

    function beforeSubmit(context) {
        var rec = context.newRecord;
        if (context.type == "create"){
            var entity = rec.getValue('entity');
            var vendor_rec = search.lookupFields({
                type: 'entity',
                id: entity,
                columns: ['altname','custentity_create_tax']
            });
            log.debug('vendor_rec', vendor_rec);
            if(vendor_rec.altname!=""){
                if(vendor_rec.altname.indexOf(' 國稅局-')==-1){
                    if(rec.type=='vendorpayment' && vendor_rec.custentity_create_tax==true){
                        rec.setValue({fieldId: 'custbody_new_create',value:true,ignoreFieldChange: true}); 
                    }
                    if(rec.type=='vendorprepayment' && vendor_rec.custentity_create_tax==true){
                        rec.setValue({fieldId: 'custbody_new_create',value:true,ignoreFieldChange: true}); 
                    }
                    
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

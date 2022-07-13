/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js','N/error'],
 function(record, runtime, search, serverWidget, format,https,SF,error) {

    function beforeLoad(context) {
        var rec = context.newRecord;
        if (context.type == "edit" ){ 
            var customer_rec_stage='';
            if(rec.id!=''){
                var customer_rec = search.lookupFields({
                    type: 'customer',
                    id: rec.id,
                    columns: ['stage']
                });
                customer_rec_stage=customer_rec.stage[0].text;
                log.debug("customer_rec_stage", customer_rec_stage);
            }
            var user_roleId=runtime.getCurrentUser().roleId;     
            if(customer_rec_stage=='Customer'){
                
                if(user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                    //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk    
                    context.form.getField({id: 'companyname'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});
                    context.form.getField({id: 'vatregnumber'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});
                    context.form.getField({id: 'subsidiary'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});                    
                }                
            }
            if(user_roleId!='administrator'){
                context.form.getField({id: 'parent'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});           
            }   
            
        }
    }

    function beforeSubmit(context) { 
        var rec = context.newRecord;
        var isperson=rec.getValue({ fieldId: 'isperson' });
        var name=isperson=='T'?rec.getValue({ fieldId: 'firstname' })+rec.getValue({ fieldId: 'middlename' })+rec.getValue({ fieldId: 'lastname' })
        :rec.getValue({ fieldId: 'companyname' });
        var vacc_number=rec.getValue({ fieldId: 'custentity_vacc_number' });
        //log.debug("vacc_number", vacc_number);
        if(isNumeric(vacc_number)&&vacc_number.length==13){
            var check_vacc_number=ser_checknumber(vacc_number);
            log.debug("check_vacc_number", check_vacc_number);
            rec.setValue({fieldId: 'custentity_vacc_check_number',value:check_vacc_number,ignoreFieldChange: true});
        }else{
            rec.setValue({fieldId: 'custentity_vacc_check_number',value:'',ignoreFieldChange: true});
        }

    
        if(context.type == "create" ){               
            var subsidiary=rec.getValue({ fieldId: 'subsidiary' });
            var parent=rec.getValue({ fieldId: 'parent' });
            var filter=[
                ["subsidiary","anyof",subsidiary], 
                "AND",
                ["entityid","is",name]
            ];
            if(parent!=''){
                filter.push("AND");
                filter.push(["parentcustomer.internalid","anyof",parent]);
            }else{                    
                filter.push("AND");
                filter.push(["parentcustomer.entityid","isempty",""]);
            }
            log.debug("filter", filter);
            var customerSearchObj = search.create({
                type: "customer",
                filters:filter,
                columns:
                [    
                    search.createColumn({name: "altname",label: "Name"}),                   
                ]
             });
             
             var searchResultCount = customerSearchObj.runPaged().count;
             log.debug("customerSearchObj result count",searchResultCount);
             var msg='';
             customerSearchObj.run().each(function(result){
                msg+=result.getValue('altname')+'<br/>';
                return true;
             });
             if(msg!=''){
                var err = error.create({
                    name: '注意',
                    message: '已有重複客戶:<br/>'+msg,
                    notifyOff: true
                });
    
                throw err;                   
             }
             if(searchResultCount!=0){
                var err = error.create({
                    name: '注意',
                    message: '系統繁忙請稍等在再次儲存',
                    notifyOff: true
                });
    
                throw err;                   
             }
        }
        var vatregnumber = rec.getValue('vatregnumber');
        log.debug('vatregnumber', vatregnumber);   
        if(vatregnumber=='')
            rec.setValue({fieldId: 'vatregnumber',value:'N/A',ignoreFieldChange: true});
            
        var customer_rec_stage='';
        var customer_rec_status='';
        log.debug("rec.id", rec.id);
        if(rec.id!='' && rec.id!=null && rec.id!=undefined){
            var customer_rec = search.lookupFields({
                type: 'customer',
                id: rec.id,
                columns: ['stage','entitystatus']
            });
         
            customer_rec_stage=customer_rec.stage[0].text;
            customer_rec_status=customer_rec.entitystatus[0].value;
            log.debug("customer_rec_stage", customer_rec_stage);
            log.debug("customer_rec_status", customer_rec_status);
        }
        var entitystatus=rec.getValue({ fieldId: 'entitystatus' });
        log.debug("entitystatus", entitystatus);
        if(entitystatus!=''){
            var customerstatus_rec = record.load({
                type: 'customerstatus',
                id: entitystatus,
                isDynamic: false
            });
            var stage=customerstatus_rec.getValue('stage');
            log.debug("stage", stage); 
            rec.setValue({ fieldId: 'custentity_check_customer',value:entitystatus==13?'Y':''}); 
            var user_roleId=runtime.getCurrentUser().roleId;                     
            if(customer_rec_stage!='Customer' && user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk                       
                if(stage=='CUSTOMER'){                   
                    var err = error.create({
                        name: '注意',
                        message: '請財會人員轉客戶!',
                        notifyOff: true
                    });

                    throw err;                               
                }           
            }
            if(customer_rec_status!=13 && user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk  
                if(entitystatus==13){                   
                    var err = error.create({
                        name: '注意',
                        message: '請財會人員轉客戶-Win!',
                        notifyOff: true
                    });

                    throw err;                               
                }
            }                                                
        }                  
    }

    function afterSubmit(context) {  
    }
    function isNumeric(str) {
        if (typeof str != "string") return false // we only process strings!  
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
               !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
      }
    function ser_checknumber(num){
        var algorithm='';
        var checknumber='';
        for(var i=0;i<num.length;i++){
            if(i%2==0){
                algorithm+=parseInt(num[i])*2;
            }else{
                algorithm+=parseInt(num[i]);
            }
        }
        //log.debug('algorithm', algorithm); 
        var algorithm_c=0;
        for(var i=0;i<algorithm.length;i++){
            algorithm_c+=parseInt(algorithm[i]);
        }
        //log.debug('algorithm_c', algorithm_c); 
        if(algorithm_c%10==0){
            checknumber=num+0;
        }else{
            var check10=10*(parseInt(algorithm_c/10)+1);
            checknumber=num+(check10-algorithm_c);
        }

        return checknumber;

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

/**
 *@NModuleScope Public
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/log','N/runtime'], 
function(currentRecord, record, search, url, log, runtime) {
  
   
    function pageInit(context) {
        // log.debug('pageInit context', context)    
    }
  
    function saveRecord(context) {      
      
        try{
          
            var objRecord = context.currentRecord
            var isperson=objRecord.getValue({ fieldId: 'isperson' });
            log.debug("isperson", isperson);
            var name=isperson=='T'?objRecord.getValue({ fieldId: 'firstname' })+objRecord.getValue({ fieldId: 'middlename' })+objRecord.getValue({ fieldId: 'lastname' })
            :objRecord.getValue({ fieldId: 'companyname' });
            log.debug("name", name);
            var subsidiary=objRecord.getValue({ fieldId: 'subsidiary' });
            if(subsidiary==''){
                Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請填入SUBSIDIARY!'});
                return false;      
            }
            var vatregnumber = objRecord.getValue('vatregnumber').toUpperCase();
            if(vatregnumber!=''){

                if(vatregnumber=='N/A'||vatregnumber=='N\\A'){              
                    objRecord.setValue({fieldId: 'vatregnumber',value:'N/A'});
                }else if(vatregnumber.length!=8){                  
                    Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請輸入統編8碼，無則填N/A!'});
                    return false;  
                }
            }

            if(objRecord.id==''){               
               
                var parent=objRecord.getValue({ fieldId: 'parent' });
                log.debug("parent", parent);
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
                    msg+='<a href="/app/common/entity/custjob.nl?id='+result.id+'" target="_blank">'+result.getValue('altname')+'</a><br/>';
                    return true;
                 });
                 if(msg!=''){
                    Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'已有重複客戶:<br/>'+msg});
                    return false;     
                 }
                 if(searchResultCount!=0){
                    Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'系統繁忙請稍等在再次儲存'});
                    return false;                                 
                 }
            }
            var customer_rec_stage='';
            var customer_rec_status='';
            if(objRecord.id!=''){
                var customer_rec = search.lookupFields({
                    type: 'customer',
                    id: objRecord.id,
                    columns: ['stage','entitystatus']
                });
                customer_rec_stage=customer_rec.stage[0].text;
                customer_rec_status=customer_rec.entitystatus[0].value;
                log.debug("customer_rec_stage", customer_rec_stage);
            }
            var entitystatus=objRecord.getValue({ fieldId: 'entitystatus' });
            log.debug("entitystatus", entitystatus);
            if(entitystatus!=''){               
                var user_roleId=runtime.getCurrentUser().roleId;                     
                if(customer_rec_stage!='Customer' && user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                    //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk                       
                    if(entitystatus==13||entitystatus==15||entitystatus==16){//CUSTOMER
                        Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請財會人員轉客戶!'});
                        return false;                               
                    }
                } 
                if(customer_rec_status!=13 && user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
                    //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk  
                    if(entitystatus==13){ 
                        Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請財會人員轉客戶-Win!'});
                        return false;        
                    }
                }                                          
            }              
             
        }catch(e){
            log.debug("saveRecord_error", e);
            Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請財會人員轉客戶!'});
            return false;
        }  
        
        return true;
    }
  
    function validateField(context) {
          
    }
  
   
    function fieldChanged(context) {
     
        
    }
    
  

    function postSourcing(context) {    
      
    }
  
    function lineInit(context) {
          
    }
  
    function validateDelete(context) {
          
    }
  
    function validateInsert(context) {
        
    }
  
    function validateLine(context) {
          
    }
  
    function sublistChanged(context) {     

    }
  
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        saveRecord:saveRecord      
    }
});
  
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
            var entitystatus=objRecord.getValue({ fieldId: 'entitystatus' });
            log.debug("entitystatus", entitystatus);
            if(entitystatus!=''){
                var user_roleId=runtime.getCurrentUser().roleId;                     
                if(user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator'){//NextLink CFO,Consultant-Full Access,Administrator
                    var customerstatus_rec = record.load({
                        type: 'customerstatus',
                        id: entitystatus,
                        isDynamic: false
                    });
                    var stage=customerstatus_rec.getValue('stage');
                    log.debug("stage", stage);        
                    if(stage=='CUSTOMER'){
                        Ext.Msg.show({title: '提醒',width: 250,buttons: Ext.Msg.OK, msg:'請財會人員轉客戶!'});
                        return false;                               
                    }
                }                     
            }              
             
        }catch(e){
            log.debug("fieldChanged_error", e);
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
  
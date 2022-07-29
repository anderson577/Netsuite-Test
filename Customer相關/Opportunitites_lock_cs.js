/**
 *@NModuleScope Public
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/log'], 
function(currentRecord, record, search, url, log) {
  
   
    function pageInit(context) {
        // log.debug('pageInit context', context)    
    }
  
    function saveRecord(context) {
        var objRecord = context.currentRecord;
        if(objRecord.type=='salesorder'||objRecord.type=='invoice'){
            var entity=objRecord.getValue({ fieldId: 'entity' });
            log.debug("entity", entity);
            if(entity!=''){
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                    [
                       ["internalid","anyof",entity]
                    ],
                    columns:
                    [ 
                      search.createColumn({name: "entitystatus", label: "Status"})                         
                    ]
                 });
                var entitystatus='';
                 customerSearchObj.run().each(function(result){
                    log.debug("result", result);
                    entitystatus=result.getValue('entitystatus');
                    return true;
                 });
                 log.debug("entitystatus", entitystatus);
    
                 if(entitystatus!=13){
                    Ext.Msg.show({title: '提醒',width: 350,buttons: Ext.Msg.OK, msg:'Opportunitites、Prospect、LOST CUSTOMER請待財會轉客戶-Win才能選擇!'});
                    return false;
                 }
                 if(entitystatus==13){
                    objRecord.setValue({ fieldId: 'custbody_costomer_block', value: 'Y', ignoreFieldChange: true});
                    
                 }
            }  
        }       
        
        
        return true;
    }
  
    function validateField(context) {
          
    }
  
   
    function fieldChanged(context) {
        // var changedSublistId = context.id;
        //log.debug('fieldChanged field id: '+ context.fieldId); 
        //log.debug('fieldChanged fsublist id: '+ context.sublistId);
      
        try{
          
            var objRecord = context.currentRecord
            if (context.fieldId == "entity"){
                if(objRecord.type=='salesorder'||objRecord.type=='invoice'){
                    var entity=objRecord.getValue({ fieldId: 'entity' });
                    log.debug("entity", entity);
                    if(entity!=''){
                        var customerSearchObj = search.create({
                            type: "customer",
                            filters:
                            [
                               ["internalid","anyof",entity]
                            ],
                            columns:
                            [
                                search.createColumn({name: "entitystatus", label: "Status"})                            
                            ]
                         });
                        var entitystatus='';
                         customerSearchObj.run().each(function(result){
                            log.debug("result", result);
                            entitystatus=result.getValue('entitystatus');
                            return true;
                         });
                         log.debug("entitystatus", entitystatus);
        
                         if(entitystatus!=13){
                            Ext.Msg.show({title: '提醒',width: 350,buttons: Ext.Msg.OK, msg:'Opportunitites、Prospect、LOST CUSTOMER請待財會轉客戶-Win才能選擇!'});
                            objRecord.setValue({ fieldId: 'entity', value: null, ignoreFieldChange: true});
                         }
                    }         
                }                   
            }
            if(context.sublistId == "item" && context.fieldId == "custcol_cus_status"){
                if(objRecord.type=='purchaseorder'){
                    var customer_status=objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_cus_status' });
                    console.log('customer_status',customer_status);
                    if(customer_status!='Win' && customer_status!=''){
                        Ext.Msg.show({title: '提醒',width: 350,buttons: Ext.Msg.OK, msg:'Opportunitites、Prospect、LOST CUSTOMER請待財會轉客戶-Win才能選擇!'});
                        objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'customer', value: null, ignoreFieldChange: false });
                    }
                }
            }
             
        }catch(e){
            log.debug("fieldChanged_error", e);
        }
     
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
        saveRecord: saveRecord      
    }
});
  
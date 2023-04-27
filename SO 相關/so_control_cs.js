/**
 *@NModuleScope Public
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/log','N/runtime'], 
function(currentRecord, record, search, url, log, runtime) {
  
    var total=0;
    function pageInit(context) {
        // log.debug('pageInit context', context)  
        try{
          
            var rec = context.currentRecord
            var copiedfrom=rec.getValue({ fieldId: 'copiedfrom' });
            total=rec.getValue({ fieldId: 'total' });
            if(copiedfrom!=''){
                var entity=rec.getValue("entity");
                var entity_rec=record.load({
                    type: 'customer', 
                    id: entity,
                    isDynamic: false,
                });           
                var linecount = entity_rec.getLineCount({ sublistId: 'addressbook' });
                var billaddressid='',billaddresstext='',shippaddressid='',shippaddresstext='';
                for (var i = 0; i < linecount; i++) {
                    var defaultbilling= entity_rec.getSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', line: i});
                    var defaultshipping= entity_rec.getSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', line: i});
                    var billing_id=entity_rec.getSublistValue({ sublistId: 'addressbook', fieldId: 'id', line: i});
                    var addrtext=entity_rec.getSublistValue({ sublistId: 'addressbook', fieldId: 'addrtext', line: i});
                    
                    if(defaultbilling==true){
                        billaddressid=billing_id;
                        billaddresstext=addrtext;
                    }
                    if(defaultshipping==true){
                        shippaddressid=billing_id;
                        shippaddresstext=addrtext;
                    }                          
                }            
                if(billaddressid!=''){
                    rec.setValue({fieldId: 'billaddresslist',value:billaddressid,ignoreFieldChange: false});  
                } 
                if(shippaddressid!=''){
                    rec.setValue({fieldId: 'shipaddresslist',value:shippaddressid,ignoreFieldChange: false}); 
                } 
            }
           
          
             
        }catch(e){
            log.debug("pageInit_error", e);  
            log.error("pageInit_error", e);         
        
        }  
          
    }
  
    function saveRecord(context) {
        var rec = context.currentRecord  
        var new_total= rec.getValue({ fieldId: 'total' });
        //console.log('new_total: '+new_total)
        //console.log('total: '+total)
        if(new_total!==total&&total!=0){
            alert('金額已異動 請確認!');  
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
  
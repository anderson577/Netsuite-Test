/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/ui/message','N/https', 'N/runtime' ], 
function(currentRecord, record, search, url, message ,https,runtime ) {
 
      function pageInit(context) {
        var current_rec = context.currentRecord; 
        console.log('current_rec',current_rec);
        if(current_rec.id==''){
            var linecount = current_rec.getLineCount({ sublistId: 'apply'}); 
            console.log('linecount',linecount);
            for(var i=0;i<linecount;i++){
                current_rec.selectLine({sublistId: 'apply',line: i});              
                current_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply',value: false,ignoreFieldChange: true});              
                current_rec.commitLine({sublistId: 'apply'});            
            }
             
        }        
      
        
      
                 
      }
      function fieldChanged(context){
        console.log('context.fieldId', context.fieldId); 

      }
      function postSourcing(context) {

      }
      function saveRecord(context) {
      
        return true;
    }
      return {
          pageInit: pageInit, 
          fieldChanged: fieldChanged,
          postSourcing:postSourcing,
          saveRecord:saveRecord       
      }
  });
  
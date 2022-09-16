/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/ui/message','N/https', 'N/runtime' ], 
function(currentRecord, record, search, url, message ,https,runtime ) {
 
      function pageInit(context) {
     
                 
      }
      function fieldChanged(context){
      

      }
      function postSourcing(context) {
       
      }
      function saveRecord(context) {
        var current_rec = context.currentRecord;     
        var applied =current_rec.getValue('applied');
        var user_roleId=runtime.getCurrentUser().roleId;
        if(user_roleId!='customrole1003' && user_roleId!='customrole1005' && user_roleId!='administrator' && user_roleId!='customrole1018'){
          //NextLink CFO,Consultant-Full Access,Administrator,NextLink A/R Clerk   
          if(applied!=0){
            alert('財務人員才可建立有Apply的Credit Memo!');
            return false;
          }
        }    
    
        return true;
      }
      function lineInit(context) {
     
      }
      return {
          //pageInit: pageInit, 
          //fieldChanged: fieldChanged,
          //postSourcing:postSourcing,
          saveRecord:saveRecord,
          //lineInit:lineInit       
      }
  });
  
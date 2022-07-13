/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/ui/message','N/https', 'N/runtime' ], 
function(currentRecord, record, search, url, message ,https,runtime ) {
 
      function pageInit(context) {
      
         
      }

     
  
     

    function saveRecord(context){
        var rec = currentRecord.get() ;
        var entity = rec.getText('entity');
       
        if(entity.indexOf(' 國稅局-')==-1){
         
            // var myMsg = message.create({
            //     title: "提醒", 
            //     message: "請記得建立稅額", 
            //     type: message.Type.WARNING
            // });
            // myMsg.show({ duration : 3000 });
            var account = rec.getValue('account');
            var subsidiary = rec.getText('subsidiary');
            var entityid;
            if(subsidiary.indexOf('博弘雲端科技股份有限公司')!=-1){
                entityid=3019;
            }
            if(subsidiary.indexOf('宏庭科技股份有限公司')!=-1){
                entityid=3016;
            }
         
            // Ext.Msg.show({
            //     title: '提醒',width: 300,buttons: {ok:'建立稅額'}, msg:'請記得建立稅額!',icon :Ext.MessageBox.WARNING,
            //     fn: function (button){                   
            //         if(button == 'ok'){                                       
            //             window.open('/app/accounting/transactions/vendpymt.nl?entity='+entityid+'&account='+account,'_blank');
            //         }
            //     }
            // });            
            
        }
     
        return true;  
    }

      
  
      return {
          pageInit: pageInit,
          saveRecord:saveRecord
      }
  });
  
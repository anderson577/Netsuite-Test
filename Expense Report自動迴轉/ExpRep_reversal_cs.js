/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/ui/dialog' ,'N/runtime' ], 
function( currentRecord, record, search, url, dialog, runtime) {

     
      function pageInit(context) {
       
       
      }  
     
      function reversal(){
          
        var rec = currentRecord.get();
     
        var expensereport_rec = search.lookupFields({
            type: 'expensereport',
            id: rec.id,
            columns: ['entity']
        });
        //console.log('expensereport_rec',expensereport_rec);      
     
        var employee_rec = search.lookupFields({
            type: 'employee',
            id: expensereport_rec.entity[0].value,
            columns: ['department','class']
        });
        //console.log('employee_rec',employee_rec);
      
        if(employee_rec.department.length==0 || employee_rec.class.length==0){
            Ext.Msg.show(
                {
                    title: '提醒',
                    width: 350,
                    buttons: Ext.Msg.OK,
                    msg: '請為此Employee填入DEPARTMENT、CLASS!',                        
                    fn: function (button){                       
                        if(button == 'ok'){ 
                           
                        }
                    }
                }
            );
        }else{
            Ext.Msg.show(
                {
                    title: '迴轉分錄',
                    width: 350,
                    buttons: Ext.Msg.OKCANCEL,
                    msg: '確定迴轉此Expense Report?',
                        
                    fn: function (button){
                       
                        if(button == 'ok'){                       
                            load_page();
                            var vurl = url.resolveScript({
                                scriptId: 'customscript_exprep_reversal_sl',
                                deploymentId: 'customdeploy_exprep_reversal_sl',
                                returnExternalUrl: false,
                                params: { 
                                    id: rec.id ,
                                    type: rec.type,                                
                                }
                            });                                                 
                            window.open(vurl, '_self');
                        }
                    }
                }
            );
        }

      
          
         
      }
    
      function load_page(){
        var html=document.getElementsByTagName("html")[0];
        var div = document.createElement("div"); 
        div.setAttribute("style", "width:100%;height:100%;top:0;left:0;position:fixed;display:block;opacity:0.7;background-color:#fff;z-index:99;text-align:center;");       
        var img = document.createElement("img");
        img.setAttribute("style", "position:absolute;top:45%;left:43%;z-index:100;width:10%;");       
        img.setAttribute("src", "https://4631466-sb1.app.netsuite.com/core/media/media.nl?id=324&c=4631466_SB1&h=1YZ6RB0nke1tzfbd17AbU_zPK2j6OdOAXHoQVqxixNY8-Nht");  
        img.setAttribute("alt", "Loading...");          
        div.appendChild(img);                              
        html.appendChild(div);
        var bar=document.getElementById('ns_navigation');
        bar.setAttribute("style", "pointer-events: none;");       

      }
   
  
  
  
      return {
          pageInit: pageInit,
          reversal: reversal,  
      }
  });
  
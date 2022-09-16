/**
 *@NModuleScope Public
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/log','N/runtime','N/https'], 
function(currentRecord, record, search, url, log,runtime,https) {
  
    function pageInit(context) {
     
    }
  
    function close_order(){
        load_page();
        var current_rec = currentRecord.get();
        var vurl = url.resolveScript({
            scriptId: 'customscript_so_close_check_sl',
            deploymentId: 'customdeploy_so_close_check_sl',
            returnExternalUrl: false,
            params: {id: current_rec.id}
          });
  
          var domain_url = 'https://' + url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
          });
          vurl=domain_url + vurl;      
          var response = https.post({url:vurl});  
          
          var rec_status= response.body;
          
          if(rec_status=='success'){
            window.location.reload(); 
          }else{
            Ext.Msg.show({title: '出錯，請重新整理再試!',width: 250,buttons: Ext.Msg.OK, msg:rec_status});
          }        
     

    }
    function load_page(){
      var html=document.getElementsByTagName("html")[0];
      var div = document.createElement("div"); 
      div.setAttribute("style", "width:100%;height:100%;top:0;left:0;position:fixed;display:block;opacity:0.7;background-color:#fff;z-index:99;text-align:center;");       
      var img = document.createElement("img");
      img.setAttribute("style", "position:absolute;top:45%;left:43%;z-index:100;width:10%;");       
      img.setAttribute("src", "https://4631466.app.netsuite.com/core/media/media.nl?id=338&c=4631466&h=CGENO9ikZrqmPg2-0PauwtEcJhGn_R66Kc1IWbLx0QsEJHoS");  
      img.setAttribute("alt", "Loading...");          
      div.appendChild(img);                              
      html.appendChild(div);
      var bar=document.getElementById('ns_navigation');
      bar.setAttribute("style", "pointer-events: none;");       

    }
 
  
    return {
        pageInit: pageInit,
        close_order:close_order

    }
});
  
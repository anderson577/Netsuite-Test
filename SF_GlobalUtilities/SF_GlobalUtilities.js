define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https'],
   function(record, runtime, search, serverWidget, format,https) {
     
    function posttoSF(data_obj,functionname){
        var keyname='Connect SF';
        var customrecord_sf_api_keySearchObj = search.create({
            type: "customrecord_sf_api_key",
            filters:
            [
               ["name","is",keyname]
            ],
            columns:
            [
               search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
               }),
               search.createColumn({name: "custrecord_sf_account", label: "Salesforce Account"})
            ]
         });
        var rec_api_key_id ='';
        
        customrecord_sf_api_keySearchObj.run().each(function(result){
            rec_api_key_id=result.id;
            return true;
        });
        if(rec_api_key_id!=''){
        
            var rec = record.load({
                type: "customrecord_sf_api_key",
                id: rec_api_key_id,
                isDynamic: false
            })  
            var consumer_key=rec.getValue('custrecord_sf_consumer_key');
            var consumer_secret=rec.getValue('custrecord_sf_consumer_secret');
            var username=rec.getValue('custrecord_sf_username');
            var password=rec.getValue('custrecord_sf_password');
            var account=rec.getValue('custrecord_sf_account');
            var token_url ='https://'+account+'/services/oauth2/token?grant_type=password&client_id='+consumer_key+'&client_secret='+consumer_secret+'&username='+username+'&password='+password;
          //  log.debug('token_url', token_url); 
            var response = https.post({url: token_url});
            var token = JSON.parse(response.body).access_token;
          //  log.debug('token', token)
            if(token!=null&&token!=''&&token!=undefined){
                var api_url = 'https://'+account+'/services/apexrest/'+functionname;
               
                
                var header = { 
                    "Authorization": "Bearer "+token, 
                    "Content-Type": "application/json" ,
                    "Accept": "application/json",
                };
    
             
                var response = https.post({
                    url: api_url,
                    headers: header,
                    body: JSON.stringify(data_obj)
                });
                log.debug('response',response)
                log.debug('response.code',response.code)
                if(response.code=="200"){
                    var body = JSON.parse(response.body);
                  
                    return JSON.stringify({
                        status:'success',                                
                        data:body,
                        error_msg:''
                    }); 
                  
                }
                else{
                    log.debug('error_msg','error_msg:'+response.body)
                    return JSON.stringify({
                        status:'fail',                                
                        data:{},
                        error_msg:response.body
                    }); 
                  
                }        
            }else{
                return '獲取token失敗!'; 
            }
        }else{
            return '獲取rec_api_key_id失敗!';  
        }
    
    }


   return {
    posttoSF: posttoSF
    };
});



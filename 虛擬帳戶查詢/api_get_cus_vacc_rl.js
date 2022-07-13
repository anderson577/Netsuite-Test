/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
 define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log' ,'N/url','N/error'], function (record, search, task, runtime, log,url,error) {
   
  
    function doGet(context) {
        log.debug('context',context)  
        return JSON.stringify({
            status:'fail',
            data:[],
            error_msg:'Please Use POST Methods~'
        });     


    }
    function doPost(context) {       
        try {
            log.debug('request',JSON.stringify(context.request));
            log.debug('context',JSON.stringify(context));
            var s_data=JSON.parse(JSON.stringify(context));
            //log.debug('s_data',s_data);
            var entityid_l=s_data.entityid_l;
            if(entityid_l.length!=0){ 

                var filter= [],data=[],entityid_c=[];
                for(var i=0;i<entityid_l.length;i++){                   
                    if(entityid_c.indexOf(entityid_l[i])==-1){
                        if(i!=0){
                            filter.push("OR");
                        }                    
                        filter.push( ["entityid","is",entityid_l[i]]);
                        entityid_c.push(entityid_l[i]);
                        data.push({
                            entityid:entityid_l[i],
                            vacc_number:'',
                            subsidiary:''
                        });
                    }   
                                 
                }
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                    [
                        filter
                    ],
                    columns:
                    [    
                       search.createColumn({name: "entityid", label: "ID"}),                 
                       search.createColumn({name: "custentity_vacc_check_number", label: "虛擬帳戶號碼(含檢查碼)"}),
                       search.createColumn({name: "subsidiarynohierarchy", label: "Primary Subsidiary (no hierarchy)"})
                    ]
                 });
                 
                 customerSearchObj.run().each(function(result){
                    for(var j=0;j<data.length;j++){
                        if(data[j].entityid==result.getValue('entityid')){
                            data[j].vacc_number=result.getValue('custentity_vacc_check_number');
                            data[j].subsidiary=result.getText('subsidiarynohierarchy');
                            break;
                        }
                    }
                    return true;
                 });                 
               
                return {
                    status:'success',
                    data:data,
                    error_msg:''
                };    
            }else{
                return {
                    status:'fail',
                    data:[],
                    error_msg:'查詢參數錯誤'
                };  
            }
      
           

          
        } catch (err) {
            log.error({
                title: 'Post',
                details: JSON.stringify(err)
            });

            return {
                status:'fail',
                data:[],
                error_msg:JSON.stringify(err)
            };     
        }                      
      


    }
    return {     
        get: doGet,
        post:doPost
    };
});

/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
 define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log' ,'N/url','N/error'], function (record, search, task, runtime, log,url,error) {
   
  
    function doGet(context) {
        log.debug('context',context)  
        return JSON.stringify(context);     


    }
    function doPost(context) {       
        try {
            log.debug('request',JSON.stringify(context.request));
            log.debug('context',JSON.stringify(context));
            var data=JSON.parse(JSON.stringify(context));
            var cus_id=data.ns_id;
          

            if(cus_id!=null&&cus_id!=''&&cus_id!=undefined){
                var ns_type='';
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                    [
                       ["internalidnumber","equalto",cus_id]
                    ],
                    columns:
                    [
                       search.createColumn({name: "entityid", label: "ID"}),                    
                    ]
                 });
               
                 customerSearchObj.run().each(function(result){
                    ns_type=result.recordType;
                    return true;
                 });
                 log.debug('ns_type',ns_type);
                var rec = record.load({
                    type: ns_type,
                    id: cus_id,
                    isDynamic: true
                }) ;
                rec.setValue({fieldId: 'custbody_sf_id',value:data.sf_id,ignoreFieldChange: true});  
                rec.setValue({fieldId: 'custentity_sf_id',value:data.sf_id,ignoreFieldChange: true});             

                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
                log.debug('update_rec_id',rec.id)      
                return {
                    status:'success',                                
                    data:{},
                    error_msg:''
                }; 
            }else{
               
                return {
                    status:'fail',
                    data:{},
                    error_msg:'cus_id is null!'
                };     
            }

          
             
           

           
           

          
        } catch (err) {
            log.error({
                title: 'Post',
                details: JSON.stringify(err)
            });

            return {
                status:'fail',
                data:{},
                error_msg:err.message
            };     
        }                      
      


    }
  
   
    return {     
        get: doGet,
        post:doPost
    };
});

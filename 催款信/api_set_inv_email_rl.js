/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
 define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log' ,'N/url','N/error'], function (record, search, task, runtime, log,url,error) {
   
  
    function doGet(context) {
        log.debug('context',context)  
        return JSON.stringify({
            status:'fail',
            data:{},
            error_msg:'Please Use POST Methods~'
        });     


    }
    function doPost(context) {       
        try {        
            log.debug('context',JSON.stringify(context));
            var s_data=JSON.parse(JSON.stringify(context));
            //log.debug('s_data',s_data);
            var entityid=s_data.entityid;
            var email_L=s_data.email_L;
            if(entityid!=''){ 

                           
                var customrecord_invoice_delivery_groupSearchObj = search.create({
                    type: "customrecord_invoice_delivery_group",
                    filters:
                    [
                        ["custrecord_delivery_customer.entityid","is",entityid]
                    ],
                    columns:
                    [
                       search.createColumn({name: "name", label: "Name"}),
                       search.createColumn({name: "custrecord_delivery_customer", label: "Delivery Customer"}),
                       search.createColumn({name: "custrecord_customer_id", label: "Customer ID"}),
                       search.createColumn({name: "custrecord_delivery_email", label: "Delivery Email"})
                    ]
                 });
                 var searchResultCount = customrecord_invoice_delivery_groupSearchObj.runPaged().count;
                 log.debug("customrecord_invoice_delivery_groupSearchObj result count",searchResultCount);
                 var id='';
                 customrecord_invoice_delivery_groupSearchObj.run().each(function(result){
                    id=result.id;
                    return true;
                 });

                 var email_str='',email_list=[];
                 for(var i=0;i<email_L.length;i++){
                    if(email_list.indexOf(email_L[i])==-1)email_list.push(email_L[i]);                    
                 }
                 for(var i=0;i<email_list.length;i++){
                    if(i!=0)email_str+=',';
                    email_str+=email_list[i];
                 }
                 
                 var delivery_group_rec='';
                 if(id!=''){
                    delivery_group_rec = record.load({
                        type: 'customrecord_invoice_delivery_group', 
                        id: id,
                        isDynamic: false,
                    });
                    
                 }else{
                    delivery_group_rec = record.create({
                        type: 'customrecord_invoice_delivery_group',
                        isDynamic: false,                            
                    });
                 }
                 var cus_data=search_customer(entityid);
                 log.debug("cus_data",cus_data);
                 if(cus_data.cus_id==''){
                    return {
                        status:'fail',
                        data:{},
                        error_msg:'查無客戶編號'
                    };  
                 }
                 delivery_group_rec.setValue({fieldId: 'name',value:entityid});
                 delivery_group_rec.setValue({fieldId: 'custrecord_delivery_customer',value:cus_data.cus_id});
                 delivery_group_rec.setValue({fieldId: 'custrecord_delivery_email',value:email_str});
                 delivery_group_rec.setValue({fieldId: 'custrecord_customer_id',value:cus_data.cus_id});

                 var group_rec_id=delivery_group_rec.save();
                 var cus_rec = record.load({
                    type: 'customer', 
                    id: cus_data.cus_id,
                    isDynamic: false,
                 });
                 cus_rec.setValue({fieldId: 'custentity_invoice_delivery_group',value:group_rec_id});
                 cus_rec.save();
               
                return {
                    status:'success',
                    data:{cus_name:cus_data.cus_name,rec_id:group_rec_id},
                    error_msg:''
                };    
            }else{
                return {
                    status:'fail',
                    data:{},
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
                data:{},
                error_msg:JSON.stringify(err)
            };     
        }                      
      


    }
    function search_customer(entityid){
        var cus_id='',cus_name='';
        var customerSearchObj = search.create({
            type: "customer",
            filters:
            [
                ["entityid","is",entityid]
            ],
            columns:
            [   
             "altname" 
            ]
         });
         customerSearchObj.run().each(function(result){
            cus_id=result.id;
            cus_name=result.getValue('altname');
            return true;
         });

         return {
            cus_id:cus_id,
            cus_name:cus_name
         };
    }

    return {     
        get: doGet,
        post:doPost
    };
});

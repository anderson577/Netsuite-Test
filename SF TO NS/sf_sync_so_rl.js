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
            var so_id=data.so_id;
          

            if(so_id!=null&&so_id!=''&&so_id!=undefined){
                var rec = record.load({
                    type: 'salesorder',
                    id: so_id,
                    isDynamic: true
                }) ;
                create_update(rec,data);

                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }); 
                log.debug('update_rec_id',rec.id)      
                return {
                    status:'success',                                
                    data:{
                        internalid:rec.id,
                        tranid:rec.getValue('tranid'),
                        status:rec.getValue('status'),
                    },
                    error_msg:''
                }; 
            }else{
               
                var rec = record.transform({fromType:'customer', fromId:data.cus_id, toType:'salesorder', isDynamic:true});
                create_update(rec,data);

                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });  
                log.debug('create_rec_id',rec.id) 
                var rec = record.load({
                    type: 'salesorder',
                    id: rec.id,
                    isDynamic: true
                }) ;      
                return {
                    status:'success',                                
                    data:{
                        internalid:rec.id,
                        tranid:rec.getValue('tranid'),
                        status:rec.getValue('status'),
                    },
                    error_msg:''
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
    function create_update(rec,data){
        var sf_id=data.sf_id;
        var cus_id=data.cus_id;
        var trandate=data.trandate;
        var department=data.department;
        var classname=data.classname;
        var currency_t=data.currency_t;
        var itemlist=data.itemlist;      

        rec.setValue({fieldId: 'custbody_sf_id',value:sf_id,ignoreFieldChange: true});
        rec.setValue({fieldId: 'entity',value: cus_id,ignoreFieldChange: true});
        rec.setValue({fieldId: 'trandate',value:new Date(trandate),ignoreFieldChange: true});
        rec.setText({fieldId: 'department',text: department,ignoreFieldChange: true});
        rec.setText({fieldId: 'class',text: classname,ignoreFieldChange: true});
        rec.setText({fieldId: 'currency',text: currency_t});
      

        var ItemCount = rec.getLineCount('item');

        for(var i = 0; i < ItemCount; i++) {                      
            rec.removeLine({sublistId: 'item',line: 0});
        }
        for(var i = 0; i < itemlist.length; i++) {
            var data=itemlist[i];
            rec.insertLine({sublistId: 'item',line: i,});
            rec.setCurrentSublistValue({sublistId: 'item',fieldId: 'item',value: data.itemid});
            rec.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity',value: data.quantity});
            rec.setCurrentSublistValue({sublistId: 'item',fieldId: 'rate',value: data.rate});
            rec.setCurrentSublistValue({sublistId: 'item',fieldId: 'amount',value: data.amount});
            rec.setCurrentSublistText({sublistId: 'item',fieldId: 'department',text: data.department,ignoreFieldChange: true});
            rec.setCurrentSublistText({sublistId: 'item',fieldId: 'class',text: data.classname,ignoreFieldChange: true});
            rec.setCurrentSublistText({sublistId: 'item',fieldId: 'taxcode',text: data.taxcode,ignoreFieldChange: true});
            rec.commitLine({sublistId: 'item'});
        }

    }

   
    return {     
        get: doGet,
        post:doPost
    };
});

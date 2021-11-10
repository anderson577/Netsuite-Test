/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
 define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/log' ,'N/url','N/error','./SF_GlobalUtilities.js'], 
    function (record, search, task, runtime, log,url,error,SF) {
   
  
    function doGet(context) {
        log.debug('context',context)  
        return JSON.stringify(context);     


    }
    function doPost(context) {       
        try {
            log.debug('request',JSON.stringify(context.request));
            log.debug('context',JSON.stringify(context));
            var data=JSON.parse(JSON.stringify(context));
            var customrecord_sf_accountSearchObj = search.create({
                type: "customrecord_sf_account",
                filters:
                [
                   ["custrecord_sf_acc_id","is",data.acc_id]
                ],
                columns:
                [
                   search.createColumn({name: "name", label: "Name"}),
                   search.createColumn({
                    name: "custentity_sf_id",
                    join: "CUSTRECORD_SF_ACC_CUSTOMER",
                    label: "Salesforce ID"
                 })                
                ]
             });
             var relation_id=''; 
             customrecord_sf_accountSearchObj.run().each(function(result){
                relation_id=result.getValue({
                    name: "custentity_sf_id",
                    join: "CUSTRECORD_SF_ACC_CUSTOMER",
                    label: "Salesforce ID"
                 });
                return true;
             });

             if(relation_id==''){
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                    [
                       ["companyname","is",data.name], 
                       "AND", 
                       ["vatregnumber","is",data.vat_reg], 
                       "AND", 
                       ["msesubsidiary.name","is",data.subsidary]
                    ],
                    columns:
                    [
                        search.createColumn({name: "entityid", label: "ID"}),
                        search.createColumn({
                            name: "altname",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "name",
                            join: "mseSubsidiary",
                            label: "Name"
                        }),
                        search.createColumn({name: "stage", label: "Stage"}),
                        search.createColumn({name: "vatregnumber", label: "Tax Number"})                
                    ]
                 });
                 var cus_id='',cus_name,cus_subsidiary,cus_stage,cus_vatregnumber;
                 customerSearchObj.run().each(function(result){
                    cus_id=result.id;
                    cus_name=result.getValue('altname');
                    cus_subsidiary=result.getValue({
                        name: "name",
                        join: "mseSubsidiary",
                        label: "Name"
                    });
                    cus_stage=result.getValue('stage');
                    cus_vatregnumber=result.getValue('vatregnumber');
                    return true;
                 });
                 if(cus_id!=''){
                    var relat_data={
                        cus_status:'old', 
                        id:cus_id,
                        name:cus_name,
                        subsidiary:cus_subsidiary,
                        stage:cus_stage,
                        vatregnumber:cus_vatregnumber
                    }; 
                    
                    var relation_rec=record.create({
                        type: 'customrecord_sf_account',
                        isDynamic: true,                       
                    });
                    relation_rec.setValue({fieldId: 'custrecord_sf_acc_customer',value:cus_id,ignoreFieldChange: true});
                    relation_rec.setValue({fieldId: 'custrecord_sf_acc_name',value:data.name,ignoreFieldChange: true});
                    relation_rec.setValue({fieldId: 'custrecord_sf_acc_id',value:data.acc_id,ignoreFieldChange: true});
                    relation_rec.setText({fieldId: 'custrecord_sf_acc_bu',value:data.BU,ignoreFieldChange: true});
                    relation_rec.setValue({fieldId: 'name',value:data.name+'('+data.BU+')',ignoreFieldChange: true});
                    relation_rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });  
                    log.debug('relation_rec',relation_rec);
                    return {
                        status:'success',                                
                        cusdata:{
                            relat_data:relat_data,
                            account_data:{}
                        },
                        error_msg:''
                    };  
                   
                 }else{

                 }
             }
          

           

          
        } catch (err) {
            log.error({
                title: 'Post',
                details: JSON.stringify(err)
            });

            return {
                status:'fail',
                data:{},
                error_msg:err
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

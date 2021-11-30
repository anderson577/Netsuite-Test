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
          
            log.debug('context',JSON.stringify(context));
            var data=JSON.parse(JSON.stringify(context));

            var ns_id=data.ns_id;
            if(ns_id=='' || ns_id==null || ns_id==undefined){
                var contact_rec=record.create({
                    type: 'contact',
                    isDynamic: false,                       
                });
            }else{
                var contact_rec=record.load({
                    type: 'contact',
                    id:ns_id,
                    isDynamic: false,                       
                });
            }          
            


            contact_rec.setValue({fieldId: 'company',value:data.company_id,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'entityid',value:data.name,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'email',value:data.email,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'phone',value:data.phone,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'mobilephone',value:data.mobilePhone,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'fax',value:data.fax,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'custentity_sf_id',value:data.id,ignoreFieldChange: true});
            contact_rec.setText({fieldId: 'custentity_sf_bu',text:data.BU,ignoreFieldChange: true});
            contact_rec.setValue({fieldId: 'title',value:data.job_title,ignoreFieldChange: true});

            var addressbookCount = contact_rec.getLineCount('addressbook');
            for(var i = 0; i < addressbookCount; i++) {                    
                contact_rec.removeLine({sublistId: 'addressbook',line: i,ignoreRecalc: true});
            }

            if(data.mailingAddress!=null)
                add_addressbook(contact_rec,data.mailingAddress,0,true,true);
            
            
            var contact_rec_id=contact_rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug('contact_rec_id',contact_rec_id);
           

            var response_data={
                status:'success',                                
                data:{
                    internalid:contact_rec_id,                  
                },
                error_msg:''
            }; 
            log.debug('response_data',response_data);

            return  response_data;
          
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
    
    function add_addressbook(opp_rec,Address,index,defaultshipping,defaultbilling){

        opp_rec.insertLine({sublistId: 'addressbook',line: index,});
        opp_rec.setSublistValue({sublistId: 'addressbook',fieldId: 'defaultshipping',line: index,value: defaultshipping}); 
        opp_rec.setSublistValue({sublistId: 'addressbook',fieldId: 'defaultbilling',line: index,value: defaultbilling}); 
        var subrec2 = opp_rec.getSublistSubrecord({sublistId: 'addressbook',fieldId: 'addressbookaddress',line: index});
        subrec2.setText({fieldId: 'country',text: Address.country});
        subrec2.setValue({fieldId: 'addr1',value: Address.address});
        subrec2.setValue({fieldId: 'city',value: Address.city});
        subrec2.setValue({fieldId: 'zip',value: Address.zip});


    }
 
    return {     
        get: doGet,
        post:doPost
    };
});

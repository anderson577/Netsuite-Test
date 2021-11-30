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
                 }),
                    'custrecord_sf_acc_customer'                
                ]
             });
             var relation_id='',cus_id='',sf_account_id=''; 
             customrecord_sf_accountSearchObj.run().each(function(result){
                relation_id=result.getValue({
                    name: "custentity_sf_id",
                    join: "CUSTRECORD_SF_ACC_CUSTOMER",
                    label: "Salesforce ID"
                 });
                cus_id=result.getValue('custrecord_sf_acc_customer');
                sf_account_id=result.id;
                return true;
             });

             var relat_data={},account_data={contacts:[]};
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
                 var cus_id='',cus_name,cus_entityid,cus_subsidiary,cus_stage,cus_vatregnumber;
                 customerSearchObj.run().each(function(result){
                    log.debug('result',result);
                    cus_id=result.id;           
                    cus_entityid=result.getValue('entityid');
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
               
                    relat_data={
                        cus_status:'old',                   
                        id:cus_id,
                        entityid:cus_entityid,
                        name:cus_name,
                        subsidiary:cus_subsidiary,
                        stage:cus_stage,
                        vatregnumber:cus_vatregnumber
                    }; 
                    add_contact(cus_id,data,account_data)                 
                                 
                 }else{
                    var opp_rec=record.create({
                        type: 'prospect',
                        isDynamic: false,                       
                    });
                    opp_rec.setValue({fieldId: 'isperson',value:'F',ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'probability',value:data.opp.probability,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'companyname',value:data.name,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'subsidiary',value:search_Subsidiary(data.subsidary),ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'phone',value:data.phone,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'leadsource',value:search_campaign(data.opp.leadSource),ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'vatregnumber',value:data.vat_reg,ignoreFieldChange: true});
                    opp_rec.setText({fieldId: 'currency',text:data.currency_t,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'comments',value:data.description,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity1',value:data.bankname,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'accountnumber',value:data.bankaccount,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity2',value:data.bankcode,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity13',value:data.abbreviation,ignoreFieldChange: true});
                    addresss(opp_rec,data);
                    add_SalesRep(opp_rec,data);

                    var opp_rec_id=opp_rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
             
                    cus_id=opp_rec_id;

                    add_contact(opp_rec_id,data,account_data);
                   

                    var opp_new_rec=record.load({
                        type: 'prospect',
                        id: opp_rec_id,
                        isDynamic: false
                    }) ;

                    relat_data={
                        cus_status:'new',                    
                        id:opp_new_rec.id,
                        entityid:opp_new_rec.getValue('entityid'),
                        name:opp_new_rec.getValue('companyname'),
                        subsidiary:opp_new_rec.getText('subsidiary'),
                        stage:'Opportunitites',
                        vatregnumber:opp_new_rec.getValue('vatregnumber')
                    };    

                 }

                var relation_rec=record.create({
                    type: 'customrecord_sf_account',
                    isDynamic: true,                       
                });
                relation_rec.setValue({fieldId: 'custrecord_sf_acc_customer',value:cus_id,ignoreFieldChange: true});
                relation_rec.setValue({fieldId: 'custrecord_sf_acc_name',value:data.name,ignoreFieldChange: true});
                relation_rec.setValue({fieldId: 'custrecord_sf_acc_id',value:data.acc_id,ignoreFieldChange: true});
                relation_rec.setText({fieldId: 'custrecord_sf_acc_bu',text:data.BU,ignoreFieldChange: true});
                relation_rec.setValue({fieldId: 'name',value:data.name+'('+data.BU+')',ignoreFieldChange: true});
                relation_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });  
                log.debug('relation_rec_id',relation_rec.id);

                var opportunity_rec=record.create({
                    type: 'customrecord_sf_opportunity',
                    isDynamic: true,                       
                });
                opportunity_rec.setValue({fieldId: 'name',value:data.opp.name,ignoreFieldChange: true});
                opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_id',value:data.opp.id,ignoreFieldChange: true});
                opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_acc',value:relation_rec.id,ignoreFieldChange: true});
             
                opportunity_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });  

                log.debug('opportunity_rec_id',opportunity_rec.id);


                var response_data={
                    status:'success',                                
                    cusdata:{
                        relat_data:relat_data,
                        account_data:account_data
                    },
                    error_msg:''
                }; 
                log.debug('response_data',response_data);

                return  response_data;




             }else{
                relat_data={
                    cus_status:'old',                   
                    id:cus_id                  
                }; 

                var opportunity_id='';
                var customrecord_sf_opportunitySearchObj = search.create({
                    type: "customrecord_sf_opportunity",
                    filters:
                    [
                       ["custrecord_sf_opp_id","is",data.opp.id]
                    ],
                    columns:
                    [
                       search.createColumn({
                          name: "name",
                          sort: search.Sort.ASC,
                          label: "Name"
                       }),
                       search.createColumn({name: "custrecord_sf_opp_id", label: "SALESFORCE OPPORTUNITY ID"})
                    ]
                 });
                 customrecord_sf_opportunitySearchObj.run().each(function(result){
                    opportunity_id=result.id;
                    return true;
                 });
                var opportunity_rec;
                if(opportunity_id==''){
                    opportunity_rec=record.create({
                        type: 'customrecord_sf_opportunity',
                        isDynamic: true,                       
                    }); 
                }else{
                    opportunity_rec=record.load({
                        type: 'customrecord_sf_opportunity',
                        id:opportunity_id,
                        isDynamic: true,                       
                    }); 
                }
            
                opportunity_rec.setValue({fieldId: 'name',value:data.opp.name,ignoreFieldChange: true});
                opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_id',value:data.opp.id,ignoreFieldChange: true});
                opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_acc',value:sf_account_id,ignoreFieldChange: true});
             
                opportunity_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });  
              

                log.debug('opportunity_rec',opportunity_rec.id);


                var response_data={
                    status:'success',                                
                    cusdata:{
                        relat_data:relat_data,
                        account_data:account_data
                    },
                    error_msg:''
                }; 
                log.debug('response_data',response_data);

                return  response_data;

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
    function search_Subsidiary(name){
        var subsidiary_id='';
        var subsidiarySearchObj = search.create({
            type: "subsidiary",
            filters:
            [
               ["formulatext: {namenohierarchy}","is",name]
            ],
            columns:
            [
               search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                  label: "Name"
               })           
            ]
         });
      
         subsidiarySearchObj.run().each(function(result){
            subsidiary_id=result.id;
            return true;
         });

         return subsidiary_id;

    }

    function search_campaign(name){
        var campaignSearchObj = search.create({
            type: "campaign",
            filters:
            [
               ["title","is",name]
            ],
            columns:
            [             
               search.createColumn({name: "title", label: "Title"}),             
            ]
         });
         var campaign_id='';
         campaignSearchObj.run().each(function(result){
            campaign_id=result.id;
            return true;
         });

         return campaign_id;
    }
    function addresss(opp_rec,data){
        var billingAddress=data.billingAddress;
        var shippingAddress=data.shippingAddress;
        if(billingAddress!=null&&shippingAddress!=null){

            if(billingAddress.country==shippingAddress.country&&
                billingAddress.address==shippingAddress.address&&
                billingAddress.city==shippingAddress.city&&
                billingAddress.zip==shippingAddress.zip){
                    add_addressbook(opp_rec,billingAddress,0,true,true);
            }else{
                add_addressbook(opp_rec,billingAddress,0,false,true);
                add_addressbook(opp_rec,shippingAddress,1,true,false);
            }
        }else if(billingAddress!=null){
            add_addressbook(opp_rec,billingAddress,0,false,true);
        }else if(shippingAddress!=null){
            add_addressbook(opp_rec,shippingAddress,0,true,false);
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
    function add_contact(company_id,data,account_data){
        for(var i=0;i<data.contacts.length;i++){
            var con_data=data.contacts[i];
            try {               

                var contact_rec=record.create({
                    type: 'contact',
                    isDynamic: false,                       
                });
                
                contact_rec.setValue({fieldId: 'company',value:company_id,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'entityid',value:con_data.name,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'email',value:con_data.email,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'phone',value:con_data.phone,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'mobilephone',value:con_data.mobilePhone,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'fax',value:con_data.fax,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'custentity_sf_id',value:con_data.id,ignoreFieldChange: true});
                contact_rec.setText({fieldId: 'custentity_sf_bu',text:con_data.BU,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'title',value:con_data.job_title,ignoreFieldChange: true});
                if(con_data.mailingAddress!=null)
                    add_addressbook(contact_rec,con_data.mailingAddress,0,true,true);
                
                
                var contact_rec_id=contact_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
           
                account_data.contacts.push({
                    id:contact_rec_id,
                    sf_id:con_data.id,
                    name:con_data.name,
                    status:'success',
                    error_msg:''
                });
            } catch (err) {
                account_data.contacts.push({
                    id:'',
                    sf_id:con_data.id,
                    name:con_data.name,
                    status:'fail',
                    error_msg:err.message
                });
                
            }
          
        }
    }
    function add_SalesRep(opp_rec,data){
        var em_id=search_sf_employee(data.opp.ownerId);
        if(em_id!=''){
            opp_rec.insertLine({sublistId: 'salesteam',line: 0});
            opp_rec.setSublistValue({sublistId: 'salesteam',fieldId: 'contribution',line: 0,value: 100}); 
            opp_rec.setSublistValue({sublistId: 'salesteam',fieldId: 'salesrole',line: 0,value: -2}); //Sales Rep
            opp_rec.setSublistValue({sublistId: 'salesteam',fieldId: 'isprimary',line: 0,value: true}); 
            opp_rec.setSublistValue({sublistId: 'salesteam',fieldId: 'employee',line: 0,value: em_id}); 
        }       

    }
    function search_sf_employee(id){
        var employee_id='';
        if(id==''|| id==null|| id==undefined){
            return employee_id;
        }

        var employeeSearchObj = search.create({
            type: "employee",
            filters:
            [
               ["custentity_sf_id","startswith",id]
            ],
            columns:
            [             
               search.createColumn({
                  name: "entityid",
                  sort: search.Sort.ASC,
                  label: "Name"
               }),            
            ]
         });
       
         employeeSearchObj.run().each(function(result){
            employee_id=result.id;
            return true;
         });

         return employee_id;
    }
    return {     
        get: doGet,
        post:doPost
    };
});

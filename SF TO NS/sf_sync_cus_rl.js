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
            if(data.BU=='ISV'){
                data.BU='Products';
            }
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
             var subsidary=search_Subsidiary(data.subsidary);
             var response_data=[];
             var create_cus=function(){
                var filters=[
                    ["altname","is",data.select_name],                  
                    "AND", 
                    ["msesubsidiary.namesel","anyof",subsidary],
                    "AND", 
                    ["isinactive","is","F"]
                ];
                if(data.vat_reg=='N/A'||data.vat_reg==''){
                    filters.push("AND");
                    filters.push([["vatregnumber","is","N/A"],"OR",["vatregnumber","isempty",""]]);                    
                }else{
                    filters.push("AND");
                    filters.push(["vatregnumber","is",data.vat_reg]);   
                }
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:filters,
                    columns:
                    [
                        search.createColumn({name: "entityid", label: "ID"}),
                        search.createColumn({
                            name: "altname",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "namenohierarchy",
                            join: "mseSubsidiary",
                            label: "Name (no hierarchy)"
                        }),
                        search.createColumn({name: "stage", label: "Stage"}),
                        search.createColumn({name: "vatregnumber", label: "Tax Number"})                
                    ]
                 });
                 var cus_id='',cus_name,cus_entityid,cus_subsidiary,cus_stage,cus_vatregnumber,cus_recordType='';
                 customerSearchObj.run().each(function(result){
                    log.debug('result',result);
                    cus_id=result.id;
                    cus_recordType=result.recordType;        
                    cus_entityid=result.getValue('entityid');
                    cus_name=result.getValue('altname');
                    cus_subsidiary=result.getValue({
                        name: "namenohierarchy",
                        join: "mseSubsidiary",
                        label: "Name (no hierarchy)"
                    });
                    cus_stage=result.getValue('stage');
                    cus_vatregnumber=result.getValue('vatregnumber');
                    return true;
                 });
               
                 
                 if(cus_stage=='PROSPECT')cus_stage='Opportunitites';
                 if(cus_stage=='LEAD')cus_stage='Prospect';
                 if(cus_id!=''){
                    var old_cus_rec = record.load({
                        type: 'customer',
                        id: cus_id,
                        isDynamic: false
                    });
               
                    relat_data={
                        cus_status:'old',                   
                        id:cus_id,
                        entityid:old_cus_rec.getValue('entityid'),
                        name:cus_name,
                        subsidiary:cus_subsidiary,
                        stage:cus_stage,
                        vatregnumber:cus_vatregnumber,
                        terms:old_cus_rec.getText('terms'),
                        is_parent_company:old_cus_rec.getValue('custentity_is_parent_company'),     
                    }; 
                    add_contact(cus_id,cus_recordType,data,account_data)                 
                                 
                 }else{
                    var opp_rec=record.create({
                        type: 'prospect',
                        isDynamic: false,                       
                    });
                    opp_rec.setValue({fieldId: 'isperson',value:'F',ignoreFieldChange: true});
                    if(data.opp!=null&&data.opp!=undefined&&data.opp!='')
                        opp_rec.setValue({fieldId: 'probability',value:data.opp.probability,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'companyname',value:data.name,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'subsidiary',value:subsidary,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'phone',value:data.phone,ignoreFieldChange: true});
                    if(data.opp!=null&&data.opp!=undefined&&data.opp!='')
                        opp_rec.setValue({fieldId: 'leadsource',value:search_campaign(data.opp.leadSource),ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'vatregnumber',value:data.vat_reg,ignoreFieldChange: true});
                    opp_rec.setText({fieldId: 'currency',text:data.currency_t,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'comments',value:data.description,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity1',value:data.bankname,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'accountnumber',value:data.bankaccount,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity2',value:data.bankcode,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity3',value:data.bankname2,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity5',value:data.bankaccount2,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity4',value:data.bankcode2,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'custentity13',value:data.abbreviation,ignoreFieldChange: true});
                    opp_rec.setValue({fieldId: 'parent',value:data.parent_ns_id,ignoreFieldChange: true});
                    addresss(opp_rec,data);
                    if(data.opp!=null&&data.opp!=undefined&&data.opp!='')
                        add_SalesRep(opp_rec,data);

                    var opp_rec_id=opp_rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
             
                    cus_id=opp_rec_id;

                    add_contact(opp_rec_id,'prospect',data,account_data);
                   

                    var opp_new_rec=record.load({
                        type: 'prospect',
                        id: opp_rec_id,
                        isDynamic: false
                    }) ;
                    var opp_altname = search.lookupFields({
                        type: 'customer',
                        id: opp_rec_id,
                        columns: ['altname']
                    });
                    relat_data={
                        cus_status:'new',                    
                        id:opp_new_rec.id,
                        entityid:opp_new_rec.getValue('entityid'),
                        name:opp_altname.altname,
                        subsidiary:opp_new_rec.getText('subsidiary'),
                        stage:'Opportunitites',
                        vatregnumber:opp_new_rec.getValue('vatregnumber'),
                        terms:opp_new_rec.getText('terms'),
                        is_parent_company:opp_new_rec.getValue('custentity_is_parent_company'),   
                    };    

                 }

                log.debug('sf_account_id',sf_account_id);
                if(sf_account_id==''){
                    var relation_rec=record.create({
                        type: 'customrecord_sf_account',
                        isDynamic: true,                       
                    });
                }else{
                    var relation_rec=record.load({
                        type: 'customrecord_sf_account',
                        id: sf_account_id,
                        isDynamic: true,                       
                    });
                }
              
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

                var opportunity_id='';
                if(data.opp!=null&&data.opp!=''&&data.opp!=undefined){
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
                    opportunity_rec.setValue({fieldId: 'name',value:data.opp.name+'('+data.opp.closeDate+')',ignoreFieldChange: true});
                    opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_id',value:data.opp.id,ignoreFieldChange: true});
                    opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_acc',value:relation_rec.id,ignoreFieldChange: true});
                 
                    opportunity_rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });  
    
                    log.debug('opportunity_rec_id',opportunity_rec.id);
                }              
              


                var response_data={
                    status:'success',                                
                    cusdata:{
                        relat_data:relat_data,
                        account_data:account_data
                    },
                    error_msg:''
                }; 
               
                return response_data;
             }
             if(relation_id==''){
                response_data=create_cus();
                log.debug('response_data',response_data);
                return response_data;
             }else{
                var filters=[
                    ["altname","is",data.select_name],                  
                    "AND", 
                    ["msesubsidiary.namesel","anyof",subsidary],
                    "AND", 
                    ["isinactive","is","F"]
                ];
                if(data.vat_reg=='N/A'||data.vat_reg==''){
                    filters.push("AND");
                    filters.push([["vatregnumber","is","N/A"],"OR",["vatregnumber","isempty",""]]);                    
                }else{
                    filters.push("AND");
                    filters.push(["vatregnumber","is",data.vat_reg]);   
                }
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:filters,
                    columns:
                    [                                 
                    ]
                 });
                 var cus_id='';
                 customerSearchObj.run().each(function(result){
                    log.debug('search_cus_id_result',result);
                    cus_id=result.id;                  
                    return true;
                 });  
               if(cus_id!==''){
                    var relation_rec=record.load({
                        type: 'customrecord_sf_account',
                        id: sf_account_id,
                        isDynamic: false,                       
                    });
                    relation_rec.setValue({fieldId: 'custrecord_sf_acc_customer',value:cus_id,ignoreFieldChange: true});                  
                    relation_rec.setValue({fieldId: 'custrecord_sf_acc_name',value:data.name,ignoreFieldChange: true});                  
                    relation_rec.setText({fieldId: 'custrecord_sf_acc_bu',text:data.BU,ignoreFieldChange: true});
                    relation_rec.setValue({fieldId: 'name',value:data.name+'('+data.BU+')',ignoreFieldChange: true});
                    relation_rec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });  
                    log.debug('relation_rec_id',relation_rec.id);               

                    var cus_rec=record.load({
                        type: 'customer',
                        id: cus_id,
                        isDynamic: false
                    }) ;
                    var stage=cus_rec.getValue('stage');
                    if(stage=='PROSPECT')stage='Opportunitites';
                    if(stage=='LEAD')stage='Prospect';
                    var cus_altname = search.lookupFields({
                        type: 'customer',
                        id: cus_id,
                        columns: ['altname']
                    });
                    relat_data={
                        cus_status:'old',                   
                        id:cus_id ,
                        entityid:cus_rec.getValue('entityid'),
                        name:cus_altname.altname,
                        subsidiary:cus_rec.getText('subsidiary'), 
                        stage:stage,
                        vatregnumber:cus_rec.getValue('vatregnumber')==''?'N/A':cus_rec.getValue('vatregnumber'),
                        terms:cus_rec.getText('terms'),
                        is_parent_company:cus_rec.getValue('custentity_is_parent_company'),                 
                    }; 
                    add_contact(cus_rec.id,cus_rec.type,data,account_data);
                    if(data.opp!=null&&data.opp!=''&&data.opp!=undefined){
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
                    
                        opportunity_rec.setValue({fieldId: 'name',value:data.opp.name+'('+data.opp.closeDate+')',ignoreFieldChange: true});
                        opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_id',value:data.opp.id,ignoreFieldChange: true});
                        opportunity_rec.setValue({fieldId: 'custrecord_sf_opp_acc',value:sf_account_id,ignoreFieldChange: true});
                    
                        opportunity_rec.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });  
                    
    
                        log.debug('opportunity_rec',opportunity_rec.id);
                    }                 


                    response_data={
                        status:'success',                                
                        cusdata:{
                            relat_data:relat_data,
                            account_data:account_data
                        },
                        error_msg:''
                    }; 
               }else{
                response_data=create_cus();

                // var response_data={
                //     status:'fail',                                
                //     cusdata:{
                //         relat_data:[],
                //         account_data:[]
                //     },
                //     error_msg:'該顧客可能已刪除!'
                // }; 
               }
              
                log.debug('response_data',response_data);

                return  JSON.stringify(response_data);;

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
                billingAddress.zip==shippingAddress.zip&&
                billingAddress.state==shippingAddress.state){
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
        if(Address.country==''||Address.country==null||Address.country==undefined)
            return;
        opp_rec.insertLine({sublistId: 'addressbook',line: index,});
        opp_rec.setSublistValue({sublistId: 'addressbook',fieldId: 'defaultshipping',line: index,value: defaultshipping}); 
        opp_rec.setSublistValue({sublistId: 'addressbook',fieldId: 'defaultbilling',line: index,value: defaultbilling}); 
        var subrec2 = opp_rec.getSublistSubrecord({sublistId: 'addressbook',fieldId: 'addressbookaddress',line: index});
        subrec2.setText({fieldId: 'country',text: Address.country});
        subrec2.setValue({fieldId: 'addr1',value: Address.address});
        subrec2.setValue({fieldId: 'city',value: Address.city});
        subrec2.setValue({fieldId: 'zip',value: Address.zip});
        subrec2.setValue({fieldId: 'custrecord_stateprovince',value: Address.state});

    }
    function add_contact(company_id,recordType,data,account_data){
        for(var i=0;i<data.contacts.length;i++){
            var con_data=data.contacts[i];
            if(con_data.BU=='ISV'){
                con_data.BU='Products';
            }
            try {               
                var direct=con_data.direct;
                var direct_recordType=con_data.direct_company_type;
                if(direct_recordType=='Prospect')direct_recordType='lead';
                if(direct_recordType=='Opportunitites')direct_recordType='prospect';
                if(direct_recordType=='Customer')direct_recordType='customer';

                var companyID=direct==true?company_id:con_data.direct_company_id;
                if(companyID==''||companyID==null||companyID==undefined){
                    companyID=company_id;
                }

                var cus_rec=record.load({
                    type: companyID==company_id?recordType:direct_recordType,
                    id: companyID,
                    isDynamic: false
                });
                var linecount = cus_rec.getLineCount({ sublistId:'contactroles'});
                var contact_id='',entityid=con_data.name+' ('+con_data.BU+')'; 
                for (var j = 0; j < linecount; j++){              
                    var contactname=  cus_rec.getSublistValue({sublistId: 'contactroles', fieldId: 'contactname', line: j});
                    if(contactname==entityid){                      
                        contact_id=cus_rec.getSublistValue({sublistId: 'contactroles', fieldId: 'contact', line: j});
                    }
                 }
                if(contact_id==''){
                    var contact_rec=record.create({
                        type: 'contact',
                        isDynamic: false,                       
                    });
                }else{
                    var contact_rec=record.load({
                        type: 'contact',
                        id: contact_id,
                        isDynamic: false,                       
                    });
                } 
               
                
                contact_rec.setValue({fieldId: 'company',value:companyID,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'entityid',value:entityid,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'email',value:con_data.email,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'phone',value:con_data.phone,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'mobilephone',value:con_data.mobilePhone,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'fax',value:con_data.fax,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'custentity_sf_id',value:con_data.id,ignoreFieldChange: true});
                contact_rec.setText({fieldId: 'custentity_sf_bu',text:con_data.BU,ignoreFieldChange: true});
                contact_rec.setValue({fieldId: 'title',value:con_data.job_title,ignoreFieldChange: true});
             
                var dress_linecount = contact_rec.getLineCount({ sublistId:'addressbook'});
                for (var k = 0; k < dress_linecount; k++){  
                    contact_rec.removeLine({
                        sublistId: 'addressbook',
                        line: k,
                        ignoreRecalc: true
                    });
                }           
                if(con_data.mailingAddress!=null)
                    add_addressbook(contact_rec,con_data.mailingAddress,0,true,true);
                
                
                var contact_rec_id=contact_rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
           
                var mas_cus_rec=record.load({
                    type: recordType,
                    id: company_id,
                    isDynamic: false
                });
                var linecount = mas_cus_rec.getLineCount({ sublistId:'contactroles'});
                var mas_contact_id='';
                for (var j = 0; j < linecount; j++){              
                    var mas_contactname=  mas_cus_rec.getSublistValue({sublistId: 'contactroles', fieldId: 'contactname', line: j});
                    if(mas_contactname==entityid){                      
                        mas_contact_id=mas_cus_rec.getSublistValue({sublistId: 'contactroles', fieldId: 'contact', line: j});
                    }
                }
                if(mas_contact_id==''){
                    record.attach({
                        record: {
                             type: 'contact',
                             id: contact_rec_id},
                        to: {
                             type: recordType,
                             id:company_id}
                    });                
                }


                account_data.contacts.push({
                    id:contact_rec_id,
                    sf_id:con_data.id,
                    name:con_data.name,
                    status:'success',
                    error_msg:''
                });
            } catch (err) {
                log.error({
                    title: 'Post',
                    details: JSON.stringify({
                        id:'',
                        sf_id:con_data.id,
                        name:con_data.name,
                        status:'fail',
                        error_msg:err.message
                    })
                });
                // account_data.contacts.push({
                //     id:'',
                //     sf_id:con_data.id,
                //     name:con_data.name,
                //     status:'fail',
                //     error_msg:err.message
                // });
                
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

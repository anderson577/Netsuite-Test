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
            var companyname=data.companyname;
            var subsidiary=search_Subsidiary(data.subsidiary);
            log.debug('subsidiary',subsidiary);
            var vatregnumber=data.vatregnumber;
            var hasparent=data.hasparent;

            if(vatregnumber==''||vatregnumber==undefined||vatregnumber==null){
                vatregnumber='N/A';
            }
          
            var filters=[
                ["altname","is",companyname],
                "AND", 
                ["msesubsidiary.namesel","anyof",subsidiary], 
            ]

            var customerSearchObj = search.create({
                type: "customer",
                filters:filters,
                columns:
                [
                    search.createColumn({name: "entityid", label: "ID"}),
                    search.createColumn({name: "altname",label: "Name"}),
                    search.createColumn({name: "vatregnumber", label: "Tax Number"})                  
                ]
             });
             var cus_filter1_id='',cus_filter1_vat='',cus_filter1_entityid='';
             customerSearchObj.run().each(function(result){
                cus_filter1_id=result.id;
                cus_filter1_vat=result.getValue('vatregnumber');
                cus_filter1_vat=cus_filter1_vat==''?'N/A':cus_filter1_vat;
                cus_filter1_entityid=result.getValue('entityid')+' '+result.getValue('altname');
                return true;
             });
          
            var message=function(d_entityid,d_vatregnumber){
                return '找到既有客戶:'+d_entityid+'\nSubsidiary:'+data.subsidiary+'\nvatregnumber:'+d_vatregnumber;
            } 

             if(cus_filter1_id!=''){
                if(vatregnumber!='N/A'){
                    if(vatregnumber!=cus_filter1_vat){
                        return {
                            status:'fail',
                            cus_data:message(cus_filter1_entityid,cus_filter1_vat),              
                            error_msg:''
                        };   
                    }
                }else{
                    if(cus_filter1_vat!='N/A'){
                        return {
                            status:'fail',
                            cus_data:message(cus_filter1_entityid,cus_filter1_vat),              
                            error_msg:''
                        };   
                    } 
                }
             }
             

             if(cus_filter1_id==''&&vatregnumber!='N/A' && hasparent==false){

                var filters=[
                    ["altname","isnot",companyname], 
                    "AND", 
                    ["msesubsidiary.namesel","anyof",subsidiary],
                    "AND", 
                    ["vatregnumber","is",vatregnumber],
                    "AND",
                    ["parentcustomer.entityid","isempty",""]
                ]
    
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:filters,
                    columns:
                    [
                        search.createColumn({name: "entityid", label: "ID"}),
                        search.createColumn({name: "altname",label: "Name"}),
                        search.createColumn({name: "vatregnumber", label: "Tax Number"})                  
                    ]
                 });
                 var cus_filter2_id='',cus_filter2_vat='',cus_filter2_entityid='';
                 customerSearchObj.run().each(function(result){
                    cus_filter2_id=result.id;
                    cus_filter2_vat=result.getValue('vatregnumber');
                    cus_filter2_vat=cus_filter2_vat==''?'N/A':cus_filter2_vat;
                    cus_filter2_entityid=result.getValue('entityid')+' '+result.getValue('altname');
                    return true;
                 });

                 if(cus_filter2_id!=''){
                    return {
                        status:'fail',
                        cus_data:message(cus_filter2_entityid,cus_filter2_vat),              
                        error_msg:''
                    }; 
                 }


             }
           
            var filters_same=[
                ["altname","is",companyname],
                "AND", 
                ["msesubsidiary.namesel","anyof",subsidiary],
                "AND",               
            ]

            if(vatregnumber=='N/A'){
                filters_same.push([["vatregnumber","isempty",""],"OR",["vatregnumber","is","N/A"]]);
            }else{
                filters_same.push(["vatregnumber","is",vatregnumber]);
            }    

            var customerSearchObj = search.create({
                type: "customer",
                filters:filters_same,
                columns:
                [
                    search.createColumn({name: "entityid", label: "ID"}),
                    search.createColumn({name: "altname",label: "Name"}),
                    search.createColumn({name: "vatregnumber", label: "Tax Number"})                  
                ]
             });

             var cus_filter1_id='',cus_filter1_vat='',cus_filter1_entityid='';
             customerSearchObj.run().each(function(result){
                cus_filter1_id=result.id;
                cus_filter1_vat=result.getValue('vatregnumber');
                cus_filter1_vat=cus_filter1_vat==''?'N/A':cus_filter1_vat;
                cus_filter1_entityid=result.getValue('entityid')+' '+result.getValue('altname');
                return true;
             });

            if(cus_filter1_id!=''){
                return {
                    status:'success',
                    cus_data:message(cus_filter1_entityid,cus_filter1_vat),               
                    error_msg:''
                }; 
            }else{
                return {
                    status:'isnull',
                    cus_data:'',               
                    error_msg:'查無相關Netsuite帳戶!'
                }; 
            } 
           
           
           

          
        } catch (err) {
            log.error({
                title: 'Post',
                details: JSON.stringify(err)
            });

            return {
                status:'error',
                cus_data:[],              
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

   
    return {     
        get: doGet,
        post:doPost
    };
});

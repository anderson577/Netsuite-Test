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
            log.debug('context',JSON.stringify(context));
            var s_data=JSON.parse(JSON.stringify(context));
            //log.debug('s_data',s_data);
            var entityid_l=s_data.entityid_l;
            if(entityid_l.length!=0){ 

                var filter= [["subsidiary","anyof","1","4"]],data=[],entityid_c=[];//10/05 先關閉對香港的查詢
                var id_filter=[];
                for(var i=0;i<entityid_l.length;i++){                   
                    if(entityid_c.indexOf(entityid_l[i])==-1){
                        if(i!=0){
                            id_filter.push("OR");
                        }                                        
                        id_filter.push( ["entityid","is",entityid_l[i]]);
                        entityid_c.push(entityid_l[i]);
                        data.push({
                            entityid:entityid_l[i],
                            altname:'',
                            beneficiary_bank:'',
                            bank_code:'',
                            branch_code:'',
                            swift_code:'',
                            vacc_number:'',
                            subsidiary:''
                        });
                    }   
                                 
                }
                if(id_filter.length>0){
                    filter=[
                        ["subsidiary","anyof","1","4"],
                        "AND",
                        id_filter
                    ];
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
                       "altname",
                       search.createColumn({name: "custentity_beneficiary_bank", label: "受款銀行(BENEFICIARY BANK)"}),
                       search.createColumn({name: "custentity_bank_code", label: "銀行代碼(BANK CODE)"}),                       
                       search.createColumn({name: "custentity_branch_code", label: "分行代碼(BRANCH CODE)"}),
                       search.createColumn({name: "custentity_swift_code", label: "SWIFT CODE"}),                 
                       search.createColumn({name: "custentity_vacc_check_number", label: "虛擬帳戶號碼(含檢查碼)"}),
                       search.createColumn({name: "subsidiarynohierarchy", label: "Primary Subsidiary (no hierarchy)"})
                    ]
                 });
                 
                 var results = customerSearchObj.run();             
                 var searchid = 0;
                 do {
                     var resultslice = results.getRange({start:searchid,end:searchid+1000});
                        resultslice.forEach(function(slice) { 
                            for(var j=0;j<data.length;j++){
                                if(data[j].entityid==slice.getValue('entityid')){
                                    data[j].altname=slice.getValue('altname');
                                    data[j].beneficiary_bank=slice.getValue('custentity_beneficiary_bank');
                                    data[j].bank_code=slice.getValue('custentity_bank_code');
                                    data[j].branch_code=slice.getValue('custentity_branch_code');
                                    data[j].swift_code=slice.getValue('custentity_swift_code');
                                    data[j].vacc_number=slice.getValue('custentity_vacc_check_number');
                                    data[j].subsidiary=slice.getText('subsidiarynohierarchy');
                                    break;
                                }
                            }
                            searchid++;
                        }
                     );
                 } while (resultslice.length >=1000);              
                        
               
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

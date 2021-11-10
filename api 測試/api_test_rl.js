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
            var transaction_type=data.transaction_type;
            var tranid=data.tranid;
            var sodata={};
            if(tranid!=null&&tranid!=''&&tranid!=undefined &&
               transaction_type!=null&&transaction_type!=''&&transaction_type!=undefined){
                var internalid='';
                var transactionSearchObj = search.create({
                    type: 'transaction',
                    filters:
                    [                      
                        ["mainline","is","T"],
                        "AND", 
                        ["recordtype","is",transaction_type],  
                        "AND", 
                        ["number","equalto",tranid]                     
                    ],
                    columns:
                    [                      
                       search.createColumn({name: "entity", label: "Name"}),
                       search.createColumn({name: "department", label: "Department"}),
                       search.createColumn({name: "trandate", label: "DATE"}), 
                       search.createColumn({name: "salesrep", label: "SALES REP"}),
                       search.createColumn({name: "status", label: "Status"}),                  
                    ]
                 });
                 var searchResultCount = transactionSearchObj.runPaged().count;
                 log.debug("transactionSearchObj result count",searchResultCount);
                 transactionSearchObj.run().each(function(result){
                    internalid=result.id;
                    sodata={
                        internalid:internalid,
                        entity:result.getText({name: "entity", label: "Name"}),
                        status:result.getValue({name: "status", label: "Status"}),
                        department:result.getText({name: "department", label: "Department"}),
                        trandate:result.getValue({name: "trandate", label: "DATE"}),
                        salesrep:result.getText({name: "salesrep", label: "SALES REP"}),
                    };
                    return true;
                 });

                if(internalid!=''){
                    return {
                        status:'success',                                
                        data:sodata,
                        error_msg:''
                    }; 
                }else{
                    return {
                        status:'fail',                                
                        data:sodata,
                        error_msg:'找不到此單號!'
                    }; 
                } 
               
            }else{
                return {
                    status:'fail',                                  
                    data:{},
                    error_msg:'請輸入tranid,交易類型'
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
                error_msg:err
            };     
        }                      
      


    }
    return {     
        get: doGet,
        post:doPost
    };
});

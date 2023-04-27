/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */


define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/config','N/action','N/email','N/url','N/https','N/redirect'],
    function(search, record, runtime, error, format, config,actionMod,email,url,https,redirect)
    {
        function getInputData(context){
            log.debug('In Get Input data Stage', context);

            try{
               var transactionSearchObj = search.create({
                  type: "transaction",
                  filters:
                  [
                     ["mainline","is","T"], 
                     "AND", 
                     ["duedate","onorbefore","lastweektodate"], 
                     "AND", 
                     ["status","anyof","CustInvc:A"], 
                     "AND", 
                     ["custbody1","isnotempty",""], 
                     "AND", 
                     ["department","anyof","2"], //Google 
                     "AND", 
                     ["class","anyof","4","31","14"], //G-Suite / HMH / HDE 
                     "AND", 
                     ["custbody10","isnotempty",""],
                     "AND", 
                     ["customer.custentity_gws_dunning_enable","is","T"],
                     "AND", 
                     ["customer.custentity_gws_invoice_groups_email","isnotempty",""]            
                  ],
                  columns:
                  [
                     search.createColumn({
                        name: "tranid",
                        summary: "COUNT",
                        sort: search.Sort.ASC,
                        label: "Document Number"
                     }),
                     search.createColumn({
                        name: "internalid",
                        join: "customer",
                        summary: "GROUP",
                        label: "Internal ID"
                     }),
                     search.createColumn({
                        name: "entity",
                        summary: "GROUP",
                        label: "Name"
                     }),
                     search.createColumn({
                        name: "custentity_invoice_delivery_group",
                        join: "customer",
                        summary: "GROUP",
                        label: "Invoice Delivery Group"
                     })
                  ]
               });
               var searchResultCount = transactionSearchObj.runPaged().count;
               log.debug("transactionSearchObj result count",searchResultCount);
            }catch(e){
               email.sendBulk({
                  author: 25968,
                  recipients: [25968],
                  subject: '注意!排程程式催款信錯誤',
                  body: e,       
               });
               log.error("error",e);
            }
        
            
            return transactionSearchObj;
        }

        function map(context){
            //log.debug('In Map Stage');
          var searchResult = JSON.parse(context.value);
          log.debug('searchResult',searchResult);
          try{
            var cus_name=searchResult.values['GROUP(entity)'].text;
            var cus_id=searchResult.values['GROUP(internalid.customer)'].value;
            var messageSearchObj = search.create({
               type: "message",
               filters:
               [
                  ["subject","contains","【宏庭科技帳款通知】Google Workspace_"], 
                  "AND", 
                  ["entity.internalid","anyof",cus_id], 
                  "AND", 
                  ["messagetype","anyof","EMAIL"], 
                  "AND", 
                  ["messagedate","after","weekbeforelasttodate"]
               ],
               columns:
               [                
                  search.createColumn({
                     name: "messagedate",
                     sort: search.Sort.DESC,
                     label: "Date"
                  }),                
               ]
            });
            var searchResultCount = messageSearchObj.runPaged().count;
            log.debug(cus_name+'-2周內信數',searchResultCount);
            if(searchResultCount==0){
               var scriptUrl = url.resolveScript({
                  scriptId: 'customscript_dunning_letter_sl',
                  deploymentId: 'customdeploy_dunning_letter_sl',
                  returnExternalUrl: true,
                  params:{ cus_id:cus_id,mode:'send',inv_L:'all',send_L:'all',bu:'GWS'}
                 });       
                 
                  // log.debug("scriptUrl",scriptUrl)    
                   var response = https.post({url:scriptUrl});  
                   
                   var rec_status= response.body;
                   
                   log.debug(cus_id+'_rec_status',rec_status); 
                   if(rec_status=='success'){
                     var cus_rec = record.load({
                        type: 'customer', 
                        id: cus_id,
                        isDynamic: false,
                    });
                    var date = new Date();
                    var TAIPEI_current_date = format.format({
                        value: date,
                        type: format.Type.DATETIMETZ,
                        timezone: format.Timezone.ASIA_TAIPEI
                    })             
                    TAIPEI_current_date=TAIPEI_current_date.substr(0,TAIPEI_current_date.indexOf(' '));                 
                    cus_rec.setText({fieldId: 'custentity_gws_last_dunning_date',text:TAIPEI_current_date,ignoreFieldChange: true}); 
                    cus_rec.save(); 
                   }
            
            }
         
          
          }catch(e){
            log.error('error-searchResult',searchResult);
            log.error("error",e);
          }
           
            
        }        

        function summarize(context) {
            log.debug('In summarize Stage');
        }

        function Search_group(name){       
         var group_id='';
         var entitygroupSearchObj = search.create({
             type: "entitygroup",
             filters:
             [
                ["groupname","is",name]
             ],
             columns:
             [
                search.createColumn({
                   name: "groupname",
                   sort: search.Sort.ASC,
                   label: "Name"
                })             
             ]
          });          
          entitygroupSearchObj.run().each(function(result){
             group_id=result.id;
             return true;
          });
          
          return group_id;
     }

     
       

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize          
        };
    });
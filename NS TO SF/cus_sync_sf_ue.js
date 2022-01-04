/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','./SF_GlobalUtilities.js'],
 function(record, runtime, search, serverWidget, format,https,SF) {

    function beforeLoad(context) {
        if (context.type == "create" || context.type == "copy"){ 
            var rec = context.newRecord;
            rec.setValue({fieldId: 'custentity_sf_id',value:null,ignoreFieldChange: true});         

        }
    }

    function beforeSubmit(context) {
    
    }

    function afterSubmit(context) {  
        log.debug('executionContext', runtime.executionContext);
        log.debug('context.type', context.type);    
        if (((context.type == "edit" || context.type == "create" || context.type == "delete") && 
                runtime.executionContext !== runtime.ContextType.USEREVENT)||context.type == "xedit"){        

            if(context.type == "delete"){
                var id = context.newRecord.id;
                var rec = context.oldRecord;
                var sf_id = rec.getValue('custentity_sf_id');

                if(sf_id!=''){
                    var data= { 'Obj' : {
                        id:rec.id,
                        entityid:'',
                        name:'',
                        subsidiary:'',
                        stage:'',
                        vatregnumber:'',
                        sf_id:sf_id,
                        isdelete:true
                    } }; 
                    log.debug('data', data); 
                    var response =JSON.parse(SF.posttoSF(data,'NS_CUS_API'));
                    log.debug('response', response); 
                    if(response.status=='success'){
                        log.debug('internalid', response.data.internalid);
                    }
                }  
              

            }else{
                var id = context.newRecord.id;
                var type = context.newRecord.type;
    
    
                var rec = record.load({
                    type: type,
                    id: id,
                    isDynamic: false
                }) ;
    
                
                var sf_id = rec.getValue('custentity_sf_id');
                //log.debug('context', context);
                //log.debug('executionContext', runtime.executionContext);
                log.debug('sf_id', sf_id);
                var stage=rec.getValue('stage');
                if(stage=='CUSTOMER'){
                    stage='Customer';
                }else if(stage=='PROSPECT'){
                    stage='Opportunitites';
                }else if(stage=='LEAD'){
                    stage='Prospect';
                }
    
                var subsidiary=rec.getValue('subsidiary');
                var subsidiary_rec = record.load({
                    type: 'subsidiary',
                    id: subsidiary,
                    isDynamic: false
                });
                var cus_rec = search.lookupFields({
                    type: 'customer',
                    id: id,
                    columns: ['altname']
                });
                
               
                var data= { 'Obj' : {
                    id:rec.id,
                    entityid:rec.getValue('entityid'),
                    name:cus_rec.altname,
                    subsidiary:subsidiary_rec.getValue('name'),
                    stage:stage,
                    vatregnumber:rec.getValue('vatregnumber'),
                    sf_id:sf_id,
                    isdelete:false
                } }; 
                log.debug('data', data); 
                var response =JSON.parse(SF.posttoSF(data,'NS_CUS_API'));
                log.debug('response', response); 
                if(response.status=='success'){
                    log.debug('internalid', response.data.internalid);
                    record.submitFields({
                        type: 'customer',
                        id: id,
                        values: {
                            custentity_sf_id:response.data.internalid,                       
                        }
                    });
    
                }
               

            }
          
        }
    }
    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

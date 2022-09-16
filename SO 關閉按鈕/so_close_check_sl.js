/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/log'],

function(record, search,log) {
  
    function onRequest(context) {
		var id = context.request.parameters.id;  
		log.debug('id', id)	
       
        try {
            var rec = record.load({type: 'salesorder' ,id: id,isDynamic: false});
            var linecount = rec.getLineCount({ sublistId: 'item'});
            for (var i = 0; i < linecount; i++){
                rec.setSublistValue({sublistId: 'item', fieldId: 'isclosed',value:true, line: i});                          
            }
            rec.save({enableSourcing:false,ignoreMandatoryFields:false});
            context.response.write('success');
        } catch (error) {
            log.error('error_id',id); 
            log.error('error',error); 
            context.response.write(error.message);

        }
    	
    	

	}
  
  
    return {
        onRequest: onRequest
    };
    
});
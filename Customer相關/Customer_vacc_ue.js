/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/format','N/https','N/error'],
 function(record, runtime, search, serverWidget, format,https,error) {

    function beforeLoad(context) {
     
    }

    function beforeSubmit(context) { 
        var rec = context.newRecord;
      
        var vacc_number=rec.getValue({ fieldId: 'custentity_vacc_number' });
        var subsidiary=rec.getValue({ fieldId: 'subsidiary' });
        //log.debug("vacc_number", vacc_number);
        if((subsidiary==1||subsidiary==4) && isNumeric(vacc_number)&&vacc_number.length==13){//博弘台灣,宏庭台灣
            var check_vacc_number=ser_checknumber(vacc_number);
            log.debug("check_vacc_number", check_vacc_number);
            rec.setValue({fieldId: 'custentity_vacc_check_number',value:check_vacc_number,ignoreFieldChange: true});
        }else if((subsidiary==3||subsidiary==7) && isNumeric(vacc_number) && vacc_number.length==9){//博弘香港,宏庭香港        
            rec.setValue({fieldId: 'custentity_vacc_check_number',value:vacc_number,ignoreFieldChange: true});
        }
        else{
            rec.setValue({fieldId: 'custentity_vacc_check_number',value:'',ignoreFieldChange: true});
        }

    
     
    }

    function afterSubmit(context) {  
    }
    function isNumeric(str) {
        if (typeof str != "string") return false // we only process strings!  
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
               !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
      }
    function ser_checknumber(num){
        var algorithm='';
        var checknumber='';
        for(var i=0;i<num.length;i++){
            if(i%2==0){
                algorithm+=parseInt(num[i])*2;
            }else{
                algorithm+=parseInt(num[i]);
            }
        }
        //log.debug('algorithm', algorithm); 
        var algorithm_c=0;
        for(var i=0;i<algorithm.length;i++){
            algorithm_c+=parseInt(algorithm[i]);
        }
        //log.debug('algorithm_c', algorithm_c); 
        if(algorithm_c%10==0){
            checknumber=num+0;
        }else{
            var check10=10*(parseInt(algorithm_c/10)+1);
            checknumber=num+(check10-algorithm_c);
        }

        return checknumber;

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

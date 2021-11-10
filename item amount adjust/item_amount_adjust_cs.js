/**
 *@NModuleScope Public
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/log'], 
function(currentRecord, record, search, url, log) {
  
   
    function fieldChanged(context) {
     
      
        try{
            var rec = context.currentRecord;
            if (context.sublistId == "item" && context.fieldId == "rate"){
                var rate=rec.getCurrentSublistValue({sublistId: 'item', fieldId: 'rate'})
                var quantity=rec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'})
                var amount=accMul(rate,quantity);
                log.debug("amount", amount);
                var currency=rec.getText('currency');
                if(currency=='TWD'){
                    var taxrate1=rec.getCurrentSublistValue({sublistId: 'item', fieldId: 'taxrate1'});
                    log.debug("taxrate1", taxrate1);            
                    if(taxrate1!=''){                                                      
                        amount=showAsFloat(amount,0);
                        log.debug("amount", amount);
                        var grossamt=accMul(amount,accDiv(taxrate1+100,100));
                        grossamt=showAsFloat(grossamt,0);
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value:grossamt, ignoreFieldChange: true });
                        rec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'tax1amt', value:grossamt-amount, ignoreFieldChange: true });
                    }  
                   
                }

            }           
         
        }catch(e){
            log.error("fieldChanged_error", e);
        }
     
    }
    
  

    function postSourcing(context) {
     
    }
  
    function showAsFloat(n, fixnum) {
        var size = Math.pow(10, fixnum);
        return Math.round(accMul(n, size)) / size
    }
    //乘法   
    function accMul(arg1, arg2) {
        var m = 0, s1 = '', s2 = '';
        try { s1 = arg1.toString(); s2 = arg2.toString(); } catch (e) { }
        try { m += s1.split(".")[1].length } catch (e) { }
        try { m += s2.split(".")[1].length } catch (e) { }
        return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
    }
    //除法 
    function accDiv(arg1, arg2) {
        var t1 = 0, t2 = 0, r1, r2;
        try { t1 = arg1.toString().split(".")[1].length } catch (e) { }
        try { t2 = arg2.toString().split(".")[1].length } catch (e) { }
        with (Math) {
            r1 = Number(arg1.toString().replace(".", ""))
            r2 = Number(arg2.toString().replace(".", ""))
            return accMul((r1 / r2), pow(10, t2 - t1));
        }
    }
    return {           
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,          
    }
});
  
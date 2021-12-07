/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', 'N/currency','N/runtime'  ], 
function(currentRecord, record, search, url, currency ,runtime) {
    var mode = ''
        function pageInit(context) {
            mode = context.mode
            //console.log(mode);
            var userObj = runtime.getCurrentUser();
            //console.log(userObj);
            if(mode=='create'){
		        var subsidiary_id = userObj.subsidiary; //objEMP.getValue({fieldId:"subsidiary"});
                context.currentRecord.setValue({fieldId: 'subsidiary',value:subsidiary_id});
            } else if(mode=='copy'){
                log.debug('linecount:', context.currentRecord.getLineCount({sublistId: 'line'}));
                var linecount = context.currentRecord.getLineCount({sublistId: 'line'});
                if (linecount >1){
                    for (var j = 1; j < linecount+1; j++) {
                        context.currentRecord.removeLine({sublistId: 'line',line: 0,ignoreRecalc: true});
                    }
                };
            }
        }

        function saveRecord(context) {
            var scriptObj = runtime.getCurrentScript();
            //log.debug('Script parameter of custscript1: ', scriptObj.getParameter({name: 'custscript_iv_eaa_credit'}));
            var amount=context.currentRecord.getValue({fieldId: 'custbody_iv_caa_amount'});
            var entity=context.currentRecord.getValue({fieldId: 'custbody_iv_caa_customer'});
            var Intaxrate=scriptObj.getParameter({name: 'custscript_iv_caa_taxrate'})/100+1;
            var taxrate=scriptObj.getParameter({name: 'custscript_iv_caa_taxrate'})/100;
            log.debug('Script parameter of custscript1: ', taxrate);
            log.debug('mode:', mode);

            var taxVendor=scriptObj.getParameter({name: 'custscript_iv_caa_taxvendor'});
            var linecount = context.currentRecord.getLineCount({sublistId: 'line'});
            if (linecount >1){
                for (var j = 1; j < linecount; j++) {
                    context.currentRecord.removeLine({sublistId: 'line',line: 0,ignoreRecalc: true});
                }
            };
            context.currentRecord.selectLine({sublistId: 'line',line: 0});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value:scriptObj.getParameter({name: 'custscript_iv_caa_araccount'})});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'debit',value:amount});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'entity',value:entity});
            context.currentRecord.commitLine({sublistId: 'line'});

            context.currentRecord.selectLine({sublistId: 'line',line: 1});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value:scriptObj.getParameter({name: 'custscript_iv_caa_bankaccount'})});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'credit',value:amount});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'entity',value:entity});
            context.currentRecord.commitLine({sublistId: 'line'});

            context.currentRecord.selectLine({sublistId: 'line',line: 2});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value:scriptObj.getParameter({name: 'custscript_iv_caa_depositaccount'})});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'debit',value:Math.round(amount/Intaxrate*taxrate*100)/100});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'entity',value:entity});
            context.currentRecord.commitLine({sublistId: 'line'});

            context.currentRecord.selectLine({sublistId: 'line',line: 3});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'account',value:scriptObj.getParameter({name: 'custscript_iv_caa_taxaccount'})});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'credit',value:Math.round(amount/Intaxrate*taxrate*100)/100});
            context.currentRecord.setCurrentSublistValue({sublistId: 'line',fieldId: 'entity',value:taxVendor});
            context.currentRecord.commitLine({sublistId: 'line'});

            //var linevalue = context.currentRecord.getSublistValue({sublistId: 'line',fieldId: 'account',line:0});
            //log.debug('linevalue',linevalue);
            //log.debug('aa',context.currentRecord.getCurrentSublistValue({sublistId: 'line',fieldId: 'account'}));
            return true;
        }

        return {
            pageInit: pageInit,
            //fieldChanged: fieldChanged ,
            saveRecord: saveRecord

        }
  });
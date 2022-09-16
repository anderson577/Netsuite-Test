/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/file', 'N/render', 'N/log', 'N/format', 'N/https', 'N/url', 'N/runtime','N/email'],

function(record, search, file, render, log, format, https, url, runtime,email) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {      
       
        var cus_id = context.request.parameters.cus_id;
        var mode = context.request.parameters.mode;
        var inv_L = context.request.parameters.inv_L;
        if(inv_L!='all')inv_L=JSON.parse(inv_L);
        log.debug('cus_id', cus_id);
        try {
            var filter=[
                ["mainline","is","T"], 
                "AND", 
                ["duedate","before","today"], 
                "AND", 
                ["status","anyof","CustInvc:A"], 
                "AND", 
                ["custbody1","isnotempty",""], 
                "AND", 
                ["name","anyof",cus_id]
            ];
            if(inv_L!='all'){
                filter.push("AND");               
                var id_f=["internalid","anyof"];
                for (var i = 0; i < inv_L.length; i++){
                    id_f.push(inv_L[i]);
                }
                filter.push(id_f);  
            }
            log.debug('filter', filter);
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:filter,
                columns:
                [                
                   search.createColumn({name: "currency", label: "Currency"}),
                   search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                   search.createColumn({name: "amount", label: "Amount"}),                
                   search.createColumn({name: "custbody1", label: "GUI/VAT"}),
                   search.createColumn({name: "custbody10",sort: search.Sort.ASC, label: "GUI/VAT Date"}),
                   search.createColumn({
                    name: "altname",
                    join: "customer",
                    label: "Name"
                 })
                ]
             });
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("transactionSearchObj result count",searchResultCount);

             var results = { lines: [] };
             var cus_name=''; 
             transactionSearchObj.run().each(function(result){
                var currency=result.getText('currency');
                var check_index=-1;
                for(var i=0;i<results.lines.length;i++){
                    if(results.lines[i].currency==currency){
                        check_index=i;
                    }
                }              
                if(check_index==-1){
                    results.lines.push({
                        currency:currency,
                        currency_id:result.getValue('currency'),
                        data:[]
                    });
                    check_index=results.lines.length-1;
                }               
                results.lines[check_index].data.push({                  
                    GUI_VAT:result.getValue('custbody1'),
                    GUI_VAT_Date:result.getValue('custbody10'),
                    fxamount:parseFloat(result.getValue('fxamount'))                   
                });              
                cus_name=result.getValue({name: "altname",join: "customer",label: "Name"});         
                return true;
             });

             for(var i=0;i<results.lines.length;i++){
              
                if(results.lines[i].currency_id!=''){
                   var currency_rec=record.load({
                       type: "currency",
                       id: results.lines[i].currency_id,
                       isDynamic: false
                   }) 
                   var currency_symbol= currency_rec.getValue('displaysymbol');
                   results.lines[i].currency_symbol=currency_symbol;
                }
                var amount_total=0;
                for(var j=0;j<results.lines[i].data.length;j++){
                    amount_total+=parseFloat(results.lines[i].data[j].fxamount);
                }
                results.lines[i].amount_total=amount_total;                
                log.debug('amount_total', amount_total);
             }
          
             log.debug('results.lines', results.lines);

          
             	
    
            var html_url='';
            if(mode=='send')html_url="../Html/dunning_letter.html";
            if(mode=='view')html_url="../Html/dunning_letter_view.html";
            var xmlTmplFile = file.load({
                    id: html_url ,
            });
        
            var renderer = render.create();
            renderer.templateContent = xmlTmplFile.getContents();
         
          
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'result',
                data: results
            });
            
            var Record = {
                cus_name:cus_name       
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: Record
            });    
            
        
            var xmlStr = renderer.renderAsString();
            log.debug('xmlStr', xmlStr);
            if(mode=='send'){
                email.sendBulk({
                author: 117893,//NL-AWS-CS
                recipients: ['anderson.yang@nextlink.com.tw'],
                subject: '【博弘雲端科技(股)公司】催收帳款通知信 - '+cus_name,
                body: xmlStr,
                relatedRecords: { entityId: [cus_id] }      
                });
                context.response.write('success'); 
            }else if(mode=='view'){
                context.response.renderPdf({
                    xmlString: xmlStr
                });
            }
        
        } catch (error) {
            log.error('error_cus_id', cus_id);
            log.error('error', error);
            email.sendBulk({
            author: 25968,
            recipients: [25968],
            subject: '注意!催款信錯誤',
            body: error,       
            });
            context.response.write('error'); 
        }
    
	}

 
    return {
        onRequest: onRequest
    };
    
});
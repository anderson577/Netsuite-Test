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
        var send_L = context.request.parameters.send_L;
        var bu = context.request.parameters.bu;
        log.debug('bu', bu);
        if(inv_L!='all')inv_L=JSON.parse(inv_L);
        log.debug('cus_id', cus_id);
        try {
            var filter=invoice_filter(bu,cus_id);
         
            if(inv_L!='all'){
                filter.push("AND");               
                var id_f=["internalid","anyof"];
                for (var i = 0; i < inv_L.length; i++){
                    id_f.push(inv_L[i]);
                }
                filter.push(id_f);  
            }
            log.debug('filter', filter);
            var gcp_eng=false;
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:filter,
                columns:
                [                
                   search.createColumn({name: "currency", label: "Currency"}),
                   search.createColumn({name: "tranid",label: "Document Number"}),
                   search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                   search.createColumn({name: "amount", label: "Amount"}),                
                   search.createColumn({name: "custbody1", label: "GUI/VAT"}),
                   search.createColumn({name: "custbody10",sort: search.Sort.ASC, label: "GUI/VAT Date"}),
                   search.createColumn({name: "trandate", label: "Date"}),
                   search.createColumn({
                    name: "altname",
                    join: "customer",
                    label: "Name"
                 }),
                 search.createColumn({
                    name: "custentity_invoice_groups_email",
                    join: "customer",
                    label: "Invoice Delivery Group'S Email"
                 }),
                 search.createColumn({
                    name: "custentity_gcp_invoice_groups_email",
                    join: "customer",
                    label: "GCP INVOICE DELIVERY GROUP'S EMAIL"
                 }),
                 search.createColumn({
                    name: "custentity_gws_invoice_groups_email",
                    join: "customer",
                    label: "GWS INVOICE DELIVERY GROUP'S EMAIL"
                 }),
                 search.createColumn({
                    name: "email",
                    join: "salesRep",
                    label: "Email"
                 }),
                 search.createColumn({
                    name: "entityid",
                    join: "salesRep",
                    label: "Name"
                 }),
                 search.createColumn({
                    name: "custentity16",
                    join: "salesRep",
                    label: "Chinese Name"
                 }),
                 search.createColumn({
                    name: "altphone",
                    join: "salesRep",
                    label: "OFFICE PHONE"
                 })
                ]
             });
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("transactionSearchObj result count",searchResultCount);

             var results = { lines: [] };
             var cus_name='',salesRep_email=[],invoice_groups_email=[];
             if(bu=='AWS')salesRep_email.push('nl-aws-adm@nextlink.com.tw');
             if(bu=='GCP')salesRep_email.push('gcp.billing@microfusion.cloud');
             if(bu=='GWS')salesRep_email.push('gsuite.billing@microfusion.cloud');
             
             var GUI_VAT_Year='',GUI_VAT_Month='',ind=1,sales_tex='';
             transactionSearchObj.run().each(function(result){
                var GUI_VAT_Date=result.getValue('custbody10');
                if(GUI_VAT_Date==''||GUI_VAT_Date==undefined||GUI_VAT_Date==null){
                    gcp_eng=true;
                }
                if(ind==1){
                    GUI_VAT_Year=GUI_VAT_Date.split('/')[0];
                    GUI_VAT_Month=GUI_VAT_Date.split('/')[1];
                }
                var sales_name=result.getValue({
                    name: "entityid",
                    join: "salesRep",
                    label: "Name"
                 });
                var sales_chinese=result.getValue({
                    name: "custentity16",
                    join: "salesRep",
                    label: "Chinese Name"
                });
                var sales_officephone=result.getValue({
                    name: "altphone",
                    join: "salesRep",
                    label: "OFFICE PHONE"
                });
                if(sales_name!=''&&sales_chinese!=''){
                    var officephone=sales_officephone.indexOf('#')==-1?'':'#'+sales_officephone.split('#')[1]+' ';
                    var addtext=officephone+sales_chinese+'('+sales_name+') ';
                    sales_tex=addtext;
                }
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
                var same_gui=false;             
                if(bu=='GCP' && gcp_eng==true){
                    same_gui=false;
                }else{
                    for(var i=0;i<results.lines[check_index].data.length;i++){
                        var line_data=results.lines[check_index].data[i];
                        if(line_data.GUI_VAT==result.getValue('custbody1')){
                            same_gui=true;
                            line_data.fxamount+=parseFloat(result.getValue('fxamount'));
                        }
                    }
                }
                if(same_gui==false){
                    results.lines[check_index].data.push({
                        tranid:result.getValue('tranid'),               
                        GUI_VAT:result.getValue('custbody1'),
                        GUI_VAT_Date:GUI_VAT_Date,
                        trandate:result.getValue('trandate'),
                        fxamount:parseFloat(result.getValue('fxamount'))                   
                    });    
                }             
                       
                cus_name=result.getValue({name: "altname",join: "customer",label: "Name"}); 
                // var salesRepEmail=result.getValue({name: "email",join: "salesRep",label: "Email"});
                // if(salesRepEmail!=''&& salesRep_email.indexOf(salesRepEmail)==-1){
                //     salesRep_email.push(salesRepEmail);
                // } //09/29因為從BP過來的收件人已經包含業務，改成不寄送發票sales rep
                var groups_email='';
                if(bu=='AWS')groups_email=result.getValue({name: "custentity_invoice_groups_email",join: "customer",label: "Invoice Delivery Group'S Email"});
                if(bu=='GCP')groups_email=result.getValue({name: "custentity_gcp_invoice_groups_email",join: "customer",label: "GCP INVOICE DELIVERY GROUP'S EMAIL"});
                if(bu=='GWS')groups_email=result.getValue({name: "custentity_gws_invoice_groups_email",join: "customer",label: "GWS INVOICE DELIVERY GROUP'S EMAIL"});
                
                if(groups_email!=''){
                    if(bu=='AWS')invoice_groups_email=groups_email.split(',');
                    if(bu=='GCP')invoice_groups_email=groups_email.split(';'); 
                    if(bu=='GWS')invoice_groups_email=groups_email.split(';');  
                }
                ind++;
                return true;
             });
             log.debug('salesRep_email', salesRep_email);
             if(send_L!='all' && send_L!='')invoice_groups_email=send_L.split(',');
             log.debug('invoice_groups_email', invoice_groups_email);

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
            if(mode=='send'){
                if(bu=='AWS')html_url="../Html/dunning_letter.html";
                if(bu=='GWS')html_url="../Html/dunning_letter_gws.html";
                if(bu=='GCP' && gcp_eng==false)html_url="../Html/dunning_letter_gcp_chi.html";
                if(bu=='GCP' && gcp_eng==true)html_url="../Html/dunning_letter_gcp_eng.html"; 
            }          
            if(mode=='view'){
                if(bu=='AWS')html_url="../Html/dunning_letter_view.html";
                if(bu=='GWS')html_url="../Html/dunning_letter_gws_view.html";
                if(bu=='GCP' && gcp_eng==false)html_url="../Html/dunning_letter_gcp_chi_view.html";
                if(bu=='GCP' && gcp_eng==true)html_url="../Html/dunning_letter_gcp_eng_view.html";
            }
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
            
            var cus_rec = record.load({
                type: 'customer', 
                id: cus_id,
                isDynamic: false,
            }); 
            var vacc_number=cus_rec.getValue('custentity_vacc_check_number');

            var Record = {
                cus_name:cus_name,
                GUI_VAT_Year:GUI_VAT_Year,
                GUI_VAT_Month:GUI_VAT_Month,
                vacc_number:vacc_number,
                sales_tex:sales_tex       
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: Record
            });    
            
        
            var xmlStr = renderer.renderAsString();
            log.debug('xmlStr', xmlStr);
            var subject='';
            if(bu=='AWS')subject='【博弘雲端科技(股)公司】催收帳款通知信 - ';
            if(bu=='GWS')subject='【宏庭科技帳款通知】Google Workspace_';
            if(bu=='GCP' && gcp_eng==false)subject='GCP_帳款逾期通知： ';
            if(bu=='GCP' && gcp_eng==true)subject='GCP Payment Remind： ';

            var author='';
            if(bu=='AWS')author='NL-AWS-CS';
            if(bu=='GWS')author='GWS宏庭科技帳務支援小組';
            if(bu=='GCP')author='GCP Billing Team';
            if(mode=='send'){
                if(invoice_groups_email.length>0){
                    email.sendBulk({
                        author: Search_employee_id(author),
                        recipients: invoice_groups_email,
                        cc:salesRep_email,
                        subject: subject+cus_name,
                        body: xmlStr,
                        relatedRecords: { entityId: [cus_id]}      
                        }); 
                        context.response.write('success'); 
                }else{
                    log.error('error_cus_id', cus_id);
                    log.error('error', '無收件人');
                    context.response.write('error'); 
                }
              
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
         var searchResultCount = entitygroupSearchObj.runPaged().count;
         log.debug("entitygroupSearchObj result count",searchResultCount);
         entitygroupSearchObj.run().each(function(result){
            group_id=result.id;
            return true;
         });
         
         return group_id;
    }
    function Search_employee_id(name){
        var employee_id='';
        var employeeSearchObj = search.create({
            type: "employee",
            filters:
            [
               ["entityid","is",name]
            ],
            columns:
            [              
            ]
         });
      
         employeeSearchObj.run().each(function(result){
            employee_id=result.id;
            return true;
         });
         
         return employee_id;
    }
    function invoice_filter(bu,cus_id){
        var filter=[];
        if(bu=="AWS"){
            filter=[
                ["mainline","is","T"], 
                "AND", 
                ["duedate","onorbefore","lastweektodate"], 
                "AND", 
                ["status","anyof","CustInvc:A"], 
                "AND", 
                ["custbody1","isnotempty",""], 
                "AND", 
                ["department","anyof","1"], 
                "AND", 
                ["subsidiary","anyof","1"], 
                "AND", 
                ["custbody21.group","anyof",Search_group('AWS TW CS Group')],                
                "AND", 
                ["name","anyof",cus_id]
            ];
        }
        if(bu=="GCP"){
            filter=[
                ["mainline","is","T"], 
                "AND", 
                ["duedate","notonorafter","today"], 
                "AND", 
                ["status","anyof","CustInvc:A"],             
                "AND", 
                ["department","anyof","2"], //Google 
                "AND", 
                ["class","anyof","3","26","30","34","33","27"], //GCP / PS / MS / MS-G / ISV / Training           
                "AND", 
                ["name","anyof",cus_id] 
            ];
        }
        if(bu=="GWS"){
            filter=[
                ["mainline","is","T"], 
                "AND", 
                ["duedate","notonorafter","today"], 
                "AND", 
                ["status","anyof","CustInvc:A"], 
                "AND", 
                ["custbody1","isnotempty",""], 
                "AND", 
                ["department","anyof","2"], //Google 
                "AND", 
                ["class","anyof","4","31","14"], //G-Suite / HMH / HDE           
                "AND", 
                ["name","anyof",cus_id],              
                "AND", 
                ["custbody10","isnotempty",""]       
            ];
        }

        return filter;
    }
    return {
        onRequest: onRequest
    };
    
});
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/file', 'N/log', 'N/ui/serverWidget', 'N/runtime', 'N/record', 'N/url', 'N/format', 'N/config', 'N/task', 'N/render'], 

function(search, file, log, ui, runtime, record, url, format, config, task, render) {

    function onRequest(context) {

        var request  = context.request;
        var response = context.response;
        // log.debug('context',context)                             

        
        if (request.method === 'GET'){
            
            var form = ui.createForm({
                title: '對帳系統'
            });         

            layoutForm(form);

            response.writePage(form);

        }else if(request.method === 'POST'){
            var form = ui.createForm({
                title: '對帳系統'
            });
                
            post_layoutForm(form,context);

            response.writePage(form); 
        }  
    }


    function layoutForm(form){

        // log.debug('subid', subid)
        form.addButton({
            id : 'custpage_so_filter_button',
            label : '搜尋',
            functionName: "filter"
        });
      

        var filter1 = form.addFieldGroup({
            id: 'filter1',
            label: '篩選條件'
        });
       

        var field_customer = form.addField({
            id : 'custpage_pt_customer',
            type : ui.FieldType.SELECT,
            label : '客戶:',
            container: 'filter1',
            source: "customer" 
        });
          
        var field_date = form.addField({
            id : 'custpage_trandate',
            type : ui.FieldType.DATE,
            label : '實際交易日期:',
            container: 'filter1'          
        });
      
       
        
        form.clientScriptModulePath = "./reconciliation_ui_cs.js";        
    }

    function post_layoutForm(form,context){

        // log.debug('subid', subid)
        form.addButton({
            id : 'custpage_so_filter_button',
            label : '搜尋',
            functionName: "filter"
        });
      

        var filter1 = form.addFieldGroup({
            id: 'filter1',
            label: '篩選條件'
        });
       
        var customer = context.request.parameters.custpage_pt_customer
        var field_customer = form.addField({
            id : 'custpage_pt_customer',
            type : ui.FieldType.SELECT,
            label : '客戶:',
            container: 'filter1',
            source: "customer" 
        });
        field_customer.defaultValue = customer;   


        var field_date = form.addField({
            id : 'custpage_trandate',
            type : ui.FieldType.DATE,
            label : '實際交易日期:',
            container: 'filter1'          
        });

        var field_select_cus = form.addField({ 
            id: 'custpage_select_cus', 
            label: '目前選擇客戶', 
            type: ui.FieldType.TEXT 
        });
        field_select_cus.defaultValue = customer;

        var newtab = form.addTab({ id : 'custpage_reconcilitab', label : '對帳清單' });      
        var cuslist_reconcili = form.addSublist({
            id : "custpage_cuslist_reconcili",
            type : ui.SublistType.LIST,   //INLINEEDITOR,
            label: "對帳資料",
            tab: 'custpage_reconcilitab'
        });
        cuslist_reconcili.addField({
            id: "custpage_reconcili_select",
            type: ui.FieldType.CHECKBOX,
            label: "選擇"
        });

        var solist_query_id = cuslist_reconcili.addField({id: "custpage_id",type: ui.FieldType.TEXT,label: "ID"});
        solist_query_id.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });         
        var solist_query_trandate = cuslist_reconcili.addField({id: "custpage_trandate",type: ui.FieldType.DATETIMETZ,label: "實際交易日期"});
        solist_query_trandate.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });            
        var solist_query_customer = cuslist_reconcili.addField({id: "custpage_customer",type: ui.FieldType.TEXT,label: "CUSTOMER"});
        solist_query_customer.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
        var solist_query_customer_name = cuslist_reconcili.addField({id: "custpage_customer_name",type: ui.FieldType.TEXT,label: "CUSTOMER NAME"});
        solist_query_customer_name.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_withdrawal_account = cuslist_reconcili.addField({id: "custpage_withdrawal_account",type: ui.FieldType.FLOAT,label: "提款金額"});
        solist_query_withdrawal_account.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_deposit_amount = cuslist_reconcili.addField({id: "custpage_deposit_amount",type: ui.FieldType.FLOAT,label: "存入金額"});
        solist_query_deposit_amount.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_bank_code = cuslist_reconcili.addField({id: "custpage_bank_code",type: ui.FieldType.TEXT,label: "BANK CODE"});
        solist_query_bank_code.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_bank_account = cuslist_reconcili.addField({id: "custpage_bank_account",type: ui.FieldType.TEXT,label: "BANK ACCOUNT"});
        solist_query_bank_account.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_summary = cuslist_reconcili.addField({id: "custpage_summary",type: ui.FieldType.TEXT,label: "摘要"});
        solist_query_summary.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY }); 
        var solist_query_memo = cuslist_reconcili.addField({id: "custpage_memo",type: ui.FieldType.TEXT,label: "MEMO"});
        solist_query_memo.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
       
        var reconcili_data=search_reconciliation_data(customer);
        var j = 0;
        reconcili_data.forEach(function (result){
            cuslist_reconcili.setSublistValue({
                id: 'custpage_id',
                line: j,
                value: result.id
            });         
            if(result.customer){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_customer',
                    line: j,
                    value: result.customer
                });
            }
            if(result.customer_name){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_customer_name',
                    line: j,
                    value: result.customer_name
                });
            }
            if(result.trandate){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_trandate',
                    line: j,
                    value: result.trandate
                });
            }
            if(result.deposit_amount){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_deposit_amount',
                    line: j,
                    value: result.deposit_amount
                });
            } 
            if(result.withdrawal_account){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_withdrawal_account',
                    line: j,
                    value: result.withdrawal_account
                });
            }    
            if(result.summary){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_summary',
                    line: j,
                    value: result.summary
                });
            }    
            if(result.memo){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_memo',
                    line: j,
                    value: result.memo
                });
            }
            if(result.bank_code){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_bank_code',
                    line: j,
                    value: result.bank_code
                });
            }  
            if(result.bank_account){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_bank_account',
                    line: j,
                    value: result.bank_account
                });
            }                      
            j++
        });
        
        var newtab2 = form.addTab({ id : 'custpage_invoicetab', label : '客戶發票清單' });      
        var cuslist_invoice = form.addSublist({
            id : "custpage_cuslist_invoice",
            type : ui.SublistType.INLINEEDITOR,   //INLINEEDITOR,
            label: "發票清單",
            tab: 'custpage_invoicetab'
        });
        cuslist_invoice.addField({
            id: "custpage_invoice_select",
            type: ui.FieldType.CHECKBOX,
            label: "選擇"
        });

        var solist_invoice_id = cuslist_invoice.addField({id: "custpage_invoice_id",type: ui.FieldType.TEXT,label: "ID"});
        solist_invoice_id.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED }); 
        var solist_invoice_trandate = cuslist_invoice.addField({id: "custpage_invoice_trandate",type: ui.FieldType.DATE,label: "交易日期"});
        solist_invoice_trandate.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });            
        var solist_invoice_tranid = cuslist_invoice.addField({id: "custpage_invoice_tranid",type: ui.FieldType.TEXT,label: "交易單號"});
        solist_invoice_tranid.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_customer_name = cuslist_invoice.addField({id: "custpage_invoice_customer_name",type: ui.FieldType.TEXT,label: "CUSTOMER NAME"});
        solist_invoice_customer_name.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_status = cuslist_invoice.addField({id: "custpage_invoice_status",type: ui.FieldType.TEXT,label: "狀態"});
        solist_invoice_status.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_currency = cuslist_invoice.addField({id: "custpage_invoice_currency",type: ui.FieldType.TEXT,label: "幣別"});
        solist_invoice_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_account = cuslist_invoice.addField({id: "custpage_invoice_account",type: ui.FieldType.TEXT,label: "Account"});
        solist_invoice_account.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_amount = cuslist_invoice.addField({id: "custpage_invoice_amount",type: ui.FieldType.FLOAT,label: "Amount"});
        solist_invoice_amount.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_amountpaid = cuslist_invoice.addField({id: "custpage_invoice_amountpaid",type: ui.FieldType.FLOAT,label: "Amount Paid"});
        solist_invoice_amountpaid.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_amountremaining = cuslist_invoice.addField({id: "custpage_invoice_amountremaining",type: ui.FieldType.FLOAT,label: "Amount Remaining"});
        solist_invoice_amountremaining.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED }); 
    
        var invoice_data=search_invoice_data(customer);
        var j = 0;
        invoice_data.forEach(function (result){
            cuslist_invoice.setSublistValue({
                id: 'custpage_invoice_id',
                line: j,
                value: result.id
            });         
            if(result.trandate){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_trandate',
                    line: j,
                    value: result.trandate
                });
            }
            if(result.tranid){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_tranid',
                    line: j,
                    value: result.tranid
                });
            }
            if(result.name){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_customer_name',
                    line: j,
                    value: result.name
                });
            }
            if(result.status){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_status',
                    line: j,
                    value: result.status
                });
            } 
            if(result.currency){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_currency',
                    line: j,
                    value: result.currency
                });
            }    
            if(result.account){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_account',
                    line: j,
                    value: result.account
                });
            }    
            if(result.amount){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_amount',
                    line: j,
                    value: result.amount
                });
            }
            if(result.amountpaid){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_amountpaid',
                    line: j,
                    value: result.amountpaid
                });
            }  
            if(result.amountremaining){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_amountremaining',
                    line: j,
                    value: result.amountremaining
                });
            }                      
            j++
        });

        form.clientScriptModulePath = "./reconciliation_ui_cs.js";        
    }
   
    function DateNow(){

        var date = new Date(); 
        var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}) 
        // log.debug('newdateString',newdateString.substr(0,newdateString.indexOf(' ')))
        
        // return  newdateString
        return  newdateString.substr(0,newdateString.indexOf(' '))   
    }

    function search_reconciliation_data(customer){

        var filter=[];
        if(customer!=''&&customer!=null&&customer!=undefined){
            filter=[["custrecord_recon_customer","anyof","@NONE@",customer]];
        }
        var customrecord_reconciliation_dataSearchObj = search.create({
            type: "customrecord_reconciliation_data",
            filters:filter,
            columns:
            [
               search.createColumn({name: "custrecord_recon_customer", label: "Customer"}),
               search.createColumn({
                  name: "custrecord_recon_date",
                  sort: search.Sort.ASC,
                  label: "帳務日期"
               }),
               search.createColumn({name: "custrecord_recon_trandate", label: "實際交易日期"}),
               search.createColumn({name: "custrecord_recon_deposit_amount", label: "存入金額"}),
               search.createColumn({name: "custrecord_recon_withdrawal_account", label: "提款金額"}),
               search.createColumn({name: "custrecord_recon_summary", label: "摘要"}),
               search.createColumn({name: "custrecord_recon_memo", label: "Memo"}),
               search.createColumn({name: "custrecord_recon_bank_code", label: "Bank Code"}),
               search.createColumn({name: "custrecord_recon_bank_account", label: "Bank Account"})
            ]
         });
      
         var data=[];
         customrecord_reconciliation_dataSearchObj.run().each(function(result){
            data.push({
                id:result.id,
                customer:result.getValue('custrecord_recon_customer'),
                customer_name:result.getText('custrecord_recon_customer'),
                trandate:result.getValue('custrecord_recon_trandate'),
                deposit_amount:result.getValue('custrecord_recon_deposit_amount'),
                withdrawal_account:result.getValue('custrecord_recon_withdrawal_account'),
                summary:result.getValue('custrecord_recon_summary'),
                memo:result.getValue('custrecord_recon_memo'),
                bank_code:result.getValue('custrecord_recon_bank_code'),
                bank_account:result.getValue('custrecord_recon_bank_account'),
            });
            return true;
         });

         return data;

    }
    function search_invoice_data(customer){
        if(customer==''){
            return [];
        }
        var transactionSearchObj = search.create({
            type: "invoice",
            filters:
            [
               ["mainline","is","T"],
               "AND", 
               ["name","anyof",customer],
               "AND", 
               ["status","anyof","CustInvc:A"]
            ],
            columns:
            [
               search.createColumn({
                  name: "trandate",
                  sort: search.Sort.ASC,
                  label: "Date"
               }), 
               search.createColumn({
                  name: "tranid",
                  sort: search.Sort.ASC,
                  label: "Document Number"
               }),          
               search.createColumn({name: "entity", label: "Name"}),
               search.createColumn({name: "account", label: "Account"}),           
               search.createColumn({name: "statusref", label: "Status"}),
               search.createColumn({name: "currency", label: "Currency"}),           
               search.createColumn({name: "amount", label: "Amount"}),
               search.createColumn({name: "amountpaid", label: "Amount Paid"}),
               search.createColumn({name: "amountremaining", label: "Amount Remaining"}),
            ]
         });
         var data=[];        
         transactionSearchObj.run().each(function(result){
            data.push({
                id:result.id,             
                trandate:result.getValue('trandate'),
                tranid:result.getValue('tranid'),
                name:result.getText('entity'),
                status:result.getText('statusref'),
                currency:result.getText('currency'),
                account:result.getText('account'),
                amount:result.getValue('amount'),
                amountpaid:result.getValue('amountpaid'),
                amountremaining:result.getValue('amountremaining'),
            });
            return true;
         }); 

         return data;
    }
    return {
        onRequest: onRequest
    }
});
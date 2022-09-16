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
            id : 'custpage_filter_button',
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
        field_customer.updateLayoutType({
            layoutType: ui.FieldLayoutType.STARTROW
        });
          
        var field_date_start = form.addField({
            id : 'custpage_trandate_start',
            type : ui.FieldType.DATE,
            label : '實際交易日期起:',
            container: 'filter1'          
        });      
        field_date_start.updateLayoutType({
            layoutType: ui.FieldLayoutType.MIDROW
        });
       
        var field_date_end = form.addField({
            id : 'custpage_trandate_end',
            type : ui.FieldType.DATE,
            label : '實際交易日期迄:',
            container: 'filter1'          
        });       
        field_date_end.updateLayoutType({
            layoutType: ui.FieldLayoutType.ENDROW
        });
        // var field_status = form.addField({
        //     id : 'custpage_status',
        //     type : ui.FieldType.SELECT,
        //     label : '狀態:',
        //     container: 'filter1',           
        // });           
        // field_status.addSelectOption({value : '待銷帳', text: '待銷帳'});
        //field_status.addSelectOption({value : '已銷帳', text: '已銷帳'}); 
        var field_subsidiary = form.addField({
            id : 'custpage_subsidiary',
            type : ui.FieldType.SELECT,
            label : 'Subsidiary:',
            container: 'filter1',           
        });
        field_subsidiary.addSelectOption({value : 'all', text: '-ALL-'});           
        field_subsidiary.addSelectOption({value : '博弘雲端科技股份有限公司', text: '博弘雲端科技股份有限公司'});
        field_subsidiary.addSelectOption({value : '宏庭科技股份有限公司', text: '宏庭科技股份有限公司'}); 
        field_subsidiary.updateLayoutType({
            layoutType: ui.FieldLayoutType.STARTROW
        });    
      
        var account_L=Account_List();
        var field_account = form.addField({
            id : 'custpage_account',
            type : ui.FieldType.SELECT,
            label : 'ACCOUNT:',
            container: 'filter1',           
        });           
        field_account.addSelectOption({value : 'all', text: '-ALL-'});
        account_L.forEach(function (data){
            field_account.addSelectOption({value : data.account_id, text: data.account_n});
        });  
        field_account.updateLayoutType({
            layoutType: ui.FieldLayoutType.MIDROW
        });
        

      
        var field_invoice_trandate_strat=form.addField({
            id: 'custpage_invoice_trandate_strat',
            type: ui.FieldType.DATE,
            label: '發票交易日期起:',
            container: 'filter1'
        });
        field_invoice_trandate_strat.updateLayoutType({
            layoutType: ui.FieldLayoutType.OUTSIDEBELOW
        });
      
      
        var field_invoice_trandate_end=form.addField({
            id: 'custpage_invoice_trandate_end',
            type: ui.FieldType.DATE,
            label: '發票交易日期迄:',
            container: 'filter1'
        });
        field_invoice_trandate_end.updateLayoutType({
            layoutType: ui.FieldLayoutType.OUTSIDEBELOW
        });
    

        form.clientScriptModulePath = "./reconciliation_ui_cs.js";        
    }

    function post_layoutForm(form,context){

        // log.debug('subid', subid)
        form.addButton({
            id : 'custpage_filter_button',
            label : '搜尋',
            functionName: "filter"
        });
        form.addButton({
            id : 'custpage_customerpayment_button',
            label : 'Accept Customer Payment',
            functionName: "customerpayment"
        });
        form.addButton({
            id : 'custpage_customerdeposit_button',
            label : 'Customer Deposit',
            functionName: "customerdeposit"
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
        field_customer.updateLayoutType({
            layoutType: ui.FieldLayoutType.STARTROW
        });

        var trandate_start = context.request.parameters.custpage_trandate_start;
        var field_date_start = form.addField({
            id : 'custpage_trandate_start',
            type : ui.FieldType.DATE,
            label : '實際交易日期起:',
            container: 'filter1'          
        });
        field_date_start.defaultValue = trandate_start;
        field_date_start.updateLayoutType({
            layoutType: ui.FieldLayoutType.MIDROW
        });

        var trandate_end = context.request.parameters.custpage_trandate_end
        var field_date_end = form.addField({
            id : 'custpage_trandate_end',
            type : ui.FieldType.DATE,
            label : '實際交易日期迄:',
            container: 'filter1'          
        });
        field_date_end.defaultValue = trandate_end;
        field_date_end.updateLayoutType({
            layoutType: ui.FieldLayoutType.ENDROW
        });
        
        //var status = context.request.parameters.custpage_status
        // var field_status = form.addField({
        //     id : 'custpage_status',
        //     type : ui.FieldType.SELECT,
        //     label : '狀態:',
        //     container: 'filter1',           
        // });           
        // field_status.addSelectOption({value : '待銷帳', text: '待銷帳'});
        // field_status.addSelectOption({value : '已銷帳', text: '已銷帳'});
        // field_status.defaultValue = status; 
        
        var subsidiary = context.request.parameters.custpage_subsidiary
        var field_subsidiary = form.addField({
            id : 'custpage_subsidiary',
            type : ui.FieldType.SELECT,
            label : 'Subsidiary:',
            container: 'filter1',           
        });
        field_subsidiary.addSelectOption({value : 'all', text: '-ALL-'});               
        field_subsidiary.addSelectOption({value : '博弘雲端科技股份有限公司', text: '博弘雲端科技股份有限公司'});
        field_subsidiary.addSelectOption({value : '宏庭科技股份有限公司', text: '宏庭科技股份有限公司'}); 
        field_subsidiary.defaultValue = subsidiary;
        field_subsidiary.updateLayoutType({
            layoutType: ui.FieldLayoutType.STARTROW
        });
        
        var account_L=Account_List();
        var account = context.request.parameters.custpage_account
        var field_account = form.addField({
            id : 'custpage_account',
            type : ui.FieldType.SELECT,
            label : 'ACCOUNT:',
            container: 'filter1',           
        });
        field_account.addSelectOption({value : 'all', text: '-ALL-'});
        var bank_account='';
        account_L.forEach(function (data){
            if(subsidiary=='all'){
                field_account.addSelectOption({value : data.account_id, text: data.account_n});
            }else{
                if(subsidiary==data.subsidiary){
                    field_account.addSelectOption({value : data.account_id, text: data.account_n}); 
                }
            }
            if(data.account_id==account){
                bank_account=data.bank_account;
            }
            
        });      
        field_account.defaultValue = account;
        field_account.updateLayoutType({
            layoutType: ui.FieldLayoutType.MIDROW
        });


        var invoice_trandate_strat = context.request.parameters.custpage_invoice_trandate_strat
        var field_invoice_trandate_strat=form.addField({
            id: 'custpage_invoice_trandate_strat',
            type: ui.FieldType.DATE,
            label: '發票交易日期起:',
            container: 'filter1'
        });
        field_invoice_trandate_strat.updateLayoutType({
            layoutType: ui.FieldLayoutType.OUTSIDEBELOW
        });
        field_invoice_trandate_strat.defaultValue = invoice_trandate_strat;

        var invoice_trandate_end = context.request.parameters.custpage_invoice_trandate_end  
        var field_invoice_trandate_end=form.addField({
            id: 'custpage_invoice_trandate_end',
            type: ui.FieldType.DATE,
            label: '發票交易日期迄:',
            container: 'filter1'
        });
        field_invoice_trandate_end.updateLayoutType({
            layoutType: ui.FieldLayoutType.OUTSIDEBELOW
        });
        field_invoice_trandate_end.defaultValue = invoice_trandate_end;

        var field_select_cus = form.addField({ 
            id: 'custpage_select_cus', 
            label: '目前選擇客戶', 
            type: ui.FieldType.TEXT 
        });
        field_select_cus.defaultValue = customer;
        field_select_cus.updateLayoutType({
            layoutType: ui.FieldLayoutType.MIDROW
        });

        var newtab = form.addTab({ id : 'custpage_reconcilitab', label : '對帳清單' });
        var field_select_reconcili_amt = form.addField({ 
            id: 'custpage_select_reconcili_amt', 
            label: '對帳總金額', 
            type: ui.FieldType.FLOAT,
            container: 'custpage_reconcilitab' 
        });
        field_select_reconcili_amt.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
        var field_select_reconcili_datacount = form.addField({ 
            id: 'custpage_select_reconcili_datacount', 
            label: '資料總比數', 
            type: ui.FieldType.INTEGER,
            container: 'custpage_reconcilitab' 
        }); 
        field_select_reconcili_datacount.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });     
        var field_select_reconcili_tdatacount = form.addField({ 
            id: 'custpage_select_reconcili_tdatacount', 
            label: '已對應客戶資料筆數', 
            type: ui.FieldType.INTEGER,
            container: 'custpage_reconcilitab' 
        });
        field_select_reconcili_tdatacount.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE }); 
        var field_select_reconcili_fdatacount = form.addField({ 
            id: 'custpage_select_reconcili_fdatacount', 
            label: '未對應客戶資料筆數', 
            type: ui.FieldType.INTEGER,
            container: 'custpage_reconcilitab' 
        });
        field_select_reconcili_fdatacount.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });        
        //field_select_reconcili_amt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        
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
       
        var solist_query_id_link = cuslist_reconcili.addField({id: "custpage_id_link",type: ui.FieldType.TEXTAREA,label: "ID"});
        solist_query_id_link.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
        var solist_query_id = cuslist_reconcili.addField({id: "custpage_id",type: ui.FieldType.TEXT,label: "ID"});
        solist_query_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        var solist_query_source = cuslist_reconcili.addField({id: "custpage_source",type: ui.FieldType.TEXT,label: "資料來源"});
        solist_query_source.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL }); 
        var solist_query_company_account = cuslist_reconcili.addField({id: "custpage_company_account",type: ui.FieldType.TEXT,label: "公司銀行帳戶"});
        solist_query_company_account.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });         
        var solist_query_trandate = cuslist_reconcili.addField({id: "custpage_trandate",type: ui.FieldType.DATE,label: "實際交易日期"});
        solist_query_trandate.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });            
        var solist_query_customer = cuslist_reconcili.addField({id: "custpage_customer",type: ui.FieldType.TEXT,label: "CUSTOMER"});
        solist_query_customer.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
        var solist_query_customer_name = cuslist_reconcili.addField({id: "custpage_customer_name",type: ui.FieldType.TEXT,label: "CUSTOMER NAME"});
        solist_query_customer_name.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_currency = cuslist_reconcili.addField({id: "custpage_currency",type: ui.FieldType.TEXT,label: "幣別"});
        solist_query_currency.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });     
        var solist_query_deposit_amount = cuslist_reconcili.addField({id: "custpage_deposit_amount",type: ui.FieldType.FLOAT,label: "存入金額"});
        solist_query_deposit_amount.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_balance = cuslist_reconcili.addField({id: "custpage_balance",type: ui.FieldType.FLOAT,label: "剩餘對帳金額"});
        solist_query_balance.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_handling_fee = cuslist_reconcili.addField({id: "custpage_handling_fee",type: ui.FieldType.FLOAT,label: "手續費"});
        solist_query_handling_fee.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_bank_code = cuslist_reconcili.addField({id: "custpage_bank_code",type: ui.FieldType.TEXT,label: "BANK CODE"});
        solist_query_bank_code.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_bank_account = cuslist_reconcili.addField({id: "custpage_bank_account",type: ui.FieldType.TEXT,label: "BANK ACCOUNT"});
        solist_query_bank_account.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_summary = cuslist_reconcili.addField({id: "custpage_summary",type: ui.FieldType.TEXT,label: "摘要"});
        solist_query_summary.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY }); 
        var solist_query_memo = cuslist_reconcili.addField({id: "custpage_memo",type: ui.FieldType.TEXT,label: "MEMO"});
        solist_query_memo.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_query_reconciled = cuslist_reconcili.addField({id: "custpage_reconciled",type: ui.FieldType.TEXT,label: "狀態"});
        solist_query_reconciled.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
       
        var reconcili_data=search_reconciliation_data(customer,'待銷帳',trandate_start,trandate_end,bank_account,subsidiary);
        var j = 0,t_data=0,f_data=0;
        reconcili_data.forEach(function (result){
            var uu = url.resolveRecord({ recordType: result.recordtype, recordId: result.id, isEditMode: false });        
            cuslist_reconcili.setSublistValue({
                id: 'custpage_id_link',
                line: j,
                value:'<a target="_blank" href="' + uu + '">' + result.id + '</a>'
            });
            cuslist_reconcili.setSublistValue({
                id: 'custpage_id',
                line: j,
                value:result.id
            });
            if(result.source){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_source',
                    line: j,
                    value: result.source
                });
            }
            if(result.company_account){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_company_account',
                    line: j,
                    value: result.company_account
                });
            }            
            if(result.customer){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_customer',
                    line: j,
                    value: result.customer
                });
                t_data++;
            }else{
                f_data++; 
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
            if(result.currency){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_currency',
                    line: j,
                    value: result.currency
                });
            }
            if(result.deposit_amount){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_deposit_amount',
                    line: j,
                    value: result.deposit_amount
                });
            }  
            if(result.balance){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_balance',
                    line: j,
                    value: result.balance
                });
            }
            if(result.handling_fee){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_handling_fee',
                    line: j,
                    value: result.handling_fee
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
            if(result.reconciled){
                cuslist_reconcili.setSublistValue({
                    id: 'custpage_reconciled',
                    line: j,
                    value: result.reconciled
                });
            }                       
            j++
        });
        field_select_reconcili_datacount.defaultValue = j;
        field_select_reconcili_tdatacount.defaultValue = t_data;
        field_select_reconcili_fdatacount.defaultValue = f_data;



        
        var newtab2 = form.addTab({ id : 'custpage_invoicetab', label : '客戶發票清單' });   
        var field_cuslist_invoice_amt = form.addField({ 
            id: 'custpage_cuslist_invoice_amt', 
            label: '銷帳總金額', 
            type: ui.FieldType.FLOAT,
            container: 'custpage_invoicetab' 
        });  
        field_cuslist_invoice_amt.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
        var field_cuslist_datacount = form.addField({ 
            id: 'custpage_cuslist_datacount', 
            label: '已選資料比數', 
            type: ui.FieldType.INTEGER,
            container: 'custpage_invoicetab' 
        }); 
        field_cuslist_datacount.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE }); 

        var field_cuslist_fee = form.addField({ 
            id: 'custpage_cuslist_fee', 
            label: '手續費', 
            type: ui.FieldType.FLOAT,
            container: 'custpage_invoicetab' 
        });  

        var invoice_picks = context.request.parameters.custpage_invoice_picks;
        var field_invoice_picks = form.addField({
            id : 'custpage_invoice_picks',
            label : '選擇發票清單',
            type : ui.FieldType.TEXTAREA,
            container: 'custpage_invoicetab'
        });
        field_invoice_picks.defaultValue = invoice_picks==''?'{}':invoice_picks;
        field_invoice_picks.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        var selectOptions = form.addField({
            id : 'custpage_pageid',
            label : '頁數',
            type : ui.FieldType.SELECT,
            container: 'custpage_invoicetab'
        });
        selectOptions.updateLayoutType({
            layoutType: ui.FieldLayoutType.OUTSIDEBELOW
        });
        var pageId = parseInt("0");

        if(context.request.parameters.custpage_pageid){
            pageId = context.request.parameters.custpage_pageid;
        }
        var pagesize = 50;
        // var retrieveSearch = runSearch(pagesize, customers, 'SalesOrd');
        var invoice_data=search_invoice_data(pagesize,pageId,customer,invoice_trandate_strat,invoice_trandate_end);
     
        
        var pageCount = Math.ceil(invoice_data.AllCount / pagesize);
        log.debug("pageCount",pageCount)

        if (!pageId || pageId == '' || pageId < 0)
            pageId = 0;
        else if (pageId >= pageCount)
            pageId = pageCount - 1;
    
        for(i = 0; i < pageCount; i++){
            if(i == pageId){
                selectOptions.addSelectOption({
                    value :i,
                    text : ((i * pagesize) + 1) + ' - ' + ((i + 1) * pagesize),
                    isSelected : true
                });
            }else{
                selectOptions.addSelectOption({
                    value : i,
                    text : ((i * pagesize) + 1) + ' - ' + ((i + 1) * pagesize)
                });
            }
        }

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
        cuslist_invoice.addButton({
            id: 'custpage_invoice_select_all',
            label: '全選',
            functionName: 'select_all'
        })
        cuslist_invoice.addButton({
            id: 'custpage_invoice_cancel_all',
            label: '取消全選',
            functionName: 'cancel_all'
        })
     
        var solist_invoice_id = cuslist_invoice.addField({id: "custpage_invoice_id",type: ui.FieldType.TEXT,label: "ID"});
        solist_invoice_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN }); 
        var solist_invoice_trandate = cuslist_invoice.addField({id: "custpage_invoice_trandate",type: ui.FieldType.DATE,label: "交易日期"});
        solist_invoice_trandate.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });            
        var solist_invoice_tranid = cuslist_invoice.addField({id: "custpage_invoice_tranid",type: ui.FieldType.TEXT,label: "交易單號"});
        solist_invoice_tranid.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_customer_name = cuslist_invoice.addField({id: "custpage_invoice_customer_name",type: ui.FieldType.TEXT,label: "CUSTOMER NAME"});
        solist_invoice_customer_name.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });     
        var solist_invoice_currency = cuslist_invoice.addField({id: "custpage_invoice_currency",type: ui.FieldType.TEXT,label: "幣別"});
        solist_invoice_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });    
        var solist_invoice_amount = cuslist_invoice.addField({id: "custpage_invoice_amount",type: ui.FieldType.FLOAT,label: "Amount"});
        solist_invoice_amount.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var solist_invoice_amountremaining = cuslist_invoice.addField({id: "custpage_invoice_amountremaining",type: ui.FieldType.FLOAT,label: "Amount Remaining"});
        solist_invoice_amountremaining.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED }); 
        var solist_invoice_paymentamount = cuslist_invoice.addField({id: "custpage_invoice_paymentamount",type: ui.FieldType.FLOAT,label: "銷帳金額"});
        //solist_invoice_paymentamount.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });     
    
        var j = 0;
        invoice_data.list.forEach(function (result){
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
            if(result.currency){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_currency',
                    line: j,
                    value: result.currency
                });
            }
            if(result.amount){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_amount',
                    line: j,
                    value: result.amount
                });
            }      
            if(result.amountremaining){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_amountremaining',
                    line: j,
                    value: result.amountremaining
                });
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_paymentamount',
                    line: j,
                    value: result.amountremaining
                });
            }                      
            j++
        });
        field_cuslist_datacount.defaultValue = j;


        form.clientScriptModulePath = "./reconciliation_ui_cs.js";        
    }
   
    function DateNow(){

        var date = new Date(); 
        var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}) 
        // log.debug('newdateString',newdateString.substr(0,newdateString.indexOf(' ')))
        
        // return  newdateString
        return  newdateString.substr(0,newdateString.indexOf(' '))   
    }

    function search_reconciliation_data(customer,status,trandate_start,trandate_end,bank_account,subsidiary){

        var filter=[["custrecord_recon_reconciled","is",status]];
        if(customer!=''&&customer!=null&&customer!=undefined){
            filter.push("AND");
            filter.push(["custrecord_recon_customer","anyof","@NONE@",customer]);
        }
        if(trandate_start!=''&&trandate_start!=null&&trandate_start!=undefined){
            filter.push("AND");
            filter.push(["custrecord_recon_trandate","onorafter",trandate_start]);
        }
        if(trandate_end!=''&&trandate_end!=null&&trandate_end!=undefined){
            filter.push("AND");
            filter.push(["custrecord_recon_trandate","onorbefore",trandate_end]);
        }
        if(bank_account!=''&&bank_account!=null&&bank_account!=undefined){
            filter.push("AND");
            filter.push(["custrecord_recon_company_account","is",bank_account]);
        }
        if(subsidiary!=''&&subsidiary!=null&&subsidiary!=undefined&&subsidiary!='all'){
            filter.push("AND");
            var account_filter=[];
            var account_L=Account_List();         
            account_L.forEach(function (data){               
                if(subsidiary==data.subsidiary){
                    account_filter.push("OR");
                    account_filter.push(["custrecord_recon_company_account","is",data.bank_account]);                  
                }
            });
            account_filter.splice(0, 1);
            filter.push(account_filter);          
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
               search.createColumn({name: "custrecord_recon_balance", label: "剩餘對帳金額"}),
               search.createColumn({name: "custrecord_handling_fee", label: "手續費"}),            
               search.createColumn({name: "custrecord_recon_summary", label: "摘要"}),
               search.createColumn({name: "custrecord_recon_memo", label: "Memo"}),
               search.createColumn({name: "custrecord_recon_bank_code", label: "Bank Code"}),
               search.createColumn({name: "custrecord_recon_bank_account", label: "Bank Account"}),
               search.createColumn({name: "custrecord_recon_currency", label: "幣別"}),
               search.createColumn({name: "custrecord_recon_source", label: "資料來源"}),
               search.createColumn({name: "custrecord_recon_reconciled", label: "Reconciled"}),
               search.createColumn({name: "custrecord_recon_company_account", label: "公司銀行帳戶"}),
            ]
         });
      
         var data=[];
         customrecord_reconciliation_dataSearchObj.run().each(function(result){
            data.push({
                recordtype:result.recordType,
                id:result.id,
                customer:result.getValue('custrecord_recon_customer'),
                customer_name:result.getText('custrecord_recon_customer'),
                trandate:result.getValue('custrecord_recon_trandate'),
                deposit_amount:result.getValue('custrecord_recon_deposit_amount'),
                balance:result.getValue('custrecord_recon_balance'),
                handling_fee:result.getValue('custrecord_handling_fee'), 
                summary:result.getValue('custrecord_recon_summary'),
                memo:result.getValue('custrecord_recon_memo'),
                bank_code:result.getValue('custrecord_recon_bank_code'),
                bank_account:result.getValue('custrecord_recon_bank_account'),
                currency:result.getText('custrecord_recon_currency'),
                source:result.getText('custrecord_recon_source'),
                reconciled:result.getValue('custrecord_recon_reconciled'),
                company_account:result.getValue('custrecord_recon_company_account'),
            });
            return true;
         });

         return data;

    }
    function search_invoice_data(pagesize,pageId,customer,trandate_start,trandate_end){
        if(customer==''){
            return {AllCount:0,list:[]};;
        }
        var filter=  [
            ["mainline","is","T"],
            "AND", 
            [["name","anyof",customer],"OR",["customer.custentity_parent","anyof",customer]],
            "AND", 
            ["status","anyof","CustInvc:A"]
         ];
        if(trandate_start!=''&&trandate_start!=null&&trandate_start!=undefined){
            filter.push("AND");
            filter.push(["trandate","onorafter",trandate_start]);
        }
        if(trandate_end!=''&&trandate_end!=null&&trandate_end!=undefined){
            filter.push("AND");
            filter.push(["trandate","onorbefore",trandate_end]);
        }
        var transactionSearchObj = search.create({
            type: "invoice",
            filters:filter,
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
               search.createColumn({name: "currency", label: "Currency"}),           
               search.createColumn({name: "fxamount", label: "Amount"}),
               search.createColumn({name: "fxamountremaining", label: "Amount Remaining"}),
               search.createColumn({name: "memomain", label: "Memo (Main)"}),
               search.createColumn({name: "custbody1", label: "GUI/VAT"}),
               search.createColumn({name: "custbody10", label: "GUI/VAT Date"}),
               search.createColumn({name: "custbody_invoice_remarks", label: "發票備註"})
            ]
         });
         var AllCount = transactionSearchObj.runPaged().count;
         var data={AllCount:AllCount,list:[]}; 
         if(AllCount>0){
            transactionSearchObj.runPaged({pageSize : pagesize}).fetch({
                index : pageId
            }).data.forEach(function (result){    
                data.list.push({
                    id:result.id,             
                    trandate:result.getValue('trandate'),
                    tranid:result.getValue('tranid'),
                    name:result.getText('entity'),             
                    currency:result.getText('currency'),          
                    amount:result.getValue('fxamount'),            
                    amountremaining:result.getValue('fxamountremaining'),
                    memo:result.getValue('memomain'),
                    vat:result.getValue('custbody1'),
                    vat_date:result.getValue('custbody10'),
                    remark:result.getValue('custbody_invoice_remarks'),     
                });
            });
         } 
      
         
        //  transactionSearchObj.run().each(function(result){
        //     data.list.push({
        //         id:result.id,             
        //         trandate:result.getValue('trandate'),
        //         tranid:result.getValue('tranid'),
        //         name:result.getText('entity'),
        //         status:result.getText('statusref'),
        //         currency:result.getText('currency'),
        //         account:result.getValue({
        //             name: "accountnumber",
        //             join: "customer",
        //             label: "Account"
        //         }),
        //         amount:result.getValue('fxamount'),
        //         amountpaid:result.getValue('fxamountpaid'),
        //         amountremaining:result.getValue('fxamountremaining'),
        //     });
        //     return true;
        //  }); 
        log.debug("data",data)
         return data;
    }
    function Account_List(){
        var AL=[];
        AL.push({account_n:'110309 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD花旗營業部 45006',account_id:'1374',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345006'});
        AL.push({account_n:'110316 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - USD花旗營業部 45219',account_id:'1375',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345219'});
        AL.push({account_n:'110317 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - HKD花旗營業部 45227',account_id:'1376',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345227'});
        AL.push({account_n:'110318 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - CNY花旗營業部 45235',account_id:'1377',subsidiary:'博弘雲端科技股份有限公司',bank_account:'5831345235'});
        AL.push({account_n:'110302 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD玉山三重 16686',account_id:'227',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0325940016686'});
        AL.push({account_n:'110303 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD玉山內湖 33896',account_id:'228',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0462940033896'});
        AL.push({account_n:'110311 現金及約當現金 : 銀行存款 : 博弘銀行存款-外活 - USD玉山重新 00199',account_id:'323',subsidiary:'博弘雲端科技股份有限公司',bank_account:'0325441000199'});
        AL.push({account_n:'110304 現金及約當現金 : 銀行存款 : 博弘銀行存款-活存 - TWD土銀西湖 15881',account_id:'229',subsidiary:'博弘雲端科技股份有限公司',bank_account:'120001015881'});
        AL.push({account_n:'110344 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD花旗 44001',account_id:'1432',subsidiary:'宏庭科技股份有限公司',bank_account:'5833444001'});
        AL.push({account_n:'110345 現金及約當現金 : 銀行存款 : 宏庭銀行存款-外活 - USD花旗 44206',account_id:'1433',subsidiary:'宏庭科技股份有限公司',bank_account:'5833444206'});
        AL.push({account_n:'110331 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD土銀西湖 15961',account_id:'427',subsidiary:'宏庭科技股份有限公司',bank_account:'120001015961'});
        AL.push({account_n:'110341 現金及約當現金 : 銀行存款 : 宏庭銀行存款-外活 - USD土銀西湖 10215',account_id:'431',subsidiary:'宏庭科技股份有限公司',bank_account:'120101010215'});
        AL.push({account_n:'110332 現金及約當現金 : 銀行存款 : 宏庭銀行存款-活存 - TWD玉山三重 15809',account_id:'428',subsidiary:'宏庭科技股份有限公司',bank_account:'0325940015809'});


       return AL;
    }
    return {
        onRequest: onRequest
    }
});
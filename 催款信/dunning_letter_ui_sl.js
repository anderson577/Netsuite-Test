/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/file', 'N/log', 'N/ui/serverWidget', 'N/runtime', 'N/record', 'N/url', 'N/format', 'N/config', 'N/task', 'N/render'], 

function(search, file, log, ui, runtime, record, url, format, config, task, render) {

    var Use_BU='';
    function onRequest(context) {

        var request  = context.request;
        var response = context.response;
        // log.debug('context',context)                             

        Use_BU=runtime.getCurrentScript().getParameter({name: 'custscript_use_bu'})
        
        if (request.method === 'GET'){
            
            var form = ui.createForm({
                title: Use_BU+'催款信系統'
            });         

            layoutForm(form);

            response.writePage(form);

        }else if(request.method === 'POST'){
            var form = ui.createForm({
                title: Use_BU+'催款信系統'
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
     

        form.clientScriptModulePath = "./dunning_letter_ui_cs.js";        
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
            label : '預覽',
            functionName: "view"
        });
        form.addButton({
            id : 'custpage_customerdeposit_button',
            label : '寄送',
            functionName: "send"
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

      
        var field_recipients = form.addField({
            id : 'custpage_recipients',
            type : ui.FieldType.MULTISELECT,
            label : '收件聯絡人:',
            container: 'filter1'           
        });
        var recipients_L=Search_Contact(customer);
        log.debug('recipients_L',recipients_L);
        recipients_L.forEach(function (data){
            field_recipients.addSelectOption({
                value : data.email,
                text : data.name
            });
        });

        var field_invoice_recipients = form.addField({
            id : 'custpage_invoice_recipients',
            type : ui.FieldType.MULTISELECT,
            label : 'Billing Portal發票收件聯絡人:',
            container: 'filter1'           
        });
        var invoice_recipients_L=Search_invoice_Contact(customer);
        log.debug('invoice_recipients_L',invoice_recipients_L);
        invoice_recipients_L.forEach(function (data){
            field_invoice_recipients.addSelectOption({
                value : data.email,
                text : data.name
            });
        });
       
        
     
        var invoice_data=search_invoice_data(customer);
        var newtab = form.addTab({ id : 'custpage_invoicetab', label : '客戶發票清單' });   
    

        var cuslist_invoice = form.addSublist({
            id : "custpage_cuslist_invoice",
            type : ui.SublistType.LIST,   //INLINEEDITOR,
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
     
        var solist_invoice_id_link = cuslist_invoice.addField({id: "custpage_invoice_id_link",type: ui.FieldType.TEXTAREA,label: "ID"});
        solist_invoice_id_link.updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });
        var solist_invoice_id = cuslist_invoice.addField({id: "custpage_invoice_id",type: ui.FieldType.TEXT,label: "ID"});
        solist_invoice_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });  
        var solist_invoice_trandate = cuslist_invoice.addField({id: "custpage_invoice_trandate",type: ui.FieldType.DATE,label: "交易日期"});
        solist_invoice_trandate.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_duedate = cuslist_invoice.addField({id: "custpage_invoice_duedate",type: ui.FieldType.DATE,label: "Due Date"});
        solist_invoice_duedate.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });                       
        var solist_invoice_tranid = cuslist_invoice.addField({id: "custpage_invoice_tranid",type: ui.FieldType.TEXT,label: "交易單號"});
        solist_invoice_tranid.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_customer_name = cuslist_invoice.addField({id: "custpage_invoice_customer_name",type: ui.FieldType.TEXT,label: "CUSTOMER NAME"});
        solist_invoice_customer_name.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_customer_id = cuslist_invoice.addField({id: "custpage_invoice_customer_id",type: ui.FieldType.TEXT,label: "CUSTOMER ID"});
        solist_invoice_customer_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });          
        var solist_invoice_currency = cuslist_invoice.addField({id: "custpage_invoice_currency",type: ui.FieldType.TEXT,label: "幣別"});
        solist_invoice_currency.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });    
        var solist_invoice_amount = cuslist_invoice.addField({id: "custpage_invoice_amount",type: ui.FieldType.FLOAT,label: "Amount"});
        solist_invoice_amount.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_vat = cuslist_invoice.addField({id: "custpage_invoice_vat",type: ui.FieldType.TEXT,label: "發票號碼"});
        solist_invoice_vat.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_vat_date = cuslist_invoice.addField({id: "custpage_invoice_vat_date",type: ui.FieldType.DATE,label: "發票日期"});
        solist_invoice_vat_date.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_department = cuslist_invoice.addField({id: "custpage_invoice_department",type: ui.FieldType.TEXT,label: "Department"});
        solist_invoice_department.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
        var solist_invoice_class = cuslist_invoice.addField({id: "custpage_invoice_class",type: ui.FieldType.TEXT,label: "Class"});
        solist_invoice_class.updateDisplayType({ displayType: ui.FieldDisplayType.READONLY });
      

        var j = 0;
        invoice_data.forEach(function (result){
            var uu = url.resolveRecord({ recordType: result.recordtype, recordId: result.id, isEditMode: false });   
            cuslist_invoice.setSublistValue({
                id: 'custpage_invoice_id_link',
                line: j,
                value: '<a target="_blank" href="' + uu + '">' + result.id + '</a>'
            }); 
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
            if(result.duedate){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_duedate',
                    line: j,
                    value: result.duedate
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
            if(result.cus_id){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_customer_id',
                    line: j,
                    value: result.cus_id
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
            if(result.vat){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_vat',
                    line: j,
                    value: result.vat
                });             
            }  
            if(result.vat_date){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_vat_date',
                    line: j,
                    value: result.vat_date
                });             
            }
            if(result.department){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_department',
                    line: j,
                    value: result.department
                });             
            }    
            if(result.class){
                cuslist_invoice.setSublistValue({
                    id: 'custpage_invoice_class',
                    line: j,
                    value: result.class
                });             
            }                          
            j++
        });

       

        form.clientScriptModulePath = "./dunning_letter_ui_cs.js";        
    }
   
    function DateNow(){

        var date = new Date(); 
        var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}) 
        // log.debug('newdateString',newdateString.substr(0,newdateString.indexOf(' ')))
        
        // return  newdateString
        return  newdateString.substr(0,newdateString.indexOf(' '))   
    }

    function search_invoice_data(cus){
        if(cus=='')return [];
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
                ["department","anyof","1"], 
                "AND", 
                ["subsidiary","anyof","1"],
                "AND", 
                ["name","anyof",cus]
            ],
            columns:
            [
                search.createColumn({name: "trandate",label: "Date"}),
                 search.createColumn({name: "duedate", label: "Due Date/Receive By"}),
                 search.createColumn({name: "type", label: "Type"}),
                 search.createColumn({name: "tranid",label: "Document Number",sort: search.Sort.DESC,}),
                 search.createColumn({name: "entity", label: "Name"}),
                 search.createColumn({name: "statusref", label: "Status"}),
                 search.createColumn({name: "trackingnumbers", label: "Tracking Numbers"}),
                 search.createColumn({name: "memo", label: "Memo"}),
                 search.createColumn({name: "currency", label: "Currency"}),
                 search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                 search.createColumn({name: "custbody1", label: "GUI/VAT"}),
                 search.createColumn({name: "custbody10", label: "GUI/VAT Date"}),
                 search.createColumn({
                    name: "altname",
                    join: "customer",
                    label: "Name"
                 }),
                 search.createColumn({name: "department", label: "BU"}),
                 search.createColumn({name: "classnohierarchy", label: "Class (no hierarchy)"}),
                 search.createColumn({name: "salesrep", label: "Sales Rep"})
            ]
         });
         var searchResultCount = transactionSearchObj.runPaged().count;
         log.debug("transactionSearchObj result count",searchResultCount);
         var data=[]; 
         transactionSearchObj.run().each(function(result){
            data.push({
                recordtype:result.recordType,
                id:result.id,           
                trandate:result.getValue('trandate'),
                duedate:result.getValue('duedate'),
                tranid:result.getValue('tranid'),
                name:result.getText('entity'),
                cus_id:result.getValue('entity'),             
                currency:result.getText('currency'),          
                amount:result.getValue('fxamount'),
                vat:result.getValue('custbody1'),
                vat_date:result.getValue('custbody10'),
                department:result.getText('department'),
                class:result.getText('classnohierarchy'),
               
            });
            return true;
         });
         
         return data;
    }
    function Search_Contact(cus){
        if(cus=='')return [];
        var contactSearchObj = search.create({
            type: "contact",
            filters:
            [              
               ["company","anyof",cus],
               "AND",
               ["email","isnotempty",""]
            ],
            columns:
            [
               search.createColumn({
                  name: "entityid",
                  sort: search.Sort.ASC,
                  label: "Name"
               }),            
               search.createColumn({name: "email", label: "Email"})             
            ]
         });
         var searchResultCount = contactSearchObj.runPaged().count;
         log.debug("contactSearchObj result count",searchResultCount);
         var contact_L=[];
         var ind=0;
         contactSearchObj.run().each(function(result){
            contact_L.push({
                email:result.getValue('email')+'#@'+ind,
                name:(ind+1)+'.'+result.getValue({
                    name: "entityid",
                    sort: search.Sort.ASC,
                    label: "名稱"
                 })+' - '+result.getValue('email')
            });
            ind++;
            return true;
         });
         
      

         return contact_L;
    }

    function Search_invoice_Contact(cus){        
      
        if(cus=='')return [];
        var contactSearchObj = search.create({
            type: "customer",
            filters:
            [              
               ["internalid","anyof",cus],           
            ],
            columns:
            [                
               search.createColumn({name: "custentity_invoice_groups_email", label: "Groups Email"})             
            ]
         });
         var searchResultCount = contactSearchObj.runPaged().count;
         log.debug("contactSearchObj result count",searchResultCount);
         var contact_L=[];
         var ind=0;
         contactSearchObj.run().each(function(result){
            var groups_email=result.getValue({name: "custentity_invoice_groups_email", label: "Groups Email"});
            if(groups_email!=''){
                groups_email=groups_email.split(',');
                for(var i=0;i<groups_email.length;i++){
                    contact_L.push({
                        email:groups_email[i]+'#@'+ind,
                        name:(ind+1)+'.'+groups_email[i]
                    });
                    ind++;
                }            
            }
          
            return true;
         });
         
      

         return contact_L;
    }
    return {
        onRequest: onRequest
    }
});
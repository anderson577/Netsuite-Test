/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    var html,div,img,bar;
    function pageInit(context) {
        var url=window.location.href;
        if(url.indexOf('unlayered=T')==-1 && url.indexOf('script=')!=-1){
            window.location.replace(url+'&unlayered=T');
        }else{
            html=document.getElementsByTagName("html")[0];
            div = document.createElement("div");
            div.id='Loading_div';
            div.setAttribute("style", "width:100%;height:100%;top:0;left:0;position:fixed;display:block;opacity:0.7;background-color:#fff;z-index:99;text-align:center;");       
            img = document.createElement("img");
            img.setAttribute("style", "position:absolute;top:45%;left:43%;z-index:100;width:10%;");       
            img.setAttribute("src", "https://4631466.app.netsuite.com/core/media/media.nl?id=338&c=4631466&h=CGENO9ikZrqmPg2-0PauwtEcJhGn_R66Kc1IWbLx0QsEJHoS");  
            img.setAttribute("alt", "Loading...");  
            div.appendChild(img);
            div.setAttribute("style", "pointer-events: none;");
            div.setAttribute("style", "visibility: hidden;");    
            bar=document.getElementById('ns_navigation');
            html.appendChild(div);        
        }    
    }
    function filter(context) {        
        window.onbeforeunload = null;
        var current_rec = currentRecord.get();
      

      
        // document.getElementById("pickdata").value = JSON.stringify(line);
        document.getElementById("main_form").submit();
    }
    function fieldChanged(context) { 
        if (context.fieldId == 'custpage_reconcili_select') {

            window.onbeforeunload = null;          
         

            var current_rec = context.currentRecord;
            var select = current_rec.getCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select'});
            var index=current_rec.getCurrentSublistIndex({sublistId: 'custpage_cuslist_reconcili'});
            var customer = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_customer',line:index });
            if(customer!=''){ 
              
                var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_reconcili' })
                var customer_ck='';
                for (var i = 0; i < linecount; i++) {
                    if(i!=index){
                        var customer_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_customer',line:i });
                        var select_L = current_rec.getSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',line:i });
                        if(customer_L!=''&&select_L==true)customer_ck=customer_L;
                    }
                }
                if(select==true){
                    console.log('customer_ck',customer_ck);
                    if(customer_ck==''){
                        document.getElementById("custpage_select_cus").value = customer;
                        load_invoice_data(current_rec,customer);                        

                    }else{
                        if(customer_ck!=customer){
                            alert('請選擇相同客戶!');
                            current_rec.setCurrentSublistValue({ sublistId: 'custpage_cuslist_reconcili', fieldId: 'custpage_reconcili_select',value:false});
                        }
                    }                  
                         
                }else{
                    if(customer_ck==''){
                        document.getElementById("custpage_select_cus").value = '';
                    }  
                }              
                
            }
           
           
            
        }        
    }
    function load_page(){
        div.setAttribute("style", "visibility: visible;"); 
        bar.setAttribute("style", "pointer-events: none;");  
    }

    function close_page(){    
        div.setAttribute("style", "visibility: hidden;"); 
        bar.setAttribute("style", "pointer-events: auto;");
    }
    function load_invoice_data(current_rec,customer){
      
        var linecount = current_rec.getLineCount({ sublistId: 'custpage_cuslist_invoice' })
        for (var i = 0; i < linecount; i++) {
            current_rec.removeLine({sublistId:'custpage_cuslist_invoice',line:0,ignoreRecalc:true});
        }
        var invoice_data=search_invoice_data(customer);
        
        invoice_data.forEach(function (result){
          
            current_rec.selectNewLine({sublistId: 'custpage_cuslist_invoice'});
            current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_id',value: result.id,ignoreFieldChange: true});               
            if(result.trandate){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_trandate',value:  new Date(result.trandate) ,ignoreFieldChange: true});                
            }
            if(result.tranid){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_tranid',value: result.tranid,ignoreFieldChange: true});                
            }
            if(result.name){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_customer_name',value: result.name,ignoreFieldChange: true});            
            }
            if(result.status){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_status',value: result.status,ignoreFieldChange: true});             
            } 
            if(result.currency){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_currency',value: result.currency,ignoreFieldChange: true});             
            }    
            if(result.account){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_account',value: result.account,ignoreFieldChange: true});             
            }    
            if(result.amount){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amount',value: parseFloat(result.amount),ignoreFieldChange: true});               
            }
            if(result.amountpaid){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountpaid',value: parseFloat(result.amountpaid),ignoreFieldChange: true});             
            }  
            if(result.amountremaining){
                current_rec.setCurrentSublistValue({sublistId: 'custpage_cuslist_invoice', fieldId: 'custpage_invoice_amountremaining',value: parseFloat(result.amountremaining),ignoreFieldChange: true});              
            }
          
            current_rec.commitLine({sublistId: 'custpage_cuslist_invoice'});                      
           
        });


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
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        filter:filter,      
    };
});
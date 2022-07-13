/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    function pageInit(context) {

    }

    function filter() {
        window.onbeforeunload = null;
        var current_rec = currentRecord.get();
        if(current_rec.getValue('custpage_cl_subsidiary') == ''){
            dialog.alert({
                title: '警告',
                message: "查詢時，子公司不可為空值，請重新輸入。"
            });   
        }else{
            document.getElementById("custpage_cl_action").value = "filter";
            document.getElementById("main_form").submit();   
        }
             
    }

    function executetd() {
        window.onbeforeunload = null;
        var rec = currentRecord.get();  
        
        var linecount = rec.getLineCount({sublistId: 'custpage_cl_solist'})
        var line = []
        var idarr = []
        
        for (var i = 0; i < linecount; i++) {                    
            if(rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_select', line: i,}) == true){
                line.push({
                    cus: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_customer', line: i,}),
                    cus_id: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_customer_id', line: i,}),
                    p_cur: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_p_currency', line: i,}),
                    cred: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_credit', line: i,}),
                    bal: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_balance', line: i,}),
                    so: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_so', line: i,}),
                    so_id: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_so_id', line: i,}),
                    date: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_date', line: i,}),
                    so_cur: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_so_currency', line: i,}),
                    amt: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_amt', line: i,}),
                    unbillamt: rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_unbill_amt', line: i,})
                })
                idarr.push(rec.getSublistValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_customer_id', line: i,}))
            }                   
        }

        var filter_arr = idarr.filter(function(element, index, arr){
            return arr.indexOf(element) === index;
        });
        // console.log('custpage_cll_select: ' + rec.findSublistLineWithValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_select', value: 'T'}))

        var emp_rec = record.load({
            type: 'employee',
            id: runtime.getCurrentUser().id,
            isDynamic: false,
        })

        // console.log('emp_sup: ' + emp_rec.getValue('supervisor'))
        
        if(emp_rec.getValue('supervisor') == ''){
            dialog.alert({
                title: '警告',
                message: "creater employee主檔，supervisor欄位不可為空值。"
            });
        }

        if((rec.findSublistLineWithValue({sublistId: 'custpage_cl_solist', fieldId: 'custpage_cll_select', value: 'T'}) != -1) && emp_rec.getValue('supervisor') != ''){
            document.getElementById("custpage_cl_action").value = "executetd";
            document.getElementById("custpage_cl_pickdata").value = JSON.stringify(line);
            document.getElementById("custpage_cl_pickidarr").value = JSON.stringify(filter_arr);
            document.getElementById("main_form").submit();
        }

    }
    
    return {
        pageInit: pageInit,
        filter: filter,
        executetd: executetd
    };
});
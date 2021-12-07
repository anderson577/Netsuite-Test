/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/log', 'N/url', 'N/record', 'N/search', 'N/ui/message', 'N/currentRecord', 'N/https' , 'N/ui/dialog', 'N/runtime'],

function(log, url, record, search, message, currentRecord, https, dialog, runtime) {

    function pageInit(context) {

    }

    function fieldChanged(context) {

        // console.log('fieldId: '+context.fieldId)
        // console.log('sublistId: '+context.sublistId)
        // Navigate to selected page
        if (context.fieldId == "custpage_tcl_applyamt" && context.sublistId == "custpage_tc_tclist"){
           
            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord            
            
            var tc_linecount = rec.getLineCount({
                sublistId: 'custpage_tc_tclist'
            });

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_tclist',
                    line: i
                });                
               
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) != ''){
                    if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == false){
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_tclist',
                            fieldId: 'custpage_tcl_select',
                            value: true,
                            // ignoreFieldChange: true
                        });
                    }
                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) == ''){
                    if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == true){
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_tclist',
                            fieldId: 'custpage_tcl_select',
                            value: false,
                            // ignoreFieldChange: true
                        });
                    }
                }
            }
            
            var tcsum = 0

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_tclist',
                    line: i
                });                
                
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) != ''){
                    // console.log('custpage_tcl_remamt: '+ Number(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_remamt'})))
                    // console.log('custpage_tcl_applyamt: '+ Number(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'})))                    
                    if(Number(rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_remamt', line: i})) < Number(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}))){
                        dialog.alert({
                            title: '警告',
                            message: "套用金額不可大於暫收款剩餘金額，請重新輸入。"
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_tclist',
                            fieldId: 'custpage_tcl_applyamt',
                            value: 0,
                            // ignoreFieldChange: true
                        });  
                    }else{
                        tcsum = tcsum + rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'})
                    }                    
                }
            }

            rec.setValue({
                fieldId: 'custpage_tc_tcamt',
                value: tcsum,
                // ignoreFieldChange: true,
                // forceSyncSourcing: true
            });

        }else if(context.fieldId == "custpage_tcl_select" && context.sublistId == "custpage_tc_tclist"){

            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord            
            
            var tc_linecount = rec.getLineCount({
                sublistId: 'custpage_tc_tclist'
            });
            
            var tcsum = 0

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_tclist',
                    line: i
                });
                
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) == ''){
                    
                    // console.log('11 '+ Number(rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_remamt', line: i})))
                    rec.setCurrentSublistValue({
                        sublistId: 'custpage_tc_tclist',
                        fieldId: 'custpage_tcl_applyamt',
                        value: Number(rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_remamt', line: i})),
                        // ignoreFieldChange: true
                    });                   
                    tcsum = tcsum + rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt', line: i})
                    // console.log('11 tsum '+ tcsum)

                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) != ''){
                    
                    tcsum = tcsum + rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt', line: i})

                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select'}) == false && rec.getCurrentSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt'}) != ''){
                    rec.setCurrentSublistValue({
                        sublistId: 'custpage_tc_tclist',
                        fieldId: 'custpage_tcl_applyamt',
                        value: '',
                        // ignoreFieldChange: true
                    });
                    // console.log('22 tsum '+ tcsum) 
                }
            }

            rec.setValue({
                fieldId: 'custpage_tc_tcamt',
                value: tcsum,
                // ignoreFieldChange: true,
                // forceSyncSourcing: true
            });

        }else if(context.fieldId == "custpage_invl_applyamt" && context.sublistId == "custpage_tc_invlist"){
            
            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord            
            
            var tc_linecount = rec.getLineCount({
                sublistId: 'custpage_tc_invlist'
            });

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_invlist',
                    line: i
                });                
               
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) != ''){
                    if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == false){
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_invlist',
                            fieldId: 'custpage_invl_select',
                            value: true,
                            // ignoreFieldChange: true
                        });
                    }
                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) == ''){
                    if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == true){
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_invlist',
                            fieldId: 'custpage_invl_select',
                            value: false,
                            // ignoreFieldChange: true
                        });
                    }
                }
            }
            
            var invsum = 0

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_invlist',
                    line: i
                });                
                
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) != ''){
                    if(Number(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'})) > Number(rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_remamt', line: i}))){
                        dialog.alert({
                            title: '警告',
                            message: "套用金額不可大於未收款金額，請重新輸入。"
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_tc_invlist',
                            fieldId: 'custpage_invl_applyamt',
                            value: 0,
                            // ignoreFieldChange: true
                        });  
                    }else{
                        invsum = invsum + rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'})
                    }
                    
                }
            }

            rec.setValue({
                fieldId: 'custpage_tc_invamt',
                value: invsum,
                // ignoreFieldChange: true,
                // forceSyncSourcing: true
            });

        }else if(context.fieldId == "custpage_invl_select" && context.sublistId == "custpage_tc_invlist"){

            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord            
            
            var tc_linecount = rec.getLineCount({
                sublistId: 'custpage_tc_invlist'
            });
            
            var invsum = 0

            for(var i = 0; i < tc_linecount; i++){
                rec.selectLine({
                    sublistId: 'custpage_tc_invlist',
                    line: i
                });
                
                if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) == ''){
                    
                    rec.setCurrentSublistValue({
                        sublistId: 'custpage_tc_invlist',
                        fieldId: 'custpage_invl_applyamt',
                        value: Number(rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_remamt', line: i})),
                        // ignoreFieldChange: true
                    });                   
                    invsum = invsum + rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt', line: i})

                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) != ''){
                    
                    invsum = invsum + rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt', line: i})

                }else if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == false && rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) != ''){
                    rec.setCurrentSublistValue({
                        sublistId: 'custpage_tc_invlist',
                        fieldId: 'custpage_invl_applyamt',
                        value: '',
                        // ignoreFieldChange: true
                    });
                }
                
                // if(rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select'}) == true && rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'}) != ''){
                //     invsum = invsum + rec.getCurrentSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt'})
                // }
            }

            rec.setValue({
                fieldId: 'custpage_tc_invamt',
                value: invsum,
                // ignoreFieldChange: true,
                // forceSyncSourcing: true
            });

        }else if(context.fieldId == "custpage_tc_adjamt"){
            
            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord  
            
            if(rec.getValue('custpage_tc_adjamt') < 0){
                dialog.alert({
                    title: '警告',
                    message: "加減項金額不可為負值，請重新輸入。"
                });  
            }
        }else if(context.fieldId == "custpage_tc_customer"){
            
            window.onbeforeunload = null;
            var current_rec = currentRecord.get()

            var rec = context.currentRecord

            var cur_field = search.lookupFields({
                type: "customer",
                id: rec.getValue('custpage_tc_customer'),
                columns: ['currency']
            });
            // log.debug('cur_field', cur_field)  
            
            rec.setValue({
                fieldId: 'custpage_tc_currency',
                value: cur_field.currency[0].value,
                // ignoreFieldChange: true,
                // forceSyncSourcing: true
            });
        }
     
    }

    function filter() {
        window.onbeforeunload = null;
        var current_rec = currentRecord.get();
        if(current_rec.getValue('custpage_tc_customer') == ''){
            dialog.alert({
                title: '警告',
                message: "查詢時，客戶不可為空值，請重新輸入。"
            });   
        }else{
            document.getElementById("action").value = "filter";
            document.getElementById("main_form").submit();   
        }
             
    }

    function executetd() {
        window.onbeforeunload = null;
        var rec = currentRecord.get();
        var exstatus = 1

        if(rec.getValue('custpage_tc_customer') == ''){
            dialog.alert({
                title: '警告',
                message: "必填欄位不可為空值，請重新輸入。"
            });   
        }else if((Number(rec.getValue('custpage_tc_adjamt')) + Number(rec.getValue('custpage_tc_tcamt'))) != Number(rec.getValue('custpage_tc_invamt'))){
            // console.log('custpage_tc_adjamt: '+ rec.getValue('custpage_tc_adjamt'))
            // console.log('custpage_tc_tcamt: '+ rec.getValue('custpage_tc_tcamt'))
            // console.log('custpage_tc_invamt: '+ rec.getValue('custpage_tc_invamt'))
            
            dialog.alert({
                title: '警告',
                message: "加減項金額加暫收款認領金額不等於發票沖銷金額，請重新輸入。"
            });  
        }else if(rec.getValue('custpage_tc_tcamt') == 0 || rec.getValue('custpage_tc_invamt') == 0){
            dialog.alert({
                title: '警告',
                message: "暫收款認領金額及發票沖銷金額不可為零，請重新輸入。"
            });  
        }else{
            if(rec.findSublistLineWithValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select', value: 'T'}) != -1){
                // console.log('currec line count', current_rec.getSublistValue({sublistId: 'custpage_bs_list', fieldId: 'custpage_bsl_select', line: 0}))
                var tcl_linecount = rec.getLineCount({sublistId: 'custpage_tc_tclist'})
                var tcl_line = []
                var tcl_date = []
                var tcl_rate = []
    
                for (var i = 0; i < tcl_linecount; i++) {                    
                    if(rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_select', line: i,}) == true){
                        tcl_line.push({
                            id: rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_internalid', line: i,}),
                            amt: rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_applyamt', line: i,}),
                            date: rec.getSublistText({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_date', line: i,}),
                            rate: rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_rate', line: i,})
                        })
                        tcl_date.push(rec.getSublistText({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_date', line: i,}))
                        tcl_rate.push(rec.getSublistValue({sublistId: 'custpage_tc_tclist', fieldId: 'custpage_tcl_rate', line: i,}))
                    }                   
                }

                if(tcl_date.length > 0){                    
                    for(var j = 0; j < tcl_date.length; j++){
                        console.log('tcl_date:' + tcl_date[j])
                        if(tcl_date[j] != tcl_date[0]){
                            exstatus = 0
                        }else{
                            if(tcl_rate.length > 0){
                                for(var k = 0; k < tcl_rate.length; k++){
                                    console.log('tcl_rate:' + tcl_rate[k])
                                    if(tcl_rate[k] != tcl_rate[0]){
                                        exstatus = 0   
                                    }
                                }
                            }
                        }
                    }
                }

                var invl_linecount = rec.getLineCount({sublistId: 'custpage_tc_invlist'})
                var invl_line = []
    
                for (var i = 0; i < invl_linecount; i++) {                    
                    if(rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_select', line: i,}) == true){
                        invl_line.push({
                            id: rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_internalid', line: i,}),
                            amt: rec.getSublistValue({sublistId: 'custpage_tc_invlist', fieldId: 'custpage_invl_applyamt', line: i,})
                        })
                    }                
                }
    
                if(exstatus == 1){
                    // console.log('Success')
                    document.getElementById("action").value = "executetd";
                    document.getElementById("custpage_tcl_pickdata").value = JSON.stringify(tcl_line);
                    document.getElementById("custpage_invl_pickdata").value = JSON.stringify(invl_line);
                    document.getElementById("main_form").submit();
                }else{
                    dialog.alert({
                        title: '警告',
                        message: "勾選之暫收款單據，日期匯率需一致，請重新輸入。"
                    });
                }
                                
            }
        }                
    }
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        filter: filter,
        executetd: executetd
    };
});
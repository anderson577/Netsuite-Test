/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search', 'N/file', 'N/log', 'N/ui/serverWidget', 'N/runtime', 'N/record', 'N/url', 'N/format', 'N/config', 'N/task'], 

function(search, file, log, ui, runtime, record, url, format, config, task) {

    function onRequest(context) {

        var request  = context.request;
        var response = context.response;
        // log.debug('context',context)
        //log.debug('runtime', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_araccount'}))

        if (request.method === 'GET'){
            
            var form = ui.createForm({
                title: '暫收款認領沖銷'
            });

            layoutForm(form, request);
            
            response.writePage(form);

        }else if(request.method === "POST"){

            if (request.parameters.action=='filter'){
                
                var form = ui.createForm({
                    title: '暫收款認領沖銷'
                });
    
                layoutForm(form, request);
    
                form.getField({ id: "custpage_tc_customer" }).defaultValue = request.parameters.custpage_tc_customer;
                form.getField({ id: "custpage_tc_currency" }).defaultValue = request.parameters.custpage_tc_currency;
                form.getField({ id: "custpage_tc_aracc" }).defaultValue = request.parameters.custpage_tc_aracc;

                form.addButton({
                    id : 'custpage_po_close',
                    label : '執行',
                    functionName: "executetd"
                });

                var filter2 = form.addFieldGroup({
                    id: 'filter2',
                    label: '金額'
                });

                var field_adjacc = form.addField({
                    id: 'custpage_tc_adjacc',
                    type: ui.FieldType.SELECT,
                    label: '加減項會計科目:',
                    container: 'filter2'
                });
                // field_adjacc.isMandatory = true;

                field_adjacc.addSelectOption({
                    value: "DEFAULT",
                    text: ""
                });

                var accountSearchObj = search.create({
                    type: "account",
                    filters:
                    [
                        ["isinactive","is","F"],
                        "AND", 
                        ["type","anyof","Expense"]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC
                        }),
                        "legalname",
                        "displayname",
                        "type",
                        "description",
                        "balance",
                        "internalid"
                    ]
                });
                // var searchResultCount = accountSearchObj.runPaged().count;
                // log.debug("accountSearchObj result count",searchResultCount);
                accountSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    // log.debug('result', result)
        
                    field_adjacc.addSelectOption({
                        value: result.getValue('internalid'),
                        text: result.getValue('displayname')
                    });
        
                    return true;
                });

                var field_adjamt = form.addField({ 
                    id: 'custpage_tc_adjamt', 
                    label: '加減項金額', 
                    type: ui.FieldType.FLOAT,
                    container: 'filter2', 
                });

                var field_tcamt = form.addField({ 
                    id: 'custpage_tc_tcamt', 
                    label: '暫收款認領金額', 
                    type: ui.FieldType.FLOAT,
                    container: 'filter2', 
                });
                field_tcamt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    
                var field_invamt = form.addField({ 
                    id: 'custpage_tc_invamt', 
                    label: '發票沖銷金額', 
                    type: ui.FieldType.FLOAT,
                    container: 'filter2', 
                });
                field_invamt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED }); 
    
                var tc_list = form.addSublist({
                    id : "custpage_tc_tclist",
                    type : ui.SublistType.LIST,   //INLINEEDITOR,
                    label: "暫收款清單",
                });
                
                layoutTcSublist(tc_list);

                var inv_list = form.addSublist({
                    id : "custpage_tc_invlist",
                    type : ui.SublistType.LIST,   //INLINEEDITOR,
                    label: "客戶未結清Invoice清單",
                });
                
                layoutInvSublist(inv_list);

                var tc_data = getTcSublistdata(request);
                fillTcSublist(tc_list, tc_data, request.parameters.custpage_tc_customer);
                var inv_data = getInvSublistdata(request);
                fillInvSublist(inv_list, inv_data)

                response.writePage(form);

            }else if (request.parameters.action=='executetd'){
                
                var tcl_pickdata = context.request.parameters.custpage_tcl_pickdata
                var invl_pickdata = context.request.parameters.custpage_invl_pickdata
                // log.debug('custpage_tcl_pickdata', tcl_pickdata)
                // log.debug('invl_pickdata', invl_pickdata)
                log.debug('JSON.parse(custpage_tcl_pickdata)', JSON.parse(tcl_pickdata))
                log.debug('JSON.parse(invl_pickdata)', JSON.parse(invl_pickdata))

                var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
        	    mrTask.scriptId = "customscript_iv_temp_credits_execute_mr";
			    var initial_deploymentId = ""
			    var deploy_obj = get_deploy_id("customscript_iv_temp_credits_execute_mr");
			    var mrTaskId = ""
			    log.debug("deploy_obj",deploy_obj)

                if(deploy_obj != null){
                    deploy_obj.every(function (result){ 
                        // log.debug(result.internalid,result.scriptid)
                        if(chk_deploy_status(result.internalid)){
                            initial_deploymentId = result.scriptid
                            return false;
                        }
                        else{
                            return true;
                        }
                    })
                }

                if(initial_deploymentId!=""){
                    // Map/Reduce Initial
                    // initial_deploymentId = result.scriptid
				    mrTask.deploymentId = initial_deploymentId;
                    mrTask.params = {
                        custscript_iv_tc_tcl: JSON.parse(tcl_pickdata),
                        custscript_iv_tc_invl: JSON.parse(invl_pickdata),
                        custscript_iv_tc_cusid: request.parameters.custpage_tc_customer,
                        custscript_iv_tc_aracc: request.parameters.custpage_tc_aracc,
                        custscript_iv_tc_adjacc: request.parameters.custpage_tc_adjacc,
                        custscript_iv_tc_adjamt: request.parameters.custpage_tc_adjamt,
                        custscript_iv_tc_tcamt: request.parameters.custpage_tc_tcamt,
                        custscript_iv_tc_invamt: request.parameters.custpage_tc_invamt,
                        custscript_iv_tc_currency: request.parameters.custpage_tc_currency,
                    };										
                    mrTaskId = mrTask.submit();
					// return false;
                }                

			    if(mrTaskId==""){
    				context.response.write("Usage limited, please wait a second.")
	    		}else{
                    // log.debug('accountId: runtime.accountId', runtime.accountId)
			    	// log.debug('accountId: runtime.accountId split', runtime.accountId.split('_'))
            	    // log.debug('accountId: runtime.accountId split length', runtime.accountId.split('_').length)

                    var accountId, accountId_array

                    if(runtime.accountId.split('_').length == 1){
                        accountId = runtime.accountId
            	    }else{
                        accountId_array = runtime.accountId.split('_')
                        accountId = accountId_array[0] + '-' + accountId_array[1]
                    }
                    var script_id = search_fileid('Temporary Credits Execute MR')
                    // log.debug('script_id', script_id)
                
                    var output = "https://"+accountId+".app.netsuite.com/app/common/scripting/mapreducescriptstatus.nl?scripttype="+script_id
                    var html = "<script>setTimeout(window.location.replace('"+output+"'),10000);</script>";
                    context.response.write(html);
			    }
            }
        }   
    }

    function DateNow(){

        var date = new Date(); 
        var newdateString = format.format({value: date, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_TAIPEI}) 
        // log.debug('newdateString',newdateString.substr(0,newdateString.indexOf(' ')))
        
        // return  newdateString
        return  newdateString.substr(0,newdateString.indexOf(' '))   
    }

    function layoutForm(form, request){

        form.addButton({
            id : 'custpage_tc_filter_button',
            label : '搜尋',
            functionName: "filter"
        });

        var filter1 = form.addFieldGroup({
            id: 'filter1',
            label: '查詢條件'
        });

        var field_customer = form.addField({
            id: 'custpage_tc_customer',
            type: ui.FieldType.SELECT,
            label: 'CUSTOMER:',
            source: 'customer',
            container: 'filter1'
        });
        field_customer.isMandatory = true;

        var field_customer = form.addField({
            id: 'custpage_tc_currency',
            type: ui.FieldType.SELECT,
            label: 'CURRENCY:',
            source: 'currency',
            container: 'filter1'
        });
        // field_customer.isMandatory = true;
        
        var field_aracc = form.addField({
            id: 'custpage_tc_aracc',
            type: ui.FieldType.SELECT,
            label: 'A/R ACCOUNT:',
            container: 'filter1'
        });
        field_aracc.isMandatory = true;

        var accountSearchObj = search.create({
            type: "account",
            filters:
            [
                ["type","anyof","AcctRec"], 
                "AND", 
                ["isinactive","is","F"]
            ],
            columns:
            [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC
                }),
                "legalname",
                "displayname",
                "type",
                "description",
                "balance",
                "internalid"
            ]
        });
        // var searchResultCount = accountSearchObj.runPaged().count;
        // log.debug("accountSearchObj result count",searchResultCount);
        accountSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            // log.debug('result', result)

            field_aracc.addSelectOption({
                value: result.getValue('internalid'),
                text: result.getValue('displayname')
            });

            return true;
        });

        field_aracc.defaultValue = "124"

        var action = form.addField({ 
            id: 'action', 
            label: 'Action', 
            type: ui.FieldType.TEXT 
        });
        action.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        
        var tcl_pickdata = form.addField({ 
            id: 'custpage_tcl_pickdata', 
            label: 'TCL Data', 
            type: ui.FieldType.TEXTAREA 
        });
        tcl_pickdata.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        var invl_pickdata = form.addField({ 
            id: 'custpage_invl_pickdata', 
            label: 'INVL Data', 
            type: ui.FieldType.TEXTAREA 
        });
        invl_pickdata.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        form.clientScriptModulePath = "./temp_credits_ui_cs.js";                
    }

    function layoutTcSublist(list){

        list.addMarkAllButtons();
        list.addField({id: "custpage_tcl_select", type: ui.FieldType.CHECKBOX, label: "Apply"});
        var list_docnum = list.addField({ id: "custpage_tcl_docnum", type: ui.FieldType.TEXT, label: "暫收款單號"});
        list_docnum.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_date = list.addField({ id: "custpage_tcl_date", type: ui.FieldType.DATE, label: "暫收款入帳日期"});
        list_date.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_currency = list.addField({ id: "custpage_tcl_currency", type: ui.FieldType.TEXT, label: "交易貨幣"});
        list_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_amt = list.addField({ id: "custpage_tcl_amt", type: ui.FieldType.FLOAT, label: "暫收款金額"});
        list_amt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_rate = list.addField({ id: "custpage_tcl_rate", type: ui.FieldType.FLOAT, label: "暫收款匯率"});
        list_rate.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_remamt = list.addField({ id: "custpage_tcl_remamt", type: ui.FieldType.FLOAT, label: "暫收款剩餘金額"});
        list_remamt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_memo = list.addField({ id: "custpage_tcl_memo", type: ui.FieldType.TEXT, label: "備註"});
        list_memo.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_customer = list.addField({ id: "custpage_tcl_customer", type: ui.FieldType.TEXT, label: "已掛客戶"});
        list_customer.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_applyamt = list.addField({ id: "custpage_tcl_applyamt", type: ui.FieldType.FLOAT, label: "套用金額"});
        list_applyamt.updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });     
        var list_internalid = list.addField({ id: "custpage_tcl_internalid", type: ui.FieldType.TEXT, label: "ID"});
        list_internalid.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });        

    }

    function getTcSublistdata(request){

        var cus_field = search.lookupFields({
            type: "customer",
            id: request.parameters.custpage_tc_customer,
            columns: ['subsidiary']
        });
        log.debug('cus_field', cus_field)

        var configRecObj = config.load({
            type: config.Type.COMPANY_PREFERENCES
        });

        var tc_account = runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_araccount'});

        var filters = [
            ["type","anyof", configRecObj.getValue('custscript_iv_tc_type_id')], 
            "AND", 
            ["account","anyof",tc_account], 
            "AND", 
            ["amountremainingisabovezero","is","T"], 
            "AND", 
            ["currency","anyof", request.parameters.custpage_tc_currency], 
            "AND", 
            ["subsidiary","anyof", cus_field.subsidiary[0].value]
        ];

        var transactionSearchObj = search.create({
            type: "transaction",
            filters: filters,
            columns:
            [
                "tranid",
                "trandate",
                search.createColumn({
                    name: "fxamount",
                    function: 'absoluteValue'
                }),
                search.createColumn({
                    name: "fxamountremaining",
                    function: 'absoluteValue'
                }),
                "memo",
                "entity",
                "account",
                search.createColumn({
                    name: "amount",
                    function: 'absoluteValue'
                }),
                "amountremaining",
                "currency",
                "exchangerate"
            ]
        });
        var results = [];
        // var searchResultCount = transactionSearchObj.runPaged().count;
        // log.debug("transactionSearchObj result count",searchResultCount);
        transactionSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            log.debug('result', result)

            results.push(result);

            return true;
        });

        return results;
    }

    function fillTcSublist(list, data, cus) {

        var j=0
    	for (var i = 0; i < data.length; i++) {
			var line = data[i];
            log.debug("line: "+i , line)
            // if(line.getValue('entity')=='')log.debug('cus: '+i, line.getValue('entity'))

            if(line.getValue('entity') == '' || line.getValue('entity') == cus){
                
                list.setSublistValue({ id: 'custpage_tcl_docnum', line: j, value: line.getValue('tranid') });
                list.setSublistValue({ id: 'custpage_tcl_date', line: j, value: line.getValue('trandate') });
                list.setSublistValue({ id: 'custpage_tcl_rate', line: j, value: line.getValue('exchangerate') });
                list.setSublistValue({ id: 'custpage_tcl_currency', line: j, value: line.getText('currency') });
                list.setSublistValue({ id: 'custpage_tcl_amt', line: j, value: line.getValue({name: "fxamount", function: 'absoluteValue'})});
                list.setSublistValue({ id: 'custpage_tcl_remamt', line: j, value: line.getValue({name: "fxamountremaining", function: 'absoluteValue'})});
                if(line.getValue('memo') != "")list.setSublistValue({ id: 'custpage_tcl_memo', line: j, value: line.getValue('memo')});
                if(line.getValue('entity') != '')list.setSublistValue({ id: 'custpage_tcl_customer', line: j, value: line.getText('entity')});
                list.setSublistValue({ id: 'custpage_tcl_internalid', line: j, value: line.id });
                j++;
            }
            
        }   
    }

    function layoutInvSublist(list){

        list.addMarkAllButtons();
        list.addField({id: "custpage_invl_select", type: ui.FieldType.CHECKBOX, label: "Apply"});
        var list_docnum = list.addField({ id: "custpage_invl_docnum", type: ui.FieldType.TEXT, label: "Invoice單號"});
        list_docnum.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_date = list.addField({ id: "custpage_invl_date", type: ui.FieldType.DATE, label: "Invoice日期"});
        list_date.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_currency = list.addField({ id: "custpage_invl_currency", type: ui.FieldType.TEXT, label: "交易貨幣"});
        list_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_amt = list.addField({ id: "custpage_invl_amt", type: ui.FieldType.FLOAT, label: "Invoice金額"});
        list_amt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_remamt = list.addField({ id: "custpage_invl_remamt", type: ui.FieldType.FLOAT, label: "未收款金額"});
        list_remamt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_memo = list.addField({ id: "custpage_invl_memo", type: ui.FieldType.TEXT, label: "備註"});
        list_memo.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_applyamt = list.addField({ id: "custpage_invl_applyamt", type: ui.FieldType.FLOAT, label: "套用金額"});
        list_applyamt.updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });     
        var list_internalid = list.addField({ id: "custpage_invl_internalid", type: ui.FieldType.TEXT, label: "ID"});
        list_internalid.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });        

    }

    function getInvSublistdata(request){

        var filters = [
            ["type","anyof", "CustInvc"], 
            "AND", 
            ["status","anyof", "CustInvc:A"],
            // "AND", 
            // ["status","anyof", "CustInvc:A","CustInvc:D"],  
            "AND", 
            ["mainline","is", "T"], 
            "AND", 
            ["name","anyof", request.parameters.custpage_tc_customer], 
            "AND", 
            ["accountmain","anyof", request.parameters.custpage_tc_aracc], 
            "AND", 
            ["currency","anyof", request.parameters.custpage_tc_currency]
            
        ];

        var invoiceSearchObj = search.create({
            type: "invoice",
            filters: filters,
            columns:
            [
                "tranid",
                search.createColumn({
                    name: "trandate",
                    sort: search.Sort.ASC
                }),
                "fxamount",
                "fxamountremaining",
                "memo",
                "accountmain",
                "currency"
            ]
        });
        var results = [];
        // var searchResultCount = invoiceSearchObj.runPaged().count;
        // log.debug("invoiceSearchObj result count",searchResultCount);
        invoiceSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            results.push(result);

            return true;
        });

        return results;
    }

    function fillInvSublist(list, data) {

    	for (var i = 0; i < data.length; i++) {
			var line = data[i];
            log.debug("line: "+i , line)

            list.setSublistValue({ id: 'custpage_invl_docnum', line: i, value: line.getValue('tranid') });
            list.setSublistValue({ id: 'custpage_invl_date', line: i, value: line.getValue('trandate') });
            list.setSublistValue({ id: 'custpage_invl_currency', line: i, value: line.getText('currency')});
            list.setSublistValue({ id: 'custpage_invl_amt', line: i, value: line.getValue('fxamount')});
            list.setSublistValue({ id: 'custpage_invl_remamt', line: i, value: line.getValue('fxamountremaining')});
            if(line.getValue('memo') != "")list.setSublistValue({ id: 'custpage_invl_memo', line: i, value: line.getValue('memo')});
            list.setSublistValue({ id: 'custpage_invl_internalid', line: i, value: line.id });
        }   
    }

    function get_deploy_id(scriptid){
        var scriptdeploymentSearchObj = search.create({
            type: "scriptdeployment",
            filters:
            [
                ["script.scriptid","startswith", scriptid]
            ],
            columns:
            [
                    search.createColumn({
                        name: "title",
                        sort: search.Sort.ASC,
                        label: "Title"
                    }),
                    search.createColumn({name: "scriptid", label: "Custom ID"}),
                    search.createColumn({name: "script", label: "Script ID"}),
                    search.createColumn({name: "recordtype", label: "Record Type"}),
                    search.createColumn({name: "status", label: "Status"}),
                    search.createColumn({name: "isdeployed", label: "Is Deployed"}),
                    search.createColumn({name: "scripttype", label: "Script Type"}),
                    search.createColumn({name: "internalid", label: "Internal ID"})
            ]
        });
        var results = new Array();
        scriptdeploymentSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            results.push({
                "internalid": result.getValue("internalid"),
                "scriptid"  : result.getValue("scriptid"),
            })
            return true;
        });

        return results;
    }

    function search_fileid(file_name){
        var file_id = ""
        var fileSearchObj = search.create({
            type: "script",
            filters:
            [
                ["name","is", file_name]
            ],
            columns:
            [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "名稱"
                }),
                search.createColumn({name: "scriptid", label: "指令碼 ID"}),
                search.createColumn({name: "scripttype", label: "指令檔類型"}),
                search.createColumn({name: "owner", label: "擁有者"}),
                search.createColumn({name: "isinactive", label: "非現用"})
            ]
        });
        fileSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            file_id = result.id
            return true;
        });

        return file_id
    }

    function findIndexOf(arr,el) {
        var index = new Array
        for (var i = 0; i < arr.length; i++){
            if(arr[i].id == el){
                index.push(i)
            } 
        }
        
        if(index.length!=0){return index}
        else{return -1;}
    }

    function chk_deploy_status(deployid){

        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters:
            [
                ["scriptdeployment.internalid","anyof", deployid], 
                "AND", 
                ["status","anyof","PENDING","PROCESSING","RETRY"]
            ],
            columns:
            [
                search.createColumn({
                    name: "datecreated",
                    sort: search.Sort.ASC,
                    label: "Date Created"
                }),
                search.createColumn({name: "startdate", label: "Start Date"}),
                search.createColumn({name: "enddate", label: "End Date"}),
                search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                search.createColumn({name: "status", label: "Status"}),
                search.createColumn({name: "percentcomplete", label: "Percent Complete"}),
                search.createColumn({
                    name: "scriptid",
                    join: "scriptDeployment",
                    label: "Custom ID"
                }),
                search.createColumn({name: "taskid", label: "Task ID"})
            ]
        });
        var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
        if(searchResultCount == 0){
            return true
        }
        else{
            return false
        }         
    }

    return {
        onRequest: onRequest
    }
});
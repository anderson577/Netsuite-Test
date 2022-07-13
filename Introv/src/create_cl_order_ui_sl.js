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
        // log.debug('runtime', runtime.getCurrentScript().getParameter({name: 'custscript_iv_labor_acc'}))

        if (request.method === 'GET'){
            
            var form = ui.createForm({
                title: '批次產生授信單'
            });

            layoutForm(form, request);
            
            response.writePage(form);

        }else if(request.method === "POST"){

            if (request.parameters.custpage_cl_action=='filter'){
                
                var form = ui.createForm({
                    title: '批次產生授信單'
                });
    
                layoutForm(form, request);
    
                form.getField({id: "custpage_cl_subsidiary"}).defaultValue = request.parameters.custpage_cl_subsidiary;
                form.getField({id: "custpage_cl_salesrep"}).defaultValue = request.parameters.custpage_cl_salesrep;

                form.addButton({
                    id : 'custpage_cl_executetd_button',
                    label : '執行',
                    functionName: "executetd"
                });

                var cl_list = form.addSublist({
                    id : "custpage_cl_solist",
                    type : ui.SublistType.LIST,   //INLINEEDITOR,
                    label: "未發帳銷售訂單清單",
                });
                
                layoutSublist(cl_list);
                var cl_data = getSublistdata(request);
                fillSublist(cl_list, cl_data);

                response.writePage(form);

            }else if (request.parameters.custpage_cl_action=='executetd'){

                var custpage_cl_pickdata = request.parameters.custpage_cl_pickdata
                var custpage_cl_pickidarr = request.parameters.custpage_cl_pickidarr

                var mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
        	    mrTask.scriptId = "customscript_iv_create_cl_order_mr";
			    var initial_deploymentId = ""
			    var deploy_obj = get_deploy_id("customscript_iv_create_cl_order_mr");
			    var mrTaskId = ""
			    // log.debug("deploy_obj",deploy_obj)

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
                        custscript_iv_cl_data: JSON.parse(custpage_cl_pickdata),
                        custscript_iv_cl_idarr: JSON.parse(custpage_cl_pickidarr)
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
                    var script_id = search_fileid('Create Credit Application Order MR')
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
            id : 'custpage_cl_filter_button',
            label : '搜尋',
            functionName: "filter"
        });

        var filter1 = form.addFieldGroup({
            id: 'filter1',
            label: '查詢條件'
        });

        var field_subsidiary = form.addField({
            id: 'custpage_cl_subsidiary',
            type: ui.FieldType.SELECT,
            label: '子公司:',
            source: 'subsidiary',
            container: 'filter1'
        });
        field_subsidiary.isMandatory = true;

        var field_salesrep = form.addField({
            id: 'custpage_cl_salesrep',
            type: ui.FieldType.SELECT,
            label: '業務代表:',
            source: 'employee',
            container: 'filter1'
        });
        // field_salesrep.isMandatory = true;

        var action = form.addField({ 
            id: 'custpage_cl_action', 
            label: 'Action', 
            type: ui.FieldType.TEXT 
        });
        action.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        var pickdata = form.addField({ 
            id: 'custpage_cl_pickdata', 
            label: 'Data', 
            type: ui.FieldType.TEXTAREA 
        });
        pickdata.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        var pickidarr = form.addField({ 
            id: 'custpage_cl_pickidarr', 
            label: 'Data', 
            type: ui.FieldType.TEXTAREA 
        });
        pickidarr.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        form.clientScriptModulePath = "./create_cl_order_ui_cs.js";                
    }

    function layoutSublist(list){

        list.addMarkAllButtons();
        list.addField({id: "custpage_cll_select", type: ui.FieldType.CHECKBOX, label: "Apply"});
        var list_customer = list.addField({ id: "custpage_cll_customer", type: ui.FieldType.TEXT, label: "客戶"});
        list_customer.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_customer_id = list.addField({ id: "custpage_cll_customer_id", type: ui.FieldType.TEXT, label: "客戶ID"});
        list_customer_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        var list_p_currency = list.addField({ id: "custpage_cll_p_currency", type: ui.FieldType.TEXT, label: "主要交易貨幣"});
        list_p_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_credit = list.addField({ id: "custpage_cll_credit", type: ui.FieldType.FLOAT, label: "Credit Limit"});
        list_credit.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_balance = list.addField({ id: "custpage_cll_balance", type: ui.FieldType.FLOAT, label: "結餘數"});
        list_balance.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_so = list.addField({ id: "custpage_cll_so", type: ui.FieldType.TEXT, label: "銷售訂單"});
        list_so.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_so_id = list.addField({ id: "custpage_cll_so_id", type: ui.FieldType.TEXT, label: "銷售訂單ID"});
        list_so_id.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
        var list_date = list.addField({ id: "custpage_cll_date", type: ui.FieldType.DATE, label: "銷售日期"});
        list_date.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_so_currency = list.addField({ id: "custpage_cll_so_currency", type: ui.FieldType.TEXT, label: "銷售貨幣"});
        list_so_currency.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_amt = list.addField({ id: "custpage_cll_amt", type: ui.FieldType.FLOAT, label: "銷售金額"});
        list_amt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
        var list_unbill_amt = list.addField({ id: "custpage_cll_unbill_amt", type: ui.FieldType.FLOAT, label: "未發帳金額"});
        list_unbill_amt.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

    }

    function getSublistdata(request){

        var filters = [
            ["type","anyof","SalesOrd"], 
            "AND", 
            ["mainline","is","T"], 
            "AND", 
            ["customer.credithold","anyof","AUTO"], 
            "AND", 
            ["custbody_iv_credit_application_id","anyof","@NONE@"], 
            "AND", 
            ["customer.creditlimit","isnotempty",""], 
            "AND", 
            ["status","anyof","SalesOrd:F"], 
            "AND", 
            ["formulanumeric: {fxamountunbilled}","greaterthan","0"],
        ];

        if (request.parameters.custpage_cl_subsidiary !== undefined && request.parameters.custpage_cl_subsidiary != '' && request.parameters.custpage_cl_subsidiary != null){
            filters.push("AND");
            filters.push(["subsidiary", "anyof", request.parameters.custpage_cl_subsidiary]);
        }

        if (request.parameters.custpage_cl_salesrep !== undefined && request.parameters.custpage_cl_salesrep != '' && request.parameters.custpage_cl_salesrep != null){
            filters.push("AND");
            filters.push(["custpage_cl_salesrep", "anyof", request.parameters.custpage_cl_salesrep]);
        }

        var transactionSearchObj = search.create({
            type: "salesorder",
            filters: filters,
            columns:
            [
                search.createColumn({
                    name: "entity",
                    sort: search.Sort.ASC
                }),
                search.createColumn({
                    name: "currency",
                    join: "customer"
                }),
                search.createColumn({
                    name: "creditlimit",
                    join: "customer"
                }),
                search.createColumn({
                    name: "fxbalance",
                    join: "customer"
                }),
                "tranid",
                "trandate",
                "currency",
                "fxamount",
                search.createColumn({
                    name: "fxunbilledorders",
                    join: "customer"
                }),
                "internalid",
                search.createColumn({
                    name: "formulanumeric",
                    formula: "{fxamountunbilled}"
                })
            ]
        });
        var results = [];
        // var searchResultCount = transactionSearchObj.runPaged().count;
        // log.debug("transactionSearchObj result count",searchResultCount);
        transactionSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            
            if(Number(result.getValue({name: "formulanumeric", formula: "{fxamountunbilled}"})) + Number(result.getValue({name: "fxbalance", join: "customer"})) >  Number(result.getValue({name: "creditlimit", join: "customer"}))){
                results.push(result);
            }
            return true;
        });

        return results;
    }

    function fillSublist(list, data) {

    	for (var i = 0; i < data.length; i++) {
			var line = data[i];
            // log.debug("line: "+i , line)
            list.setSublistValue({ id: 'custpage_cll_customer', line: i, value: line.getText('entity') });
            list.setSublistValue({ id: 'custpage_cll_customer_id', line: i, value: line.getValue('entity') });
            list.setSublistValue({ id: 'custpage_cll_so', line: i, value: line.getValue('tranid') });
            list.setSublistValue({ id: 'custpage_cll_so_id', line: i, value: line.getValue('internalid') });
            list.setSublistValue({ id: 'custpage_cll_p_currency', line: i, value: line.getText({name: "currency", join: "customer"}) });
            list.setSublistValue({ id: 'custpage_cll_credit', line: i, value: line.getValue({name: "creditlimit", join: "customer"}) });
            list.setSublistValue({ id: 'custpage_cll_balance', line: i, value: line.getValue({name: "fxbalance", join: "customer"}) });
            list.setSublistValue({ id: 'custpage_cll_date', line: i, value: line.getValue('trandate') });
            list.setSublistValue({ id: 'custpage_cll_so_currency', line: i, value: line.getText('currency') });
            list.setSublistValue({ id: 'custpage_cll_amt', line: i, value: line.getValue('fxamount') });
            list.setSublistValue({ id: 'custpage_cll_unbill_amt', line: i, value: (Math.round(line.getValue({name: "formulanumeric", formula: "{fxamountunbilled}"})*100))/100});
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
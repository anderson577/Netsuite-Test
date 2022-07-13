/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/runtime', 'N/error', 'N/format', 'N/email', 'N/render', 'N/file', 'N/config'],
    function(search, record, runtime, error, format, email, render, file, config)
    {

        function getInputData(context){
            log.debug('In Get Input data Stage', context);
        
            try {            
                var data = runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_tcl'})
                log.debug('custscript_iv_tc_tcl', data);
                log.debug('JSON.parse(data)', JSON.parse(data))
                var data = JSON.parse(data)

                return data;

            } catch (e) {
                log.debug("onrequst error", JSON.stringify(e));
            }
        }

        function map(context){
            log.debug('In Map Stage', context);
            log.debug('In Map Stage context.value', context.value);
            var searchResult = JSON.parse(context.value);
            log.debug('searchResult', searchResult);
            log.debug('custscript_iv_tc_tcl', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_tcl'}));
            log.debug('custscript_iv_tc_invl', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invl'}));
            log.debug('custscript_iv_tc_cusid', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'}));
            log.debug('custscript_iv_tc_aracc', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_aracc'}));
            log.debug('custscript_iv_tc_adjacc', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_adjacc'}));
            log.debug('custscript_iv_tc_adjamt', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_adjamt'}));
            log.debug('custscript_iv_tc_tcamt', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_tcamt'}));
            log.debug('custscript_iv_tc_invamt', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invamt'}));
            log.debug('custscript_iv_tc_currency', runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_currency'}));           

            try {
                
                var tc_rec = record.load({
                    type: "customtransaction_iv_temporary_credits",
                    id: searchResult.id,
                    isDynamic: false
                });

                var linecount = tc_rec.getLineCount({sublistId: 'line'})
                var tc_status = false

                for(var i = 0; i < linecount; i++){

                    if(tc_rec.getSublistValue({sublistId: 'line', fieldId: 'entity', line: i}) == ''){
                        tc_rec.setSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            line: i,
                            value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'})
                        });
                        tc_status = true;
                    }                    
    
                }

                if(tc_status == true)tc_rec.save();
                
            } catch (e) {
                log.debug("onrequst error", JSON.stringify(e));
            }            
           
        }        

        function summarize(context) {
            log.debug('In summarize Stage', context);

            try {

                var configRecObj = config.load({
                    type: config.Type.COMPANY_PREFERENCES
                });
                
                var cus_field = search.lookupFields({
                    type: "customer",
                    id: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'}),
                    columns: ['subsidiary']
                });

                log.debug('cus_field', cus_field)
                
                var tc_tcl = runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_tcl'})
                tc_tcl = JSON.parse(tc_tcl)
                
                var jnal_rec = record.create({
                    type: "journalentry" ,
                    isDynamic: false
                });

                jnal_rec.setValue({
                    fieldId: "subsidiary",
                    value:  cus_field.subsidiary[0].value,
                    ignoreFieldChange: false
                });

                jnal_rec.setValue({
                    fieldId: "currency",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_currency'}),
                    ignoreFieldChange: false
                });

                jnal_rec.setValue({
                    fieldId: "approvalstatus",
                    value:  "2",
                    ignoreFieldChange: false
                });

                //jnal_rec.setText({
                //    fieldId: "trandate",
                //    text:  tc_tcl[0].date,
                //    ignoreFieldChange: false
                //});

                jnal_rec.setValue({
                    fieldId: "exchangerate",
                    value:  tc_tcl[0].rate,
                    ignoreFieldChange: false
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 0,
                    value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_aracc'})
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    line: 0,
                    value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invamt'})
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 0,
                    value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'})
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: 1,
                    value: configRecObj.getValue('custscript_iv_tc_araccount')
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    line: 1,
                    value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_tcamt'})
                });

                jnal_rec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    line: 1,
                    value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'})
                });

                if(runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_adjacc'}) != "DEFAULT"){
                    // log.debug('Account Test', JSON.parse(runtime.getCurrentScript().getParameter({name: 'custpage_tc_adjacc'})))
                    jnal_rec.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        line: 2,
                        value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_adjacc'})
                    });
    
                    jnal_rec.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        line: 2,
                        value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_adjamt'})
                    });
    
                    jnal_rec.setSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        line: 2,
                        value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'})
                    });
                }                

                var jnal_id = jnal_rec.save();

                var cusinv_rec = record.create({
                    type: "customerpayment" ,
                    isDynamic: true
                });

                // log.debug('getSublists', cus1_rec.getSublists())
                // log.debug('getSublists', cus1_rec.getSublistFields({sublistId: 'apply'}))

                cusinv_rec.setValue({
                    fieldId: "customer",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'}),
                    ignoreFieldChange: false
                });

                cusinv_rec.setValue({
                    fieldId: "currency",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_currency'}),
                    ignoreFieldChange: false
                });

                //cusinv_rec.setText({
                //    fieldId: "trandate",
                //    text:  tc_tcl[0].date,
                //    ignoreFieldChange: false
                //});

                cusinv_rec.setValue({
                    fieldId: "exchangerate",
                    value:  tc_tcl[0].rate,
                    ignoreFieldChange: false
                });

                cusinv_rec.setValue({
                    fieldId: "aracct",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_aracc'}),
                    ignoreFieldChange: false
                });

                cusinv_rec.setValue({
                    fieldId: "undepfunds",
                    value: "T",
                    ignoreFieldChange: false
                });

                // log.debug('getSublists', cusinv_rec.getSublists())
                // log.debug('getSublistFields', cusinv_rec.getSublistFields({sublistId: 'credit'}))
                // log.debug('apply', cusinv_rec.getLineCount({sublistId: 'apply'}))
                // log.debug('credit', cusinv_rec.getLineCount({sublistId: 'credit'}))                

                var tc_invl = runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invl'})
                tc_invl = JSON.parse(tc_invl)
                
                for(var i = 0; i < tc_invl.length; i++){
                    // log.debug('findSublistLineWithValue apply', cusinv_rec.findSublistLineWithValue({sublistId: 'apply', fieldId: 'doc', value: tc_tcl[i].id}))                    
                    var tcl_index = cusinv_rec.findSublistLineWithValue({sublistId: 'apply', fieldId: 'doc', value: tc_invl[i].id})
                    
                    var inv_field = search.lookupFields({
                        type: "invoice",
                        id: cusinv_rec.getSublistValue({sublistId: 'apply', fieldId: 'doc', line: tcl_index}),
                        columns: ['department', 'class']
                    });
                    log.debug('inv_field', inv_field)
    
                    cusinv_rec.setValue({
                        fieldId: "class",
                        value:  inv_field.class[0].value,
                        ignoreFieldChange: false
                    });
    
                    cusinv_rec.setValue({
                        fieldId: "department",
                        value:  inv_field.department[0].value,
                        ignoreFieldChange: false
                    });
                    
                    cusinv_rec.selectLine({sublistId: 'apply', line: tcl_index});
                    // cusinv_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply', value: true, ignoreFieldChange: false});
                    cusinv_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount', value: tc_invl[i].amt, ignoreFieldChange: false});                    
                    cusinv_rec.commitLine({sublistId: 'apply'});
                }
                // log.debug('findSublistLineWithValue credit', cusinv_rec.findSublistLineWithValue({sublistId: 'credit', fieldId: 'doc', value: jnal_id}))

                var jnal_index = cusinv_rec.findSublistLineWithValue({sublistId: 'credit', fieldId: 'doc', value: jnal_id})
                log.debug('jnal_index', jnal_index)
                cusinv_rec.selectLine({sublistId: 'credit', line: jnal_index});
                // cusinv_rec.setCurrentSublistValue({sublistId: 'credit', fieldId: 'apply', value: true, ignoreFieldChange: false});
                cusinv_rec.setCurrentSublistValue({sublistId: 'credit', fieldId: 'amount', value: Number(runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invamt'})), ignoreFieldChange: false});
                cusinv_rec.commitLine({sublistId: 'credit'});

                cusinv_rec.save();
                // log.debug('cusinv_rec_id', cusinv_rec_id)

                var custc_rec = record.create({
                    type: "customerpayment" ,
                    isDynamic: true
                });

                // log.debug('getSublists', cus1_rec.getSublists())
                // log.debug('getSublists', cus1_rec.getSublistFields({sublistId: 'apply'}))

                custc_rec.setValue({
                    fieldId: "customer",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_cusid'}),
                    ignoreFieldChange: false
                });

                custc_rec.setValue({
                    fieldId: "currency",
                    value:  runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_currency'}),
                    ignoreFieldChange: false
                });

                //custc_rec.setText({
                //    fieldId: "trandate",
                //    text:  tc_tcl[0].date,
                //    ignoreFieldChange: false
                //});

                custc_rec.setValue({
                    fieldId: "exchangerate",
                    value:  tc_tcl[0].rate,
                    ignoreFieldChange: false
                });

                custc_rec.setValue({
                    fieldId: "aracct",
                    value:  configRecObj.getValue('custscript_iv_tc_araccount'),
                    ignoreFieldChange: false
                });

                custc_rec.setValue({
                    fieldId: "undepfunds",
                    value: "T",
                    ignoreFieldChange: false
                });

                

                
                for(var i = 0; i < tc_tcl.length; i++){
                    // log.debug('findSublistLineWithValue apply', cusinv_rec.findSublistLineWithValue({sublistId: 'apply', fieldId: 'doc', value: tc_tcl[i].id}))                    
                    var tcl_index = custc_rec.findSublistLineWithValue({sublistId: 'credit', fieldId: 'doc', value: tc_tcl[i].id})

                    var tc_field = search.lookupFields({
                        type: "customtransaction_iv_temporary_credits",
                        id: custc_rec.getSublistValue({sublistId: 'credit', fieldId: 'doc', line: tcl_index}),
                        columns: ['department', 'class']
                    });
                    log.debug('tc_field', tc_field)
    
                    custc_rec.setValue({
                        fieldId: "class",
                        value:  tc_field.class[0].value,
                        ignoreFieldChange: false
                    });
    
                    custc_rec.setValue({
                        fieldId: "department",
                        value:  tc_field.department[0].value,
                        ignoreFieldChange: false
                    });

                    custc_rec.selectLine({sublistId: 'credit', line: tcl_index});
                    // custc_rec.setCurrentSublistValue({sublistId: 'credit', fieldId: 'apply', value: true, ignoreFieldChange: false});
                    custc_rec.setCurrentSublistValue({sublistId: 'credit', fieldId: 'amount', value: tc_tcl[i].amt, ignoreFieldChange: false});                    
                    custc_rec.commitLine({sublistId: 'credit'});
                }
                // log.debug('findSublistLineWithValue credit', cusinv_rec.findSublistLineWithValue({sublistId: 'credit', fieldId: 'doc', value: jnal_id}))

                var jnal_index = custc_rec.findSublistLineWithValue({sublistId: 'apply', fieldId: 'doc', value: jnal_id})
                custc_rec.selectLine({sublistId: 'apply', line: jnal_index});
                // custc_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply', value: true, ignoreFieldChange: false});
                custc_rec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount', value: runtime.getCurrentScript().getParameter({name: 'custscript_iv_tc_invamt'}), ignoreFieldChange: false});
                custc_rec.commitLine({sublistId: 'apply'});

                custc_rec.save();

            } catch (e) {
                log.debug("onrequst error", JSON.stringify(e));
            }
        }

        function createFolderIfNotExist(folderPath, parentId) {
            var folderArray = folderPath.split('/');
            var firstFolder = folderArray[0];
            var nextFolders = folderArray.slice(1);
            var filters = [];
    
            filters.push({ name: 'name', operator: 'is', values: [firstFolder] });
            if (parentId) {
                filters.push({ name: 'parent', operator: 'anyof', values: [parentId] });
            } else {
                filters.push({ name: 'istoplevel', operator: 'is', values: true });
            }
    
            var folderSearch = search.create({
                type: search.Type.FOLDER,
                filters: filters
            });
    
            var folderId = null;
            folderSearch.run().each(function(result) {
                folderId = result.id;
                return false;
            });
    
            if (!folderId) {
                var folderRecord = record.create({ type: record.Type.FOLDER });
                folderRecord.setValue({ fieldId: 'name', value: firstFolder });
                folderRecord.setValue({ fieldId: 'parent', value: parentId });
                folderId = folderRecord.save();
            }
    
            if (!nextFolders || nextFolders.length == 0) return folderId;
    
            return createFolderIfNotExist(nextFolders.join('/'), folderId);
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });
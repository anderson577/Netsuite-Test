/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/sftp', 'N/file', 'N/record'], 
function(ui, sftp, file, record) {

    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        if(request.method === 'GET'){
            var form = ui.createForm({title: 'Enter SFTP Credentials'});
            form.addCredentialField({
                id: 'custfield_sftp_password_token',
                label: 'SFTP Password',
                restrictToScriptIds: ['customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp','customscript_schd_searchtocsv','customscript_iv_mr_searchtocsv'],
                //['customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp'],
                restrictToDomains: ['sftp.greateagle.com.hk'],
                restrictToCurrentUser: false //Depends on use case
            });
            form.addSubmitButton();
            response.writePage(form);
        } else if(request.method === 'POST'){
            // var passwordToken = request.parameters.custfield_sftp_password_token;
            // log.debug({
            //     title: 'New password token', 
            //     details: passwordToken
            // });
            // response.write(passwordToken);
            // return;

            //var passwordToken = '5cabc7fed89b4b7189d6aa7ca86f0b30';// bbox testing only
            //var passwordToken = '26d7c7f663094e68b75597da376ef3bd';// bbox available for script : 'customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp'
            //var passwordToken = 'c41b0e7738fe47aaa1ba407f4026af4d'; // bbox available for script : 'customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp','customscript_schd_searchtocsv',
            var passwordToken = 'ada4d9b2f6f74a8dba62f212ffdd8fe4'; // bbox available for script : ['customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp','customscript_schd_searchtocsv','customscript_iv_mr_searchtocsv']
            try {
                var objConnection = sftp.createConnection({
                    username: 'ecnsuat',
                    passwordGuid: passwordToken,
                    url: 'sftp.greateagle.com.hk',
                    directory: '',
                    hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAAAgQDCh9qdcv1i9Y6nDwpspLaW1OosdrrtOl0t7uiof2/QYs0RTmT1DVRz0D0SNweNjtB/5069pFaNMthEh591gNrnipxy2FA2Zz7x5fv0v/AbTjmTujK14GYDBvMQTA58jGf1NWRn0+CkJvhCqY4eylkYgXdn4Y5QgGQYoEvN9P6zdQ=='
                });

                var download_list = new Array;
                var file_list = objConnection.list({path: '/Pending'})
                log.debug('file_list',file_list)
                // file_list = file_list.length
                for(var i = 0; i < file_list.length; i++){
                    log.debug('file',file_list[i].name)
                    // download file from FTP folder /pending
                    var downloadedFile = objConnection.download({
                        directory: '/Pending',
                        filename: file_list[i].name
                    });

                    //download file to static folder ID in File Cabinet
                    downloadedFile.folder = 11239; 
                    var downloadID = downloadedFile.save();
                    log.debug("downloadID",downloadID);
                    download_list.push({
                        downloadID: downloadID,
                        filename : file_list[i].name
                    })

                    // Archive File
                    objConnection.move({
                        from: '/Pending/'+file_list[i].name,
                        to: '/Archive/'+file_list[i].name,
                    });
                
                }
              /*
              objConnection.move({
                
                
    			from: '/Pending/get.csv',
    			to: '/Archive/get.csv',
   				 });
              */
              
              
              
                // var Archive_csv = downloadedFile;
              
                // objConnection.upload({
                //     directory: '/Archive',
                //     filename: 'Archive.csv',
                //     file: Archive_csv,
                //     replaceExisting: true
                // });

                // log.debug({
                //     title: 'File upload complete', 
                //     details: Archive_csv
                // });
                log.debug('download_list',download_list)
                context.response.write(JSON.stringify(download_list));
            } catch(e) {
                context.response.write(JSON.stringify(e));
            }
        } else if(request.method === 'PUT'){
            log.debug('context',context)
            var body = JSON.parse(context.request.body)
            log.debug('body',body)
            var passwordToken = 'ada4d9b2f6f74a8dba62f212ffdd8fe4'; // bbox available for script : ['customscript_sl_sftp_setup','customscript_schd_gen_aging_report_sftp','customscript_schd_searchtocsv','customscript_iv_mr_searchtocsv']
            try {
                context.response.write('success');
                var objConnection = sftp.createConnection({
                    username: 'ecnsuat',
                    passwordGuid: passwordToken,
                    url: 'sftp.greateagle.com.hk',
                    directory: '',
                    hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAAAgQDCh9qdcv1i9Y6nDwpspLaW1OosdrrtOl0t7uiof2/QYs0RTmT1DVRz0D0SNweNjtB/5069pFaNMthEh591gNrnipxy2FA2Zz7x5fv0v/AbTjmTujK14GYDBvMQTA58jGf1NWRn0+CkJvhCqY4eylkYgXdn4Y5QgGQYoEvN9P6zdQ=='
                });
                log.debug('body.length',body.length)
                for(var i = 0; i < body.length; i++){
                    log.debug('body[i]',body[i])
                    var filedata = file.load({id: body[i]})
                    objConnection.upload({
                        directory: '/Error',
                        filename: filedata.name,
                        file: filedata,
                        replaceExisting: true
                    });
                    
                }

            }
            catch(e){
                context.response.write(JSON.stringify(e));
            }
        }

    }

    return {
        onRequest: onRequest
    }
});
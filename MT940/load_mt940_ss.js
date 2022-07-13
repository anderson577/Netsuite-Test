/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/runtime', 'N/search', 'N/record','N/email','N/format','N/https','N/file', 'N/task','N/error','./mt940lib/parser.js'],
 function(runtime, search, record,email,format,https,file,task,error,parser) {

    function execute(context) {
      const DUMMY_STATEMENT_LINES = [
         ':20:B4E08MS9D00A0009',
         ':21:X',
         ':25:123456789',
         ':28C:123/1',
         ':60F:C140507EUR0,00',
         ':61:1405070507C500,00NTRFNONREF//AUXREF',
         ':86:LINE1',
         'LINE2',
         ':62F:C140508EUR500,00',
       ];
       const mt940 = "{1:F01AAAABB99BSMK3513951576}"+
       "{2:O9400934081223BBBBAA33XXXX03592332770812230834N}" +
       "{4:\n"+
       ":20:0112230000000890\n"+
       ":25:SAKG800030155USD\n"+
       ":28C:255/1\n"+
       ":60F:C011223USD175768,92\n"+
       ":61:0112201223CD110,92NDIVNONREF//08 IL053309\n"+
       "/GB/2542049/SHS/312,\n"+
       ":62F:C011021USD175879,84\n"+
       ":20:NONREF\n" +
       ":25:4001400010\n" +
       ":28C:58/1\n" +
       ":60F:C140327EUR6308,75\n" +
       ":61:1403270327C3519,76NTRF50RS201403240008//2014032100037666\n" +
       "ABC DO BRASIL LTDA\n" +
       ":86:INVOICE NR. 6000012801 \n" +
       "ORDPRTY : ABC DO BRASIL LTDA RUA LIBERO BADARO,293-SAO \n" +
       "PAULO BRAZIL }";
       
      try {
         const result =parser._parseLines(DUMMY_STATEMENT_LINES);
         log.debug('result', result);

      } catch (error) {         
        log.error('error', error);
      }
   
      
    }

   
   
    return {
        execute: execute
    }
});

/*
*@author Hector E. Socarras
*@brief 
*Se implementa la funcion 0x02 del protocolo de modbus. 
*Debuelve un objeto pdu con el valor de las inputs solicitadas.
*
*@param objeto pdu
*/

var PDU = require('../pdu');
var tools = require('./tools');

var ReadInputStatus = function (pdu) {     
   
    var respPDU = new PDU();
    
    //Input inicial ejemplo el input 20 direccionado como 0x13 (19)
    var initInput = pdu.modbus_data.readUInt16BE(0);
    
    //Verificando q la input solicitada exista
    if(initInput >= this.inputs.length*8){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;        
        respPDU.modbus_data[0] = 0x02;
        
        this.errorIndex = 1;
        
        this.emit('modbus_error',this.errorIndex);
    }
    else{
        //cantidad de inputs a leer
        var numberOfInputs =   pdu.modbus_data.readUInt16BE(2);

        // index del buffer inputs donde esta el 20 ejemplo 19/8 = 2 (byte 3, 0 1 2) valores 23-16.
        //redondeado a un entero
        var index = Math.floor(initInput/8);

        //Calculando cantidad de bytes de la respuesta 12%8=1
        //ejemplo 12 inputs necesitan 2 bytes
        var byte_count= numberOfInputs % 8 ? Math.floor(numberOfInputs/8+1):(numberOfInputs/8);

        respPDU.modbus_function = 0x02;
        respPDU.modbus_data = new Buffer(byte_count+1);
        respPDU.modbus_data[0]=byte_count;

        // bits delante en el byte del input inicial.
        //ejemplo input 19 esta en el byte 3 y tiene detras a las input 16, 17, 18;   
        //byte 3 del registro inputs es asi [23 22 21 20 19 18 17 16] byte 4 [31 30 29 28 27 26 25 24]
        var offset = initInput % 8;

        //buffer temporal con tamano suficiente para copiar el segmento del registro con las inputs solicitadas
        var input_segment =  new Buffer(Math.floor(numberOfInputs/8+1));

        //copiando los valores de las input del input register al bufer temporal
        //[23 22 21 20 19 18 17 16]  [31 30 29 28 27 26 25 24]
        this.inputs.copy(input_segment,0,index,index+input_segment.length);
        
        //invirtiendo el bufer
        //[31 30 29 28 27 26 25 24] [23 22 21 20 19 18 17 16]
        input_segment = tools.InvertBufferBytes(input_segment);

        //desplazando a la derecha las inputs
        //[0 0 0 31 30 29 28 27] [26 25 24 23 22 21 20 19]
        var tempResult = tools.ShiftBufferBits(input_segment,offset,'r');

        //ordenando nuevamente el buffer
        //[26 25 24 23 22 21 20 19] [0 0 0 31 30 29 28 27]
        tempResult = tools.InvertBufferBytes(tempResult);

        //truncando el buffer result ya q puede ser un byte mayor
        var result = tempResult.slice(0,byte_count);

        //poniendo a 0 las inputs no solicitadas.
        // [26 25 24 23 22 21 20 19] [0 0 0 0 30 29 28 27]
        //uso el primer byte de input_segment como byte temporal para calcular la mascara
        //si son 12 inputs 8 en el primer byte y 4 en el segundo por tanto la mascara seria (8 - 12%8) o 00001111
        input_segment[0] = 0xFF >> (8 - numberOfInputs % 8);
        
        //si la mascara es 0x00 significa q todo el byte es valido. por tanto la hago 0xFF;
        if(input_segment[0] == 0x00){
            input_segment[0] = 0xFF;
        }
        result[result.length - 1] = result[result.length - 1] & input_segment[0];

        //copiando las cois al campo de data de la PDU
        result.copy(respPDU.modbus_data,1);
        
    }
    
    return respPDU;
}

module.exports = ReadInputStatus;
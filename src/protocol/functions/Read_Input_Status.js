/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x02 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de las inputs solicitadas.
*
*@param objeto pdu
*/

var PDU = require('../pdu');


var ReadInputStatus = function (pdu) {

    var respPDU = new PDU();

    //input inicial ejemplo el input 20 direccionado como 0x13 (19)
    var initInput = pdu.modbus_data.readUInt16BE(0);

    //Verificando q la input solicitada exista
    if(initInput >= this.inputs.size){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        this.emit('modbus_exception','ILLEGAL DATA ADDRESS');
    }
    else {
        //cantidad de inputs a leer
        var numberOfInputs =   pdu.modbus_data.readUInt16BE(2);

        

        //Calculando cantidad de bytes de la respuesta 12%8=1
        //ejemplo 12 inputs necesitan 2 bytes
        var byte_count= numberOfInputs % 8 ? Math.floor(numberOfInputs/8+1):(numberOfInputs/8);

        respPDU.modbus_function = 0x02;
        respPDU.modbus_data = Buffer.alloc(byte_count+1);
        respPDU.modbus_data[0]=byte_count;

        //buffer temporal con tamano suficiente para copiar el segmento del registro con las inputs solicitadas
        var input_segment =  this.inputs.EncodeRegister(initInput, numberOfInputs);        

        //copiando las cois al campo de data de la PDU
        input_segment.copy(respPDU.modbus_data,1);
    }

    return respPDU;
}
module.exports = ReadInputStatus;

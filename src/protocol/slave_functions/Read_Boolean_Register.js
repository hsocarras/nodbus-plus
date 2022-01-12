/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion que lee de los registros booleanos del esclavo.

*/

const PDU = require('../pdu');
const MakeModbusException = require('./Make_modbus_exception');

var ReadBoolRegisterStatus = function (pdu, boolean_register) {

    var respPDU = new PDU();

    //initial register. Example coil 20 addressing as 0x13 (19)
    var initRegister = pdu.modbus_data.readUInt16BE(0);

    //Verificando q la coil solicitada exista
    if(initRegister >= boolean_register.size){
        //Creando exception 0x02
        respPDU = MakeModbusException(0x02);
    }
    else {
        //registers to read
        var numberOfRegister =   pdu.modbus_data.readUInt16BE(2);        

        //Calculando cantidad de bytes de la respuesta 12%8=1
        //ejemplo 12 coils necesitan 2 bytes
        var byte_count= numberOfRegister % 8 ? Math.floor(numberOfRegister/8+1):(numberOfRegister/8);

        respPDU.modbus_function = pdu.modbus_function;
        respPDU.modbus_data = Buffer.alloc(byte_count+1);
        respPDU.modbus_data[0]=byte_count;

        //buffer temporal con tamano suficiente para copiar el segmento del registro con las coils solicitadas
        //var coil_segment =  Buffer.alloc(byte_count);
        var segment = boolean_register.EncodeRegister(initRegister, numberOfRegister);       

        //copiando las cois al campo de data de la PDU
        segment.copy(respPDU.modbus_data,1);
    }

    return respPDU;
}

module.exports = ReadBoolRegisterStatus;

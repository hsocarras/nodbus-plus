

var PDU = require('../pdu');
const MakeModbusException = require('./Make_modbus_exception');

var ReadWordRegister = function (pdu, wordRegister) {

    var respPDU = new PDU();

    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var initRegister = pdu.modbus_data.readUInt16BE(0);
    var wordRegister = wordRegister;
    //Verificando q el registro solicitado exista
    if(initRegister >= wordRegister.size){
        //Creando exception 0x02
        respPDU = MakeModbusException(pdu.modbus_function, 0x02);
    }
    else{
        //cantidad de registros a leer
        var numberOfRegisters =  pdu.modbus_data.readUInt16BE(2);

        ////Calculando cantidad de bytes de la respuesta
        var byte_count=2*numberOfRegisters;


        respPDU.modbus_data = Buffer.alloc(byte_count+1);
        respPDU.modbus_function = 0x03;
        respPDU.modbus_data[0]=byte_count;

        for(var i = 0; i < numberOfRegisters; i++){
          wordRegister.EncodeRegister(initRegister + i).copy(respPDU.modbus_data, 1 + 2*i)
        }


    }

    return respPDU;


}

module.exports = ReadWordRegister;

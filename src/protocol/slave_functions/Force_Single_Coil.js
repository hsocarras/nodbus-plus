/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 05 del protocolo de modbus.
*Debuelve un objeto pdu con el echo del request.
*
*@param objeto pdu
*/

const PDU = require('../pdu');
const MakeModbusException = require('./Make_modbus_exception');

var ForceSingleCoil = function (pdu){

    var respPDU = new PDU();

    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var targetCoil = pdu.modbus_data.readUInt16BE(0);

    //valor a forzar
    var value = pdu.modbus_data.readUInt16BE(2);

    if(targetCoil >= this.coils.size){
        //Verificando q la coil solicitada exista
        //Creando exception 0x02
        respPDU = MakeModbusException(5, 2);

        return respPDU;
    }
    else if (value != 0x0000 & value != 0xFF00 ) {
        //verificando el campo valor sea valido
        //Creando exception 0x03
        respPDU = MakeModbusException(5, 3);

        return respPDU;
    }
    else {
        let values = new Map();
        this.coils.SetValue(value, targetCoil);
        values.set(targetCoil, (value > 0));
        //creando una copia del request
        respPDU = pdu;
        this.emit('values', '0x', values);

        return respPDU;
    }
}

module.exports = ForceSingleCoil;

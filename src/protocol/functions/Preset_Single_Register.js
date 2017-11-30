/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 06 del protocolo de modbus.
*Debuelve un objeto pdu con el valor del registro solicitado.
*
*@param objeto pdu
*/

var PDU = require('../pdu');

var PresetSingleRegister = function (pdu){

    var respPDU = new PDU();

    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var targetRegister = pdu.modbus_data.readUInt16BE(0);

     if (targetRegister > this.holdingRegisters.size){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        this.emit('modbus_exception','ILLEGAL DATA ADDRESS');
    }
    else {
        let values = new Map();
        this.holdingRegisters.DecodeRegister(pdu.modbus_data.slice(2), targetRegister);

        values.set(targetRegister, pdu.modbus_data.slice(2).readUInt16BE());
        //Devolviendo un eco de la pdu.
        respPDU = pdu
        this.emit('values', '4x', values);
        return respPDU;

    }
}

module.exports = PresetSingleRegister;

/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 06 del protocolo de modbus.
*Debuelve un objeto pdu con el valor del registro solicitado.
*
*@param objeto pdu
*/

const PDU = require('../pdu');
const MakeModbusException = require('./Make_modbus_exception');

var PresetSingleRegister = function (pdu){

    var respPDU = new PDU();

    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var targetRegister = pdu.modbus_data.readUInt16BE(0);

     if (targetRegister > this.holdingRegisters.size){
        //Creando exception 0x02
        respPDU = MakeModbusException(0x02);
        
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

/** 
* @author Hector E. Socarras
* @brief
* Se implementa la funcion 22 del protocolo de modbus.
* Debuelve un objeto pdu con el valor del registro solicitado.
*
* @param objeto pdu
*/

const PDU = require('../pdu');
const MakeModbusException = require('./Make_modbus_exception');

var MaskHoldingRegister = function (pdu){

    var respPDU = new PDU();

    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var targetRegister = pdu.modbus_data.readUInt16BE(0);

     if (targetRegister > this.holdingRegisters.size){
        //Creando exception 0x02
        respPDU = MakeModbusException(22, 2);
    }
    else {
        let values = new Map();

        let AND_MASK = pdu.modbus_data.readUInt16BE(2);
        let OR_MASK = pdu.modbus_data.readUInt16BE(4);

        //calculating value
        let mask_value = (this.holdingRegisters.GetValue(targetRegister) & AND_MASK) | (OR_MASK & ~AND_MASK );
             
        this.holdingRegisters.SetValue(mask_value, targetRegister);

        //Devolviendo un eco de la pdu.
        respPDU = pdu
        values.set(targetRegister, this.holdingRegisters.GetValue(targetRegister));
        this.emit('values', '4x', values);       

    }
    return respPDU;
}

module.exports = MaskHoldingRegister;

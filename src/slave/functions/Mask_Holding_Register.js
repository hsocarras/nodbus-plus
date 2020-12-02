/** 
* @author Hector E. Socarras
* @brief
* Se implementa la funcion 22 del protocolo de modbus.
* Debuelve un objeto pdu con el valor del registro solicitado.
*
* @param objeto pdu
*/

var PDU = require('../../protocol/frame/pdu');

var MaskHoldingRegister = function (pdu){

    var respPDU = new PDU();

    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var targetRegister = pdu.modbus_data.readUInt16BE(0);

     if (targetRegister > this.holdingRegisters.size){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        //this.emit('modbus_exception','ILLEGAL DATA ADDRESS');
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
        return respPDU;

    }
}

module.exports = MaskHoldingRegister;

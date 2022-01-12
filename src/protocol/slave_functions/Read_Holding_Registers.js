/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x03 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de los registros solicitados.
*
*@param objeto pdu
*/

const ReadWordRegister = require('./Read_Word_Register');


var ReadHoldingRegister = function (pdu) {

    
    return ReadWordRegister(pdu, this.holdingRegisters);


}

module.exports = ReadHoldingRegister;

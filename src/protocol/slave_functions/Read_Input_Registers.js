/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x04 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de los registros solicitados.
*
*@param objeto pdu
*/

const ReadWordRegister = require('./Read_Word_Register');


var ReadInputRegister = function (pdu) {

    
    return ReadWordRegister(pdu, this.inputRegisters);


}

module.exports = ReadInputRegister;

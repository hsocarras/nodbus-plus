/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x02 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de las inputs solicitadas.
*
*@param objeto pdu
*/

const ReadBoolRegister = require('./Read_Boolean_Register');


var ReadInputStatus = function (pdu) {   

    return ReadBoolRegister(pdu, this.inputs);
}

module.exports = ReadInputStatus;

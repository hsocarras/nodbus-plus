/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x01 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de las coil solicitadas.
*
*@param objeto pdu
*/


const ReadBoolRegister = require('./Read_Boolean_Register');

var ReadCoilStatus = function (pdu) {

    return ReadBoolRegister(pdu, this.coils);
}

module.exports = ReadCoilStatus;

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


var ForceMultipleCoils = function (pdu){

    var respPDU = new PDU();

    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var startCoil = pdu.modbus_data.readUInt16BE(0);


     if (startCoil >= this.coils.size){
        //Verificando q la coil solicitada exista
        //Creando exception 0x02
        respPDU = MakeModbusException(0x02);

        return respPDU;
    }
    else {

        //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
        var startCoil = pdu.modbus_data.readUInt16BE(0);

        //cantidad de coils a escribir
        var number_points =   pdu.modbus_data.readUInt16BE(2);

        //Datos a forzar
        var forceDataCount = pdu.modbus_data.readUInt8(5);

        let forceData = pdu.modbus_data.slice(5);

        let filletMask = [0x00, 0xFE, 0xFC, 0xF8, 0xF0, 0xE0, 0xC0, 0x80];
        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

        if( (forceData[forceData.length] & filletMask[number_points%8]) != 0x00){
            //Creando exception 0x03
            respPDU = MakeModbusException(0x03);
            return respPDU;

        }
        else{
          let values = new Map();
          for(var i = 0; i < number_points; i++){
            let offset = startCoil + i;
            let val = forceData[Math.floor(i/8)] & masks[i%8]
            this.coils.SetValue(val, offset);
            values.set(offset, val > 0);
          }

          respPDU.modbus_function = 0x0F;
          respPDU.modbus_data = Buffer.alloc(4);
          pdu.modbus_data.copy(respPDU.modbus_data,0,0,4);

          this.emit('values', '0x', values);
          return respPDU;
        }
    }
}

module.exports = ForceMultipleCoils;

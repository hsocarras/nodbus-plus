/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x01 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de las coil solicitadas.
*
*@param objeto pdu
*/

var PDU = require('../../protocol/frame/pdu');


var ReadCoilStatus = function (pdu) {

    var respPDU = new PDU();

    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var initCoil = pdu.modbus_data.readUInt16BE(0);

    //Verificando q la coil solicitada exista
    if(initCoil >= this.coils.size){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        //this.emit('modbus_exception','ILLEGAL DATA ADDRESS');
    }
    else {
        //cantidad de coils a leer
        var numberOfCoils =   pdu.modbus_data.readUInt16BE(2);

        //let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

        //Calculando cantidad de bytes de la respuesta 12%8=1
        //ejemplo 12 coils necesitan 2 bytes
        var byte_count= numberOfCoils % 8 ? Math.floor(numberOfCoils/8+1):(numberOfCoils/8);

        respPDU.modbus_function = 0x01;
        respPDU.modbus_data = Buffer.alloc(byte_count+1);
        respPDU.modbus_data[0]=byte_count;

        //buffer temporal con tamano suficiente para copiar el segmento del registro con las coils solicitadas
        //var coil_segment =  Buffer.alloc(byte_count);
        var coil_segment = this.coils.EncodeRegister(initCoil, numberOfCoils);
        /*
        for(var i = 0; i < numberOfCoils; i++){
          if(this.coils.ReadData(initCoil + i)){
            coil_segment[Math.floor(i/8)] = coil_segment[Math.floor(i/8)] | masks[i%8];
          }
          else coil_segment[Math.floor(i/8)] = coil_segment[Math.floor(i/8)] & (~masks[i%8]);
        }
        */

        //copiando las cois al campo de data de la PDU
        coil_segment.copy(respPDU.modbus_data,1);
    }

    return respPDU;
}

module.exports = ReadCoilStatus;

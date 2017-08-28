/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 05 del protocolo de modbus.
*Debuelve un objeto pdu con el echo del request.
*
*@param objeto pdu
*/

var PDU = require('../pdu');

var ForceSingleCoil = function (pdu){

    var respPDU = new PDU();

    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var targetCoil = pdu.modbus_data.readUInt16BE(0);

    //valor a forzar
    var value = pdu.modbus_data.readUInt16BE(2);

    if(targetCoil >= this.coils.length*8){
        //Verificando q la coil solicitada exista
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        this.errorIndex = 1;

        this.emit('modbus_error',this.errorIndex);

        return respPDU;
    }
    else if (value != 0x0000 & value != 0xFF00 ) {
        //verificando el campo valor sea valido
        //Creando exception 0x03
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x03;

        this.errorIndex = 2;

        this.emit('modbus_error',this.errorIndex);

        return respPDU;
    }
    else {



        //byte donde se encuentra la coil direccionada en el coilRegister
        let index = Math.floor(targetCoil/8);

        //coil position inside byte 0-7
        let offset = targetCoil % 8;

        //creando una mascara para hacer un or
        let mask = new Buffer(1);
        //posicionando el bit 1 en la posicion de la coil.
        //ejemplo supongamos coil 5 dentro del byte; coilPos = 5 entonces mask = 00100000
        mask[0] = 0x01;
        mask[0] = mask[0] << offset;

        if(value == 0xFF00){
          this.coils[index] = this.coils[index] | mask[0];
        }
        else{
            //Invirtiendo para hacer un and ahora mask = 11011111
            mask = ~mask;
            this.coils[index] = this.coils[index] & mask;
        }
        //creando una copia del request
        respPDU =pdu;

        return respPDU;
    }
}

module.exports = ForceSingleCoil;

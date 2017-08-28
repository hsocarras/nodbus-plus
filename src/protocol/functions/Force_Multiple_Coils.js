/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 05 del protocolo de modbus.
*Debuelve un objeto pdu con el echo del request.
*
*@param objeto pdu
*/

var PDU = require('../pdu');
var tools = require('./tools');


var ForceMultipleCoils = function (pdu){

    var respPDU = new PDU();

    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var startCoil = pdu.modbus_data.readUInt16BE(0);


     if (startCoil >= this.coils.length*8){
        //Verificando q la coil solicitada exista
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;

        this.errorIndex = 1;

        this.emit('modbus_error',this.errorIndex);

        return respPDU;
    }
    else {

        //ejemplo escribir 14 coils, del coil  19 a 32 con [01101100 00011001]

        //byte donde se encuentra la coil direccionada en el coilRegister
        var index = Math.floor(startCoil/8);

        //cantidad de coils a escribir
        var number_points =   pdu.modbus_data.readUInt16BE(2);

        //Datos a forzar
        var forceDataCount = pdu.modbus_data.readUInt8(5);

        //numero de ceros de relleno
        var numberPointLastByte = number_points % 8;


        //Creando el buffre un byte mas grande.
        var forceData = new Buffer(forceDataCount+1);

        //copiando los valores a forzar
        //forceData = [01101100 00011001 00000000]
        pdu.modbus_data.copy(forceData,0,5);

        //valores de relleno en el ultimo byte de datos
        // forceData[1] and [1 1 0 0 0 0 0 0]
        var mask = new Buffer(1);
        mask[0] = 0xFF;
        var filledValues = forceData[forceDataCount-2] & (mask << numberPointLastByte)

        //chekeo q los valores de relleno de los bytes de datos sean 0
        // sino creo error exception 0x03
        if( filledValues != 0x00){
            //Creando exception 0x03
            respPDU.modbus_function = pdu.modbus_function | 0x80;
            respPDU.modbus_data[0] = 0x03;

            this.errorIndex = 2;

            this.emit('modbus_exception', 'Illegal Data');

            return respPDU;

        }

        //coil position inside byte 0-7
        var offset = startCoil % 8;

        //creando un bufer de trabajo
        var workBuffer = new Buffer(forceDataCount+1);

        //alineando el buffer de forceData con el buffer coils
        // coils            [23 22 21 20 19 18 17 16] [31 30 29 28 27 26 25 24] [39 38 37 36 35 34 33 32]
        // forceData before [26 25 24 23 22 21 20 19] [ 0  0 32 31 30 29 28 27] [ 0  0  0  0  0  0  0  0]
        //forceData after   [23 22 21 20 19  0  0  0] [31 30 29 28 27 26 25 24] [ 0  0  0  0  0  0  0 32]
        workBuffer = tools.InvertBufferBytes(forceData);
        workBuffer = tools.ShiftBufferBits(workBuffer,offset,'l');
        forceData = tools.InvertBufferBytes(workBuffer);

        //copiando los valores actuales de las coils
        this.coils.copy(workBuffer,0,index,index+forceDataCount+1);

        //Creandoun buffer q contendra los valores forzados
        var forcedValues = new Buffer(forceDataCount + 1);

        for(var i = 0; i < workBuffer.length;i++){
            //solo tengo q ajustar los bytes 0 y final del buffer,
            //los bytes intermedios se copian integros
            if(i == 0){
                //calculando el primer byte
                //primero la mascara con los bits a escribir que seria 0x00000111
                //luego los valores de las coils a mantener dentro del byte
                //[23 22 21 20 19 18 17 16] and [0 0 0 0 0 1 1 1] = [0 0 0 0 0 18 17 16]
                //por ultimo [23 22 21 20 19  0  0  0] or [0 0 0 0 0 18 17 16] para generar el byte
                forcedValues[i]=forceData[i] | (workBuffer[i] & (0xFF >> (8-offset)));
            }
            else if(i == workBuffer.length-1 & i != 0){
                //calculando el primer byte
                //primero la mascara con los bits a escribir que seria 0x11111110
                //luego los valores de las coils a mantener dentro del byte
                //[39 38 37 36 35 34 33 32] and [1 1 1 1 1 1 1 0] = [39 38 37 36 35 34 33 0]
                //por ultimo [ 0  0  0  0  0  0  0 32] or [39 38 37 36 35 34 33 0] para generar el byte
                forcedValues[i]=forceData[i] | (workBuffer[i] & (mask << (number_points%8-(8-offset))));
            }
            else{
                forcedValues[i]=forceData[i];
            }

        }

        forcedValues.copy(this.coils,index);

        respPDU.modbus_function = 0x0F;
        respPDU.modbus_data = new Buffer(4);
        pdu.modbus_data.copy(respPDU.modbus_data,0,0,4);

        return respPDU;
    }
}

module.exports = ForceMultipleCoils;

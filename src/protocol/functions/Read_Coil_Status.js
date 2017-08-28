/*
*@author Hector E. Socarras
*@brief 
*Se implementa la funcion 0x01 del protocolo de modbus. 
*Debuelve un objeto pdu con el valor de las coil solicitadas.
*
*@param objeto pdu
*/

var PDU = require('../pdu');
var tools = require('./tools');

var ReadCoilStatus = function (pdu) {     
   
    var respPDU = new PDU();
    
    //coil inicial ejemplo el coil 20 direccionado como 0x13 (19)
    var initCoil = pdu.modbus_data.readUInt16BE(0);
    
    //Verificando q la coil solicitada exista
    if(initCoil >= this.coils.length*8){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;
        
        this.errorIndex = 1;
        
        this.emit('modbus_error',this.errorIndex);
    }
    else {
        //cantidad de coils a leer
        var numberOfCoils =   pdu.modbus_data.readUInt16BE(2);

        // index del buffer coils donde esta el 20 ejemplo 19/8 = 2 (byte 3, 0 1 2) valores 23-16.
        //redondeado a un entero
        var index = Math.floor(initCoil/8);

        //Calculando cantidad de bytes de la respuesta 12%8=1
        //ejemplo 12 coils necesitan 2 bytes
        var byte_count= numberOfCoils % 8 ? Math.floor(numberOfCoils/8+1):(numberOfCoils/8);

        respPDU.modbus_function = 0x01;
        respPDU.modbus_data = new Buffer(byte_count+1);
        respPDU.modbus_data[0]=byte_count;

        // poscicion en el byte del coil inicial.
        //ejemplo coil 19 esta en el byte 3 y dentro de ese byte ocupa la pos 3 empezando de 0   
        //byte 3 del registro coils es asi [23 22 21 20 19 18 17 16] byte 4 [31 30 29 28 27 26 25 24]
        var offset = initCoil % 8;

        //buffer temporal con tamano suficiente para copiar el segmento del registro con las coils solicitadas
        var coil_segment =  new Buffer(Math.floor(numberOfCoils/8+1));
        
        //copiando los valores de las coil del coil register al bufer temporal
        //[23 22 21 20 19 18 17 16]  [31 30 29 28 27 26 25 24]
        this.coils.copy(coil_segment,0,index,index+coil_segment.length);
        
        //invirtiendo el bufer
        //[31 30 29 28 27 26 25 24] [23 22 21 20 19 18 17 16]
        coil_segment = tools.InvertBufferBytes(coil_segment);
        
        //desplazando a la derecha las coils
        //[0 0 0 31 30 29 28 27] [26 25 24 23 22 21 20 19]
        var tempResult = tools.ShiftBufferBits(coil_segment,offset,'r');

        //ordenando nuevamente el buffer
        //[26 25 24 23 22 21 20 19] [0 0 0 31 30 29 28 27]
        tempResult = tools.InvertBufferBytes(tempResult);
        
        //truncando el buffer result ya q puede ser un byte mayor
        var result = tempResult.slice(0,byte_count);
        
        
        //poniendo a 0 las coils no solicitadas.
        // [26 25 24 23 22 21 20 19] [0 0 0 0 30 29 28 27]
        //uso el primer byte de coil_segment como byte temporal para calcular la mascara
        //si son 12 coils 8 en el primer byte y 4 en el segundo por tanto la mascara seria (8 - 12%8) o 00001111
        coil_segment[0] = 0xFF >> (8 - numberOfCoils % 8);
        
        //si la mascara es 0x00 significa q todo el byte es valido. por tanto la hago 0xFF;
        if(coil_segment[0] == 0x00){
            coil_segment[0] = 0xFF;
        }
        
        result[result.length - 1] = result[result.length - 1] & coil_segment[0];
       
        //copiando las cois al campo de data de la PDU
        result.copy(respPDU.modbus_data,1);
    }
    
    return respPDU;
}

module.exports = ReadCoilStatus;
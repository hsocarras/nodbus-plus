/*
*@author Hector E. Socarras
*@brief 
*Se implementa la funcion 16 del protocolo de modbus. 
*Debuelve un objeto pdu con el valor de los registros solicitados.
*
*@param objeto pdu
*/

var PDU = require('../pdu');

var PresetMultipleRegister = function (pdu) {    
    
     var respPDU = new PDU();
    
    //registro inicial ejemplo el registro 10 direccionado como 0x09 (9)
    var initRegister = pdu.modbus_data.readUInt16BE(0);
   
   if (initRegister > this.holdingRegisters.length/2){
        //Creando exception 0x02
        respPDU.modbus_function = pdu.modbus_function | 0x80;
        respPDU.modbus_data[0] = 0x02;
       
        this.errorIndex = 1;
       
       this.emit('modbus_error',this.errorIndex);
    }   
    else {
        
        // byte de inicio del registro
        var index = initRegister * 2; 
        
        //cantidad de registros a escribir
        var numberOfRegisters =   pdu.modbus_data.readUInt16BE(2);
        
        //Cantidad de datos a forzar
        var forceDataCount = pdu.modbus_data.readUInt8(4);
        
        //Values to force
        var forceData = new Buffer (forceDataCount);
        pdu.modbus_data.copy(forceData,0,5);
        
        //copiando valores en el registro
        forceData.copy(this.holdingRegisters,index);
        
        //creando la respuesta
        respPDU.modbus_function = 0x10;
        respPDU.modbus_data = new Buffer(4);
        pdu.modbus_data.copy(respPDU.modbus_data,0,0,4)
                
    }
    return respPDU;    
}

module.exports = PresetMultipleRegister;
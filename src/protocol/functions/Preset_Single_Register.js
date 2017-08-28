/*
*@author Hector E. Socarras
*@brief 
*Se implementa la funcion 06 del protocolo de modbus. 
*Debuelve un objeto pdu con el valor del registro solicitado.
*
*@param objeto pdu
*/

var PDU = require('../pdu');

var PresetSingleRegister = function (pdu){  
    
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
        
        pdu.modbus_data.copy(this.holdingRegisters,2 * initRegister,2)
        
        //Devolviendo un eco de la pdu.
        respPDU = pdu                     
                
        return respPDU;            
       
    }
}
    
module.exports = PresetSingleRegister;
    
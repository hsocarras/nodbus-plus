/**
** Modbus Master Base Class module.
* Only deal with creating request PDU
* @module protocol/modbus_master
* @author Hector E. Socarras.
* @version 1.0.0
*/


const EventEmitter = require('events');

/**
 * Class representing a modbus master.
 * @extends EventEmitter
*/
class ModbusMaster extends EventEmitter {
    /**
    * Create a Modbus Master.
    */
    constructor(){
        super();         
    }  

   

    /**
    * @brief function to make the request pdu for function code 1 of modbus protocol.  
    * @param {number} startCoil first coil to read, start at 0.
    * @param {number} coilQuantity number of coils to read
    * @return {buffer} pdu buffer.
    */
    readCoilStatusPdu(startCoil = 0, coilQuantity = 1){
         //funcion 01 read coils status
         let reqPduBuffer = Buffer.alloc(5);
         reqPduBuffer[0] = 0x01;        
         reqPduBuffer.writeUInt16BE(startCoil,1);
         reqPduBuffer.writeUInt16BE(coilQuantity,3);        
         return reqPduBuffer;
    }

    /**
    * @brief function to make the request pdu for function code 2 of modbus protocol. 
    * @param {number} startinput first input to read, start at 0.
    * @param {number} inputQuantity number of inputs to read
    * @return {buffer} pdu buffer.
    */
    readInputStatusPdu(startInput = 0, inputQuantity = 1){

        //funcion 02 read inputs status
        let reqPduBuffer = Buffer.alloc(5);
        reqPduBuffer[0] = 0x02;        
        reqPduBuffer.writeUInt16BE(startInput,1);
        reqPduBuffer.writeUInt16BE(inputQuantity,3);        
        return reqPduBuffer;
    }

    /**
    * @brief function to make the request pdu for function code 3 of modbus protocol. 
    * @param {number} startRegister first holding register to read, start at 0.
    * @param {number} registerQuantity number of holding register to read.
    * @return {buffer} pdu buffer.
    */
    readHoldingRegistersPdu(startRegister = 0, registerQuantity = 1){
        //funcion 0x03 read holdings registers
        let reqPduBuffer = Buffer.alloc(5);
        reqPduBuffer[0] = 0x03;        
        reqPduBuffer.writeUInt16BE(startRegister,1);
        reqPduBuffer.writeUInt16BE(registerQuantity,3);        
        return request;        
    }

    /**
    * @brief function to make the request pdu for function code 4 of modbus protocol.  
    * @param {number} startRegister first input register to read, start at 0.
    * @param {number} registerQuantity number of input register to read.
    * @return {buffer} pdu buffer.
    */
    readInputRegistersPdu(startRegister = 0, registerQuantity = 1){
        //funcion 0x04 read inputs registers
        let reqPduBuffer = Buffer.alloc(5);
        reqPduBuffer[0] = 0x04;        
        reqPduBuffer.writeUInt16BE(startRegister, 1);
        reqPduBuffer.writeUInt16BE(registerQuantity, 3);        
        return request;        
    }

    /**
    * @brief function to make the request pdu for function code 5 of modbus protocol.
    * @param {Buffer} values value to force   
    * @param {number} startcoil first coil to write, start at 0 coil        
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    */
    forceSingleCoilPdu(values, startCoil = 0){        
       //funcion 05 write single coil            
       if(values instanceof Buffer){
            let reqPduBuffer = Buffer.alloc(5);
            reqPduBuffer[0] = 0x05;           
            reqPduBuffer.writeUInt16BE(startCoil,1);
            values.copy(reqPduBuffer,3); 
            return reqPduBuffer;  
        }            
        else{
            throw new TypeError('Error, values must be a Buffer', "modbus_master.js", 105);         
        }       
        
    }

    /**
    * @brief function to make the request pdu for function code 6 of modbus protocol.
    * @param {Buffer} values value to force   
    * @param {number} startRegister register to write.
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    */
    presetSingleRegisterPdu(values, startRegister = 0){

        if(values instanceof Buffer){
            //creando la pdu del request
            let reqPduBuffer = Buffer.alloc(5);
            //funcion 06 PresetSingleRegister
            reqPduBuffer[0] = 0x06;            
            reqPduBuffer.writeUInt16BE(startAddres,1);
            values.copy(reqPduBuffer, 3);
           
            return reqPduBuffer;
        }            
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 130);        
        }
    }

    /**
    * @brief function to make the request pdu for function code 15 of modbus protocol.
    * @param {Buffer} values value to force.
    * @param {number} startCoil first coil to write, start at 0 coil.
    * @param {number} coilQuantity number of coils to read
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    */
    forceMultipleCoilsPdu(values, startCoil = 0, coilQuantity){
        //function 15 force multiples coils
        if(values instanceof Buffer){
            //creando la pdu del request
            let reqPduBuffer = Buffer.alloc(6+values.length);
            reqPduBuffer[0] = 0x0F;            
            reqPduBuffer.writeUInt16BE(startCoil, 1);
            reqPduBuffer.writeUInt16BE(coilQuantity,3);
            reqPduBuffer[5]= values.length;
            values.copy(reqPduBuffer, 6);            
            return reqPduBuffer;
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 156);          
        }

    }

    /**
    * @brief function to make the request pdu for function code 16 of modbus protocol.
    * @param {Buffer} values value to write.
    * @param {number} startRegister register to write.
    * @param {number} registerQuantity number of holding register to read.
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    */
    presetMultipleRegistersPdu(values, startRegister = 0, registerQuantity){
       //function 16 write multiples coils
       if(values instanceof Buffer){
            //creando la pdu del request
            let reqPduBuffer = Buffer.alloc(6 + values.length);
            reqPduBuffer[0] = 0x10;            
            reqPduBuffer.writeUInt16BE(startRegister, 1);
            reqPduBuffer.writeUInt16BE(registerQuantity, 3);
            reqPduBuffer[5]= values.length;
            values.copy(reqPduBuffer, 6);            
            return reqPduBuffer;
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 180);            
        }
        
    }

    /**
    * @brief function to make the request pdu for function code 22 of modbus protocol.
    * @param {Buffer} values value to write.
    * @param {number} startRegister register to write.  
    * @return {buffer} pdu buffer
     @throws {TypeError} if values is not a buffer's instance.
    */
    maskHoldingRegisterPdu( values, startRegister = 0){
        //function 22 mask holding register
        if(values instanceof Buffer){
            let reqPduBuffer = Buffer.alloc(7);
            reqPduBuffer[0] = 0x16;
            reqPduBuffer.writeUInt16BE(startRegister, 1);              
            values.copy(reqPduBuffer, 3); 
            return reqPduBuffer;
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 203);            
        }

    }

    /**
    * @brief function to make the request pdu for function code 23 of modbus protocol.
    * @param {Buffer} values values to write.
    * @param {number} writeStartingAddress first register to write.
    * @param {number} quantityToWrite number of registers to weite
    * @param {number} readStartingAddress first register to read.
    * @param {number} quantitytoRead number of registers to read    
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    */
    readWriteMultipleRegistersPdu(values, writeStartingAddress, quantityToWrite, readStartingAddress, quantitytoRead){
        //function 23 write and read multiples registers
       if(values instanceof Buffer){
        //creando la pdu del request
        let reqPduBuffer = Buffer.alloc(10 + values.length);
        reqPduBuffer[0] = 0x17;            
        reqPduBuffer.writeUInt16BE(readStartingAddress, 1);
        reqPduBuffer.writeUInt16BE(quantitytoRead, 3);
        reqPduBuffer.writeUInt16BE(writeStartingAddress, 5);
        reqPduBuffer.writeUInt16BE(quantityToWrite, 7);
        reqPduBuffer[9]= values.length;
        values.copy(reqPduBuffer, 10);            
        return reqPduBuffer;
    }
    else{
        throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 180);            
    }
    }

    /**
     * @brief This function calculate the necesary buffer to realize the desired mask function
     * @param {int[]} valueArray: value 1 on position that want to be true, 0 on position that
    * want to be false and -1 in position that must be unchanged.
    * example register value:           [0 1 1 0   1 1 0 0    0 1 1 1   1 0 0 1] 0x9E36
    *         set register value:       [1 0 0 1  -1 0 1 -1  -1 -1 0 0  1 1 -1 0]
    *         final register value:     [1 0 0 1   1 0 1 0    0 1 0 0   1 1 0 0] 0x3259
    * @returns {Buffer} Buffer value with AND MASK and OR MASK for modbus 0x16 function.
    */
    getMaskRegisterBuffer(valueArray){

        let value = Buffer.alloc(4);
        let AND_Mask = 0x00;
        let OR_Mask = 0xFFFF;
        let tempMask = 1;

        for (let i = 0; i <valueArray.length; i++){
            
            if(valueArray[i] == 1){
            //AND_MASK = 0;
            //OR_Mask = 1;        
            }
            else if(value[i] == 0){ 
            //AND_MASK = 0;       
            OR_Mask = OR_Mask  & (~tempMask); //OR_MASK = 0
            }
            else{
            AND_Mask = AND_Mask | tempMask;
            }
            
            tempMask = tempMask << 1; 
        }   
    
        value.writeUInt16BE(AND_Mask);
        value.writeUInt16BE(OR_Mask, 2);

        return value;

    }

    
}

module.exports = ModbusMaster;

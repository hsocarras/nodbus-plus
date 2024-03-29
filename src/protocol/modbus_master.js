/**
** Modbus Master Base Class module.
* Only deal with creating request PDU
* @module protocol/modbus_master
* @author Hector E. Socarras.
* @version 1.0.0
*/


const EventEmitter = require('events');
const utils = require('./utils');

/**
 * Class representing a modbus master.
 * @extends EventEmitter
*/
class ModbusClient extends EventEmitter {
    /**
    * Create a Modbus Master.
    */
    constructor(){
        super();            
        
    }  

   

    /**
    * Function to make the request pdu for function code 1 of modbus protocol  
    * @param {number} startCoil first coil to read, start at 0
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
    * Function to make the request pdu for function code 2 of modbus protocol. 
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
    * Function to make the request pdu for function code 3 of modbus protocol. 
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
        return reqPduBuffer;        
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
        return reqPduBuffer;        
    }

    /**
    * @brief function to make the request pdu for function code 5 of modbus protocol.
    * @param {Buffer} value value to force   
    * @param {number} startcoil first coil to write, start at 0 coil        
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is diferent than 2.
    */
    forceSingleCoilPdu(value, startCoil = 0){        
       //funcion 05 write single coil            
       if(value instanceof Buffer){
            if(value.length == 2){
                let reqPduBuffer = Buffer.alloc(5);
                reqPduBuffer[0] = 0x05;           
                reqPduBuffer.writeUInt16BE(startCoil,1);
                value.copy(reqPduBuffer,3); 
                return reqPduBuffer;  
            }
            else{
                throw new RangeError('Error, value length must be 2', 'modbus_master.js', 180);            
            }
        }            
        else{
            throw new TypeError('Error, value must be a Buffer', "modbus_master.js", 105);         
        }       
        
    }

    /**
    * Function to make the request pdu for function code 6 of modbus protocol.
    * @param {Buffer} value value to force   
    * @param {number} startRegister register to write.
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is diferent than 2.
    */
    presetSingleRegisterPdu(value, startRegister = 0){

        if(value instanceof Buffer){
            if(value.length == 2){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(5);
                //funcion 06 PresetSingleRegister
                reqPduBuffer[0] = 0x06;            
                reqPduBuffer.writeUInt16BE(startRegister, 1);
                value.copy(reqPduBuffer, 3);
            
                return reqPduBuffer;
            }
            else{
                throw new RangeError('Error, value length must be 2', 'modbus_master.js', 180);            
            }
        }            
        else{
            throw new TypeError('Error, value must be a Buffer', 'modbus_master.js', 130);        
        }
    }

    /**
    * Function to make the request pdu for function code 15 of modbus protocol.
    * @param {Buffer} values value to force.
    * @param {number} startCoil first coil to write, start at 0 coil.
    * @param {number} coilQuantity number of coils to read
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is greater than 246.
    */
    forceMultipleCoilsPdu(values, startCoil, coilQuantity){
        //function 15 force multiples coils
        if(values instanceof Buffer){
            if(values.length <= 246){
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
                throw new RangeError('Error, values length exceed the  max pdu length', 'modbus_master.js', 180);            
            }
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 156);          
        }

    }

    /**
    * Function to make the request pdu for function code 16 of modbus protocol.
    * @param {Buffer} values value to write.
    * @param {number} startRegister first register to write.
    * @param {number} registerQuantity number of holding register to write.
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is greater than 246.
    */
    presetMultipleRegistersPdu(values, startRegister, registerQuantity = Math.floor(values.length/2)){
       //function 16 write multiples coils
       if(values instanceof Buffer){
            if(values.length <= 246){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(6 + 2*registerQuantity);
                reqPduBuffer[0] = 0x10;            
                reqPduBuffer.writeUInt16BE(startRegister, 1);
                reqPduBuffer.writeUInt16BE(registerQuantity, 3);
                reqPduBuffer[5]= 2*registerQuantity;
                values.copy(reqPduBuffer, 6);            
                return reqPduBuffer;
            }
            else{
                throw new RangeError('Error, values length exceed the  max pdu length', 'modbus_master.js', 180);            
            }
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
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is diferent than 4.
    */
    maskHoldingRegisterPdu( values, startRegister = 0){
        //function 22 mask holding register
        if(values instanceof Buffer){
            if(values.length == 4){
                let reqPduBuffer = Buffer.alloc(7);
                reqPduBuffer[0] = 0x16;
                reqPduBuffer.writeUInt16BE(startRegister, 1);              
                values.copy(reqPduBuffer, 3); 
                return reqPduBuffer;
            }
            else{
                throw new RangeError('Error, values length diferent than 4', 'modbus_master.js');            
            }
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 203);            
        }

    }

    /**
    * @brief function to make the request pdu for function code 23 of modbus protocol.
    * @param {Buffer} values values to write.    
    * @param {number} readStartingAddress first register to read.
    * @param {number} quantitytoRead number of registers to read 
    * @param {number} writeStartingAddress first register to write.
    * @param {number} quantityToWrite number of registers to weite   
    * @return {buffer} pdu buffer.
    * @throws {TypeError} if values is not a buffer's instance.
    * @throws {RangeError} if values's length is greater than 242.
    */
    readWriteMultipleRegistersPdu(values, readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite = Math.floor(values.length/2)){
         //function 23 write and read multiples registers
        if(values instanceof Buffer){
            if(values.length <= 242){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(10 + quantityToWrite*2);
                reqPduBuffer[0] = 0x17;            
                reqPduBuffer.writeUInt16BE(readStartingAddress, 1);
                reqPduBuffer.writeUInt16BE(quantitytoRead, 3);
                reqPduBuffer.writeUInt16BE(writeStartingAddress, 5);
                reqPduBuffer.writeUInt16BE(quantityToWrite, 7);
                reqPduBuffer[9]= quantityToWrite*2;
                values.copy(reqPduBuffer, 10);            
                return reqPduBuffer;
            }
            else{
                throw new RangeError('Error, values length exceed the  max pdu length', 'modbus_master.js', 180);            
            }
        }
        else{
            throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 180);            
        }
    }

    /**
     * Function to get a buffer from a bool value for function 5 of modbus protocol.
     * @param {boolean} value Bool value.
     * @return {Buffer} A buffer that can be 0x0000 for false or 0xFF00 for true value
     */
    boolToBuffer(value){
        let valBuffer = Buffer.alloc(2)
        if(value){
            valBuffer[0] = 0xFF;
        }
        return valBuffer
    }

    
}

ModbusClient.prototype.getMaskRegisterBuffer = utils.getMaskRegisterBuffer;

ModbusClient.prototype.boolsToBuffer = utils.boolsToBuffer;

ModbusClient.prototype.getWordFromBuffer = utils.getWordFromBuffer;

ModbusClient.prototype.setWordToBuffer = utils.setWordToBuffer;

module.exports = ModbusClient;

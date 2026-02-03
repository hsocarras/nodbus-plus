/**
 * Modbus Master Base Class module.
 * 
 * This module provides the `ModbusClient` class, which implements the logic for constructing Modbus request PDUs
 * (Protocol Data Units) for all standard Modbus function codes. The class is designed to be used as a base for
 * Modbus master/client implementations, handling only the creation of request PDUs and not the transport or response parsing.
 *
 * The class includes methods for generating request PDUs for reading and writing coils, discrete inputs, holding registers,
 * input registers, and for advanced operations such as mask write and read/write multiple registers.
 *
 * @module protocol/modbus_master
 * @author Hector E. Socarras
 * @version 1.0.0
 *
 * @example
 * const ModbusClient = require('./modbus_master');
 * const client = new ModbusClient();
 * const readCoilsPdu = client.readCoilStatusPdu(0, 8); // Create a PDU to read 8 coils starting at address 0
 */


const EventEmitter = require('events');
const utils = require('./utils');

/**
 * Class representing a Modbus master/client for constructing Modbus request PDUs.
 *
 * The `ModbusClient` class provides methods to generate request Protocol Data Units (PDUs)
 * for all standard Modbus function codes, including reading and writing coils, discrete inputs,
 * holding registers, input registers, and advanced operations such as mask write and read/write multiple registers.
 * 
 * This class is intended to be used as a base for Modbus master/client implementations. It handles
 * only the creation of request PDUs and does not manage transport or response parsing.
 *
 * @extends EventEmitter
 *
 * @example
 * const ModbusClient = require('./modbus_master');
 * const client = new ModbusClient();
 * const pdu = client.readCoilStatusPdu(0, 8); // Create a PDU to read 8 coils starting at address 0
 */
class ModbusClient extends EventEmitter {
    
    constructor(){
        super();            
        
    }  
   

    /**
     * Constructs a Modbus request PDU for reading coil status (Function Code 01).
     *
     * Generates a request PDU to read the status of one or more coils starting at the specified address.
     * The resulting buffer can be used to create an ADU message to be sent to a modbus server.
     *
     * @param {number} startCoil - The address of the first coil to read (zero-based).
     * @param {number} coilQuantity - The number of coils to read.
     * @returns {Buffer} The request PDU buffer.
     *
     * @example
     * // Create a PDU to read 8 coils starting at address 0
     * const pdu = client.readCoilStatusPdu(0, 8);
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
     * Constructs a Modbus request PDU for reading discrete input status (Function Code 02).
     *
     * Generates a request PDU to read the status of one or more discrete inputs starting at the specified address.
     * The resulting buffer can be used to create an ADU message to request the state of discrete inputs.
     *
     * @param {number} startInput - The address of the first discrete input to read (zero-based).
     * @param {number} inputQuantity - The number of discrete inputs to read.
     * @returns {Buffer} The request PDU buffer.
     *
     * @example
     * // Create a PDU to read 8 discrete inputs starting at address 0
     * const pdu = client.readInputStatusPdu(0, 8);
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
     * Constructs a Modbus request PDU for reading holding registers (Function Code 03).
     *
     * Generates a request PDU to read the value of one or more holding registers starting at the specified address.
     * The resulting buffer can be used to create an ADU message to request the contents of holding registers.
     *
     * @param {number} startRegister - The address of the first holding register to read (zero-based).
     * @param {number} registerQuantity - The number of holding registers to read.
     * @returns {Buffer} The request PDU buffer.
     *
     * @example
     * // Create a PDU to read 4 holding registers starting at address 10
     * const pdu = client.readHoldingRegistersPdu(10, 4);
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
     * Constructs a Modbus request PDU for reading input registers (Function Code 04).
     *
     * Generates a request PDU to read the value of one or more input registers starting at the specified address.
     * The resulting buffer can be used to create an ADU message to request the contents of input registers.
     *
     * @param {number} startRegister - The address of the first input register to read (zero-based).
     * @param {number} registerQuantity - The number of input registers to read.
     * @returns {Buffer} The request PDU buffer.
     *
     * @example
     * // Create a PDU to read 4 input registers starting at address 10
     * const pdu = client.readInputRegistersPdu(10, 4);
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
     * Constructs a Modbus request PDU for writing a single coil (Function Code 05).
     *
     * Generates a request PDU to force a single coil to a specified value (ON or OFF) at the given address.
     * The value must be a Buffer of length 2, typically 0xFF00 for ON or 0x0000 for OFF.
     *
     * @param {Buffer} value - Buffer containing the value to force (length 2: 0xFF00 for ON, 0x0000 for OFF).
     * @param {number} [startCoil=0] - The address of the coil to write (zero-based).
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If value is not a Buffer.
     * @throws {RangeError} If value's length is not 2.
     *
     * @example
     * // Create a PDU to force coil 5 ON
     * const pdu = client.forceSingleCoilPdu(Buffer.from([0xFF, 0x00]), 5);
     */
    forceSingleCoilPdu(value, startCoil = 0){        
       //funcion 05 write single coil            
       if(Buffer.isBuffer(value)){
            if(value.length == 2){
                let reqPduBuffer = Buffer.alloc(5);
                reqPduBuffer[0] = 0x05;           
                reqPduBuffer.writeUInt16BE(startCoil,1);
                value.copy(reqPduBuffer,3); 
                return reqPduBuffer;  
            }
            else{
                throw new RangeError('Error, value length must be 2');
            }
        }            
        else{
            throw new TypeError('Error, value must be a Buffer');
        }       
        
    }

    /**
     * Constructs a Modbus request PDU for writing a single holding register (Function Code 06).
     *
     * Generates a request PDU to write a single holding register to a specified value at the given address.
     * The value must be a Buffer of length 2, representing the 16-bit value to write.
     *
     * @param {Buffer} value - Buffer containing the value to write (length 2).
     * @param {number} [startRegister=0] - The address of the register to write (zero-based).
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If value is not a Buffer.
     * @throws {RangeError} If value's length is not 2.
     *
     * @example
     * // Create a PDU to write value 0x1234 to register 7
     * const pdu = client.presetSingleRegisterPdu(Buffer.from([0x12, 0x34]), 7);
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
                throw new RangeError('Error, value length must be 2');
            }
        }            
        else{
            throw new TypeError('Error, value must be a Buffer');
        }
    }

    /**
     * Constructs a Modbus request PDU for writing multiple coils (Function Code 15).
     *
     * Generates a request PDU to force multiple coils to specified values starting at the given address.
     * The values parameter must be a Buffer containing the packed coil values (LSB first).
     *
     * @param {Buffer} values - Buffer containing the packed coil values to write.
     * @param {number} startCoil - The address of the first coil to write (zero-based).
     * @param {number} coilQuantity - The number of coils to write.
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If values is not a Buffer.
     * @throws {RangeError} If values' length is greater than 246.
     *
     * @example
     * // Create a PDU to force 10 coils starting at address 0
     * const values = Buffer.from([0xCD, 0x01]); // 10 coils packed
     * const pdu = client.forceMultipleCoilsPdu(values, 0, 10);
     */
    forceMultipleCoilsPdu(values, startCoil, coilQuantity){
        //function 15 force multiples coils
        if(Buffer.isBuffer(values)){
            if(values.length <= 246){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(6 + values.length);
                reqPduBuffer[0] = 0x0F;            
                reqPduBuffer.writeUInt16BE(startCoil, 1);
                reqPduBuffer.writeUInt16BE(coilQuantity, 3);
                reqPduBuffer[5] = values.length;
                values.copy(reqPduBuffer, 6);            
                return reqPduBuffer;
            } else {
                throw new RangeError(`Values length of ${values.length} exceeds the max PDU data length of 247.`);
            }
        } else {
            throw new TypeError('Error, values must be a Buffer');
        }
    }

    /**
     * Constructs a Modbus request PDU for writing multiple holding registers (Function Code 16).
     *
     * Generates a request PDU to write multiple holding registers to specified values starting at the given address.
     * The values parameter must be a Buffer containing the register values (each register is 2 bytes, big-endian).
     *
     * @param {Buffer} values - Buffer containing the register values to write.
     * @param {number} startRegister - The address of the first register to write (zero-based).
     * @param {number} [registerQuantity=Math.floor(values.length/2)] - The number of holding registers to write.
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If values is not a Buffer.
     * @throws {RangeError} If values' length is greater than 246.
     *
     * @example
     * // Create a PDU to write 3 registers starting at address 10
     * const values = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
     * const pdu = client.presetMultipleRegistersPdu(values, 10, 3);
     */
    presetMultipleRegistersPdu(values, startRegister, registerQuantity = Math.floor(values.length/2)){
       //function 16 write multiples coils
       if(Buffer.isBuffer(values)){
            if(values.length <= 246){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(6 + values.length);
                reqPduBuffer[0] = 0x10;            
                reqPduBuffer.writeUInt16BE(startRegister, 1);
                reqPduBuffer.writeUInt16BE(registerQuantity, 3);
                reqPduBuffer[5] = values.length;
                values.copy(reqPduBuffer, 6);            
                return reqPduBuffer;
            } else {
                throw new RangeError(`Values length of ${values.length} exceeds the max PDU data length of 246.`);
            }
        } else {
            throw new TypeError('Error, values must be a Buffer');
        }
    }

    /**
     * Constructs a Modbus request PDU for the Mask Write Register function (Function Code 22).
     *
     * Generates a request PDU to modify the contents of a single holding register using AND and OR masks.
     * The values parameter must be a Buffer of length 4, containing the AND mask (2 bytes) and OR mask (2 bytes).
     *
     * @param {Buffer} values - Buffer containing the AND mask and OR mask (length 4: [AND_H, AND_L, OR_H, OR_L]).
     * @param {number} [startRegister=0] - The address of the register to mask (zero-based).
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If values is not a Buffer.
     * @throws {RangeError} If values' length is not 4.
     *
     * @example
     * // Create a PDU to mask register 4 with AND mask 0xFF00 and OR mask 0x00F0
     * const values = Buffer.from([0xFF, 0x00, 0x00, 0xF0]);
     * const pdu = client.maskHoldingRegisterPdu(values, 4);
     */
    maskHoldingRegisterPdu( values, startRegister = 0){
        //function 22 mask holding register
        if(Buffer.isBuffer(values)){
            if(values.length == 4){
                let reqPduBuffer = Buffer.alloc(7);
                reqPduBuffer[0] = 0x16;
                reqPduBuffer.writeUInt16BE(startRegister, 1);              
                values.copy(reqPduBuffer, 3); 
                return reqPduBuffer;
            } else {
                throw new RangeError('Error, values length must be 4');
            }
        }
        else{
            throw new TypeError('Error, values must be a Buffer');
        }
    }

     /**
     * Constructs a Modbus request PDU for the Read/Write Multiple Registers function (Function Code 23).
     *
     * Generates a request PDU to read and write multiple holding registers in a single operation.
     * The values parameter must be a Buffer containing the register values to write (each register is 2 bytes, big-endian).
     *
     * @param {Buffer} values - Buffer containing the register values to write.
     * @param {number} readStartingAddress - The address of the first register to read (zero-based).
     * @param {number} quantitytoRead - The number of registers to read.
     * @param {number} writeStartingAddress - The address of the first register to write (zero-based).
     * @param {number} [quantityToWrite=Math.floor(values.length/2)] - The number of registers to write.
     * @returns {Buffer} The request PDU buffer.
     * @throws {TypeError} If values is not a Buffer.
     * @throws {RangeError} If values' length is greater than 242.
     *
     * @example
     * // Create a PDU to read 2 registers from address 0 and write 2 registers to address 10
     * const values = Buffer.from([0x12, 0x34, 0x56, 0x78]);
     * const pdu = client.readWriteMultipleRegistersPdu(values, 0, 2, 10, 2);
     */
    readWriteMultipleRegistersPdu(values, readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite = Math.floor(values.length/2)){
         //function 23 write and read multiples registers
        if(Buffer.isBuffer(values)){
            if(values.length <= 242){
                //creando la pdu del request
                let reqPduBuffer = Buffer.alloc(10 + values.length);
                reqPduBuffer[0] = 0x17;            
                reqPduBuffer.writeUInt16BE(readStartingAddress, 1);
                reqPduBuffer.writeUInt16BE(quantitytoRead, 3);
                reqPduBuffer.writeUInt16BE(writeStartingAddress, 5);
                reqPduBuffer.writeUInt16BE(quantityToWrite, 7);
                reqPduBuffer[9] = values.length;
                values.copy(reqPduBuffer, 10);            
                return reqPduBuffer;
            } else {
                throw new RangeError(`Values length of ${values.length} exceeds the max PDU data length of 242.`);
            }
        } else {
            throw new TypeError('Error, values must be a Buffer');
        }
    }

    /**
     * Converts a boolean value to a Modbus coil value buffer for Function Code 05 (Write Single Coil).
     *
     * Returns a Buffer of length 2 representing the Modbus encoding for a coil value:
     * - `true`  → Buffer [0xFF, 0x00] (ON)
     * - `false` → Buffer [0x00, 0x00] (OFF)
     *
     * @param {boolean} value - Bool value to convert.
     * @returns {Buffer} A buffer that is 0xFF00 for true or 0x0000 for false.
     *
     * @example
     * // Get Modbus buffer for ON
     * const buf = client.boolToBuffer(true); // Buffer [0xFF, 0x00]
     * // Get Modbus buffer for OFF
     * const buf2 = client.boolToBuffer(false); // Buffer [0x00, 0x00]
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

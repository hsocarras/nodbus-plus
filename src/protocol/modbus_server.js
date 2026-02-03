/**
 * @fileoverview
 * Modbus Server Base Class module. Provides a base implementation for a Modbus server stack
 * that processes Modbus Protocol Data Units (PDUs) and manages Modbus data models (coils, inputs, registers).
 * 
 * This module defines the `ModbusServer` class, which extends Node.js `EventEmitter` and implements
 * core Modbus server logic, including:
 * - Initialization of Modbus data buffers (coils, discrete inputs, holding registers, input registers)
 * - Handling of Modbus function codes and dispatching to service handlers
 * - Processing of standard Modbus requests (read/write coils/registers, mask write, etc.)
 * - Exception response generation and event emission for error/exception handling
 * - Low-level utilities for bit/word access in Modbus buffers
 * 
 * The class is designed to be extended or instantiated for custom Modbus server implementations.
 * 
 * @module protocol/modbus-server
 * @author Hector E. Socarras
 * @version 1.0.1
 * 
 * @example
 * const ModbusServer = require('./modbus_server');
 * const server = new ModbusServer();
 * 
 * server.on('exception', (fnCode, exCode, msg) => {
 *   console.error(`Modbus exception: ${msg}`);
 * });
 * 
 * // Process a Modbus request PDU
 * const responsePdu = server.processReqPdu(requestPdu);
 */


const EventEmitter = require('node:events');
const { Buffer } = require('node:buffer');
const utils = require('./utils');

//define max number of coil, inputs or register
const MAX_ITEM_NUMBER = 65535;

/**
 * Default configuration for the Modbus TCP server.
 * This configuration sets the maximum number of inputs, coils, holding registers, and input registers.
 * @constant
 * @type {Object}
 * @property {number} inputs - Maximum number of inputs (default: 2048).    
 * @property {number} coils - Maximum number of coils (default: 2048).
 * @property {number} holdingRegisters - Maximum number of holding registers (default: 2048).
 * @property {number} inputRegisters - Maximum number of input registers (default: 204
 */
const defaultCfg = {
    inputs : 2048,      //total number of inputs, reference 1x
    coils : 2048,       //total number of coils, reference 0x
    holdingRegisters : 2048,    //total number of holding registers, reference 4x
    inputRegisters : 2048       //total number of input registers, reference 3x
}

/**
 * Class representing a Modbus server (slave).
 * 
 * The `ModbusServer` class provides a base implementation for a Modbus server stack,
 * managing Modbus data models (coils, discrete inputs, holding registers, input registers)
 * and processing Modbus Protocol Data Units (PDUs). It extends Node.js `EventEmitter` to
 * emit events for exceptions, errors, and write operations.
 * 
 * This class supports standard Modbus function codes for reading and writing coils and registers,
 * mask write, and read/write multiple registers. It is designed to be extended or instantiated
 * for custom Modbus server implementations.
 * 
 * ### Events
 * - `exception(fnCode, exCode, msg)`: Emitted when a Modbus exception response is generated.
 * - `error(error)`: Emitted on internal server errors.
 * - `write-coils(address, count)`: Emitted when coils are written.
 * - `write-registers(address, count)`: Emitted when registers are written.
 * 
 * ### Example
 * ```js
 * const ModbusServer = require('./modbus_server');
 * const server = new ModbusServer();
 * 
 * server.on('exception', (fnCode, exCode, msg) => {
 *   console.error(`Modbus exception: ${msg}`);
 * });
 * 
 * // Process a Modbus request PDU
 * const responsePdu = server.processReqPdu(requestPdu);
 * ```
 * 
 * @extends EventEmitter
 * @class
 * @param {object} [mbServerCfg] - Configuration object with the following properties:
 *   @param {number} [mbServerCfg.inputs=2048] - Number of discrete inputs (1x reference).
 *   @param {number} [mbServerCfg.coils=2048] - Number of coils (0x reference).
 *   @param {number} [mbServerCfg.holdingRegisters=2048] - Number of holding registers (4x reference, 2 bytes each).
 *   @param {number} [mbServerCfg.inputRegisters=2048] - Number of input registers (3x reference, 2 bytes each).
 */ 
class ModbusServer extends EventEmitter {
    /**
     * Create a new ModbusServer instance.
     *
     * Initializes Modbus data buffers for coils, discrete inputs, holding registers, and input registers
     * according to the provided configuration or default values. Sets up supported Modbus function codes
     * and exposes them via the `supportedFunctionCode` property.
     *
     * @constructor
     * @param {object} [mbServerCfg=defaultCfg] - Optional configuration object.
     * @property {number} [mbTcpServercfg.inputs=2048] - Maximum number of inputs.
     * @property {number} [mbTcpServercfg.coils=2048] - Maximum number of coils.
     * @property {number} [mbTcpServercfg.holdingRegisters=2048] - Maximum number of holding registers.
     * @property {number} [mbTcpServercfg.inputRegisters=2048] - Maximum number of input registers.
     *
     * @example
     * const ModbusServer = require('./modbus_server');
     * const server = new ModbusServer({ coils: 1024, holdingRegisters: 512 });
     */
    constructor(mbServerCfg = defaultCfg){
        super();       

        var self = this;

        //arguments check
        if(mbServerCfg.inputs == undefined){mbServerCfg.inputs = defaultCfg.inputs;}
        if(mbServerCfg.coils == undefined){ mbServerCfg.coils = defaultCfg.coils;}        
        if(mbServerCfg.holdingRegisters == undefined){mbServerCfg.holdingRegisters = defaultCfg.holdingRegisters;}
        if(mbServerCfg.inputRegisters == undefined){mbServerCfg.inputRegisters = defaultCfg.inputRegisters;}        
        
        //Defining internal function codes
        this._internalFunctionCode = new Map();
        this._internalFunctionCode.set(1, 'readCoilsService');
        this._internalFunctionCode.set(2, 'readDiscreteInputsService');
        this._internalFunctionCode.set(3, 'readHoldingRegistersService');
        this._internalFunctionCode.set(4, 'readInputRegistersService');
        this._internalFunctionCode.set(5, 'writeSingleCoilService');
        this._internalFunctionCode.set(6, 'writeSingleRegisterService');
        this._internalFunctionCode.set(15, 'writeMultipleCoilsService');
        this._internalFunctionCode.set(16, 'writeMultipleRegistersService');
        this._internalFunctionCode.set(22, 'maskWriteRegisterService');
        this._internalFunctionCode.set(23, 'readWriteMultipleRegistersService');
        // Getter for supported function codes
        Object.defineProperty(self, 'supportedFunctionCode',{
            get: function(){
              return this._internalFunctionCode.keys();
            }
        }) 

        const allocateBuffer = (count, itemSize, isRegister = false) => {
            if (typeof count !== 'number' || count <= 0) {
                return Buffer.alloc(0);
            }
            const itemCount = Math.min(count, MAX_ITEM_NUMBER);
            const bufferSize = isRegister ? itemCount * itemSize : Math.ceil(itemCount / itemSize);
            return Buffer.alloc(bufferSize);
        };

        /**
         * Holding Registers.
         * @type {Buffer}
         * @public
         * @description Buffer containing the holding registers (4x reference).
         */
        this.holdingRegisters = allocateBuffer(mbServerCfg.holdingRegisters, 2, true);

        /**
        * Input Registers.
        * @type {Buffer}
        * @public
        * @description Buffer containing the inputs registers (3x reference).
        */
        this.inputRegisters = allocateBuffer(mbServerCfg.inputRegisters, 2, true);
        
        /**
        * Inputs. Reference 1x.
        * @type {Buffer}
        * @public
        * @description Buffer containing the discrete inputs (1x reference).
        */        
        this.inputs = allocateBuffer(mbServerCfg.inputs, 8, false);


        /**
        * Coils. Reference 0x        
        * @type {Buffer}
        * @public
        * @description Buffer containing the coils (0x reference).
        */
        this.coils = allocateBuffer(mbServerCfg.coils, 8, false);

        

    }  

    /**
     * Main server function. Entry point for client request processing.
     *
     * Processes a Modbus request Protocol Data Unit (PDU), dispatches to the appropriate service handler
     * based on the function code, and returns a response PDU. Handles Modbus exceptions and emits events
     * for errors and exceptions.
     *
     * @param {Buffer} reqPduBuffer - Buffer containing the Modbus request PDU (function code + data).
     * @returns {Buffer} Buffer containing the Modbus response PDU.
     * @fires ModbusServer#exception
     * @fires ModbusServer#error
     *
     * @example
     * const requestPdu = Buffer.from([0x03, 0x00, 0x00, 0x00, 0x02]); // Read Holding Registers
     * const responsePdu = server.processReqPdu(requestPdu);
     */
    processReqPdu(reqPduBuffer) {

        if (!Buffer.isBuffer(reqPduBuffer) || reqPduBuffer.length < 1) {
            // Invalid request, return exception 3 (Illegal Data Value)
            return this.makeExceptionResPdu(0, 3);
        }

        let self = this;
        let functionCode = reqPduBuffer[0];      

        if (!this._internalFunctionCode.has(functionCode)) {
            // Unsupported function code, return exception 1 (Illegal Function)
            return this.makeExceptionResPdu(functionCode, 1);
        }

        try {
            // Extract PDU data (everything after the function code)
            const reqPduData = reqPduBuffer.subarray(1);
            const serviceName = this._internalFunctionCode.get(functionCode);

            if (typeof this[serviceName] !== 'function') {
                // Service handler not implemented, return exception 4
                let e = new Error(`Service handler for function code ${functionCode} bad implementation.`);
                this.emit('error', e);
                return this.makeExceptionResPdu(functionCode, 4);
            }

            return this[serviceName](reqPduData);
        } catch (e) {
            // Internal error, return exception 4 (Slave Device Failure)
            this.emit('error', e);
            return this.makeExceptionResPdu(functionCode, 4);
        }  

    }    
    
    
    /**
     * Builds a Modbus exception response PDU and emits an exception event.
     *
     * This function creates a 2-byte buffer containing the exception function code (original function code OR'ed with 0x80)
     * and the exception code. It emits the 'exception' event with a human-readable message for the exception code.
     *
     * @param {number} mbFunctionCode - Modbus function code that caused the exception.
     * @param {number} exceptionCode - Modbus exception code (see Modbus spec).
     * @fires ModbusServer#exception
     * @returns {Buffer} Exception response PDU buffer.
     *
     * @example
     * // Example: return exception for illegal function
     * const exRes = server.makeExceptionResPdu(3, 1);
     * // exRes = <Buffer 83 01>
     */
    makeExceptionResPdu(mbFunctionCode,  exceptionCode){
      
        //setting modbus function to exception
        let excepFunctionCode = mbFunctionCode | 0x80;
        //setting exeption code
        let excepResBuffer = Buffer.alloc(2);
        excepResBuffer[0] = excepFunctionCode;
        excepResBuffer[1] = exceptionCode;
    
        switch(exceptionCode){
            case 1:            
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL FUNCTION');  
            break;
            case 2:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL DATA ADDRESS');
                break;
            case 3:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL DATA VALUE');
                break;
            case 4:
                this.emit('exception', mbFunctionCode, exceptionCode, 'SLAVE DEVICE FAILURE');
                break;
            case 5:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ACKNOWLEDGE');
                break;
            case 6:
                this.emit('exception', mbFunctionCode, exceptionCode, 'SLAVE DEVICE BUSY');
                break;            
            case 8:
                this.emit('exception', mbFunctionCode, exceptionCode, 'MEMORY PARITY ERROR');
                break;                
            case 0x0A:
                this.emit('exception', mbFunctionCode, exceptionCode, 'GATEWAY PATH UNAVAILABLE');
                break;
            case 0x0B:
                this.emit('exception', mbFunctionCode, exceptionCode, 'GATEWAY TARGET DEVICE FAILED TO RESPOND');
                break;
                
        }

        return excepResBuffer;
    }

    /**
     * Handles the Modbus "Read Coils" service (Function Code 01).
     *
     * Processes a request to read the status of coils (0x reference) from the server.
     * Validates the request, checks address and quantity, and returns a response PDU
     * containing the coil values or an exception response if the request is invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: start address + quantity).
     * @fires ModbusServer#exception
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Read 10 coils starting at address 0
     * const req = Buffer.from([0x00, 0x00, 0x00, 0x0A]);
     * const res = server.readCoilsService(req);
     */
    readCoilsService(pduReqData){
        
        //Defining function code for this service
        const FUNCTION_CODE = 1;

        let resPduBuffer;

        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of coils to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >= 1 && registersToRead <= 2000){        
                    //initial register. Example coil 20 addressing as 0x13 (19)
                    let startAddress = pduReqData.readUInt16BE(0);      
                
                    //Validating data address
                    if(startAddress + registersToRead <= this.coils.length * 8 && startAddress + registersToRead <= MAX_ITEM_NUMBER){     
                    
                    
                        //Calculando cantidad de bytes de la respuesta 12%8=1
                        //ejemplo 12 coils necesitan 2 bytes
                        let byteCount = registersToRead % 8 ? Math.ceil(registersToRead/8) : (registersToRead/8);   
                        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
                        let values = Buffer.alloc(byteCount);
                        resPduBuffer = Buffer.alloc(byteCount + 2);  
                        resPduBuffer[0] = FUNCTION_CODE;            
                        resPduBuffer[1] = byteCount;
                        
                        for(let i = 0; i < registersToRead; i++){                   
                            if(this.getBoolFromBuffer(this.coils, startAddress + i)){ 
                            values[Math.floor(i/8)] = values[Math.floor(i/8)] | masks[i%8];            
                            }          
                        }

                        values.copy(resPduBuffer, 2);
                    
                    
                    }
                    //Making modbus exeption 2
                    else{
                        //reply modbus exception 2
                        resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                    }
            }      
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    }

    /**
     * Handles the Modbus "Read Discrete Inputs" service (Function Code 02).
     *
     * Processes a request to read the status of discrete inputs (1x reference) from the server.
     * Validates the request, checks address and quantity, and returns a response PDU
     * containing the input values or an exception response if the request is invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: start address + quantity).
     * @fires ModbusServer#exception
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Read 8 discrete inputs starting at address 0
     * const req = Buffer.from([0x00, 0x00, 0x00, 0x08]);
     * const res = server.readDiscreteInputsService(req);
     */
    readDiscreteInputsService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 2;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of inputss to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >= 1 && registersToRead <= 2000){        
                //initial register. Example coil 20 addressing as 0x13 (19)
                let startAddress = pduReqData.readUInt16BE(0);      
                
                //Validating data address
                if(startAddress + registersToRead <= this.inputs.length * 8 && startAddress + registersToRead <= MAX_ITEM_NUMBER){     

                    //Calculando cantidad de bytes de la respuesta 12%8=1
                    //example 12 inputss needs 2 bytes
                    let byteCount = registersToRead % 8 ? Math.ceil(registersToRead/8) : (registersToRead/8);   
                    let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
                    let values = Buffer.alloc(byteCount);
                    resPduBuffer = Buffer.alloc(byteCount + 2);  
                    resPduBuffer[0] = FUNCTION_CODE;            
                    resPduBuffer[1] = byteCount;

                    for(let i = 0; i < registersToRead; i++){                   
                        if(this.getBoolFromBuffer(this.inputs, startAddress + i)){ 
                        values[Math.floor(i/8)] = values[Math.floor(i/8)] | masks[i%8];            
                        }          
                    }

                    values.copy(resPduBuffer, 2);
                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 2
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                }
            }
            //Making modbus exeption 3
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    }

    /**
     * Handles the Modbus "Read Holding Registers" service (Function Code 03).
     *
     * Processes a request to read the values of holding registers (4x reference) from the server.
     * Validates the request, checks address and quantity, and returns a response PDU
     * containing the register values or an exception response if the request is invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: start address + quantity).
     * @fires ModbusServer#exception
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Read 5 holding registers starting at address 10
     * const req = Buffer.from([0x00, 0x0A, 0x00, 0x05]);
     * const res = server.readHoldingRegistersService(req);
     */
    readHoldingRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 3;

        let resPduBuffer;

        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >= 1 && registersToRead <= 0x007D){        
            //initial register.
            let startAddress = pduReqData.readUInt16BE(0);   
            
            //Validating data address
            if(startAddress + registersToRead <= this.holdingRegisters.length / 2 ){ 

                //Calculando cantidad de bytes de la respuesta
                //example 12 registers needs 2 bytes
                let byteCount = registersToRead * 2;
                let values = Buffer.alloc(byteCount);
                resPduBuffer = Buffer.alloc(byteCount + 2);  
                resPduBuffer[0] = FUNCTION_CODE;            
                resPduBuffer[1] = byteCount;
                
                for(let i = 0; i < registersToRead; i++){
                    let word = this.getWordFromBuffer(this.holdingRegisters, startAddress + i);     
                    word.copy(values, i * 2) ;
                }

                values.copy(resPduBuffer, 2);

            }
            //Making modbus exeption 2
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2);  
            }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
        }
        return resPduBuffer;
    }

    /**
     * Handles the Modbus "Read Input Registers" service (Function Code 04).
     *
     * Processes a request to read the values of input registers (3x reference) from the server.
     * Validates the request, checks address and quantity, and returns a response PDU
     * containing the register values or an exception response if the request is invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: start address + quantity).
     * @fires ModbusServer#exception
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Read 4 input registers starting at address 5
     * const req = Buffer.from([0x00, 0x05, 0x00, 0x04]);
     * const res = server.readInputRegistersService(req);
     */
    readInputRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 4;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >= 1 && registersToRead <= 0x007D){        
                //initial register.
                let startAddress = pduReqData.readUInt16BE(0);   
                
                //Validating data address
                if(startAddress + registersToRead <= this.inputRegisters.length / 2 ){ 

                    //Calculando cantidad de bytes de la respuesta
                    //example 12 registers needs 2 bytes
                    let byteCount = registersToRead * 2;
                    let values = Buffer.alloc(byteCount);
                    resPduBuffer = Buffer.alloc(byteCount + 2);  
                    resPduBuffer[0] = FUNCTION_CODE;            
                    resPduBuffer[1] = byteCount;
                    
                    for(let i = 0; i < registersToRead; i++){
                        let word = this.getWordFromBuffer(this.inputRegisters, startAddress + i);     
                        word.copy(values, i * 2) ;
                    }

                    values.copy(resPduBuffer, 2);

                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 3
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2);  
                }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
        }
      return resPduBuffer;
    }

    /**
     * Handles the Modbus "Write Single Coil" service (Function Code 05).
     *
     * Processes a request to force a single coil (0x reference) to either ON or OFF.
     * Validates the request, checks address and value, updates the coil buffer,
     * emits a 'write-coils' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: coil address + value).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-coils
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Write ON to coil at address 5
     * const req = Buffer.from([0x00, 0x05, 0xFF, 0x00]);
     * const res = server.writeSingleCoilService(req);
     */
    writeSingleCoilService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 5;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //value to write
            let value =  pduReqData.readUInt16BE(2);

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(value == 0x00 || value == 0xFF00){   

                //coil to write
                let targetCoil = pduReqData.readUInt16BE(0);     
                
                //Validating data address
                if(targetCoil < this.coils.length * 8 && targetCoil <= MAX_ITEM_NUMBER){     
                    
                    resPduBuffer = Buffer.alloc(5);
                    resPduBuffer[0] = FUNCTION_CODE;
                        
                    //writing values on register                  
                    this.setBoolToBuffer(value, this.coils, targetCoil);
                    pduReqData.copy(resPduBuffer, 1);
                        
                    //creating object of values writed
                    //let values = new Map();
                    //let coilValue = this.getBoolFromBuffer(this.coils, targetCoil);
                    //values.set(targetCoil, coilValue);
                    //telling user app that some coils was writed
                    this.emit('write-coils', targetCoil, 1);
                
                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 3
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

          return resPduBuffer;
    }

    /**
     * Handles the Modbus "Write Single Register" service (Function Code 06).
     *
     * Processes a request to write a single holding register (4x reference) on the server.
     * Validates the request, checks address and value, updates the holding register buffer,
     * emits a 'write-registers' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (4 bytes: register address + value).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-registers
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Write value 0x1234 to holding register at address 7
     * const req = Buffer.from([0x00, 0x07, 0x12, 0x34]);
     * const res = server.writeSingleRegisterService(req);
     */
    writeSingleRegisterService(pduReqData){

      //Defining function code for this service
      const FUNCTION_CODE = 6;

      let resPduBuffer;

     
      //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
      if(pduReqData.length == 4){   

            //registers to write
            let value =  Buffer.alloc(2);
            value[0] = pduReqData[2];
            value[1] = pduReqData[3];

            //register to write
            let targetRegister = pduReqData.readUInt16BE(0);     
            
          //Validating data address
            if(targetRegister < this.holdingRegisters.length / 2){     
                
                resPduBuffer = Buffer.alloc(5);
                resPduBuffer[0] = FUNCTION_CODE;
                    
                    //writing values on register                  
                    this.setWordToBuffer(value, this.holdingRegisters, targetRegister);
                    pduReqData.copy(resPduBuffer, 1);
                    
                    /// emit event of values writed
                    /// target rregister and number of registers writed
                    this.emit('write-registers', targetRegister, 1);
                
            }           
            else{
                //reply modbus exception 2
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
            }
        }       
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

    /**
     * Handles the Modbus "Write Multiple Coils" service (Function Code 15).
     *
     * Processes a request to force multiple coils (0x reference) to ON or OFF states.
     * Validates the request, checks address, quantity, and data length, updates the coil buffer,
     * emits a 'write-coils' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU
     *   (minimum 6 bytes: start address + quantity + byte count + values).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-coils
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Write 10 coils starting at address 0
     * const req = Buffer.from([0x00, 0x00, 0x00, 0x0A, 0x02, 0xCD, 0x01]);
     * const res = server.writeMultipleCoilsService(req);
     */
    writeMultipleCoilsService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 15;

        let resPduBuffer;
        if(pduReqData.length >=6){
            //amount coils to write
            let cuantityOfOutputs =   pduReqData.readUInt16BE(2);
            //byte count
            let byteCount = pduReqData[4];
            //values to force
            let outputValues = pduReqData.subarray(5);   

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityOfOutputs >= 1 && cuantityOfOutputs <= 0x07B0 && byteCount === Math.ceil(cuantityOfOutputs/8) && byteCount === outputValues.length){   

                    //start
                    let startingAddress = pduReqData.readUInt16BE(0); 
                                
                    //Validating data address
                    if(startingAddress + cuantityOfOutputs <= this.coils.length * 8 && (startingAddress + cuantityOfOutputs) <= MAX_ITEM_NUMBER){     
                    
                        resPduBuffer = Buffer.alloc(5);
                        resPduBuffer[0] = FUNCTION_CODE;
                        
                        //writing values on register  
                        for(let i=0; i < cuantityOfOutputs; i++){
                        let value = this.getBoolFromBuffer(outputValues, i);       
                        this.setBoolToBuffer(value, this.coils, startingAddress + i);
                        }
                        pduReqData.copy(resPduBuffer, 1);

                        //creating object of values writed
                        /*let values = new Map();
                        for(let i = 0; i < cuantityOfOutputs; i++){                  
                        let coilValue = this.getBoolFromBuffer(this.coils, startingAddress + i);                  
                        values.set(startingAddress + i, coilValue);
                        }  */               
                        //telling user app that some coils was writed
                        this.emit('write-coils', startingAddress, cuantityOfOutputs);
                    
                    }
                    //Making modbus exeption 2
                    else{
                        //reply modbus exception 3
                        resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                    }
            }
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }
        return resPduBuffer;
    }

    /**
     * Handles the Modbus "Write Multiple Registers" service (Function Code 16).
     *
     * Processes a request to write multiple holding registers (4x reference) on the server.
     * Validates the request, checks address, quantity, and data length, updates the holding register buffer,
     * emits a 'write-registers' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU
     *   (minimum 6 bytes: start address + quantity + byte count + values).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-registers
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Write 3 registers starting at address 10
     * const req = Buffer.from([0x00, 0x0A, 0x00, 0x03, 0x06, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
     * const res = server.writeMultipleRegistersService(req);
     */
    writeMultipleRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 16;

        let resPduBuffer;

        if(pduReqData.length >=6){
            //amount  to write
            let cuantityOfRegisters = pduReqData.readUInt16BE(2);
            //byte count
            let byteCount = pduReqData[4];;
            //values to force
            let registerValues = pduReqData.subarray(5);    

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityOfRegisters >= 1 && cuantityOfRegisters <= 0x07B0 && byteCount === cuantityOfRegisters*2 && byteCount === registerValues.length){   

                //start
                let startingAddress = pduReqData.readUInt16BE(0); 
                            
                //Validating data address
                if(startingAddress + cuantityOfRegisters <= this.holdingRegisters.length / 2 ){     
                    
                    resPduBuffer = Buffer.alloc(5);
                    resPduBuffer[0] = FUNCTION_CODE;
                        
                    //writing values on register  
                    for(let i=0; i < cuantityOfRegisters; i++){
                        let value = this.getWordFromBuffer(registerValues, i);       
                        this.setWordToBuffer(value, this.holdingRegisters, startingAddress + i);
                    }
                    pduReqData.copy(resPduBuffer, 1);

                    //creating object of values writed
                    /*let values = new Map();
                    for(let i = 0; i < cuantityOfRegisters; i++){                  
                        let registerValue = this.getWordFromBuffer(this.holdingRegisters, startingAddress + i);                  
                        values.set(startingAddress + i, registerValue);
                    }   */              
                    //telling user app that some coils was writed
                    this.emit('write-registers', startingAddress, cuantityOfRegisters);
                
                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 3
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

    /**
     * Handles the Modbus "Mask Write Register" service (Function Code 22).
     *
     * Processes a request to modify the contents of a single holding register using AND and OR masks.
     * Validates the request, checks address and masks, updates the holding register buffer,
     * emits a 'write-registers' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU (6 bytes: register address + AND mask + OR mask).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-registers
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Mask write register at address 4 with AND mask 0xFF00 and OR mask 0x00F0
     * const req = Buffer.from([0x00, 0x04, 0xFF, 0x00, 0x00, 0xF0]);
     * const res = server.maskWriteRegisterService(req);
     */
    maskWriteRegisterService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 22;

        let resPduBuffer;

        //Validating data address 
        if(pduReqData.length == 6 ){

            //register to mask
            let referenceAddress =   pduReqData.readUInt16BE(0);

            if(referenceAddress < this.holdingRegisters.length / 2){  

                //masks
                let andMask = pduReqData.readUInt16BE(2);     
                let orMask =  pduReqData.readUInt16BE(4); 
                
                resPduBuffer = Buffer.alloc(7);
                resPduBuffer[0] = FUNCTION_CODE;
                    
                  //writing values on register  
                  let actualValue = this.getWordFromBuffer(this.holdingRegisters, referenceAddress);               
                  let maskValue = Buffer.alloc(2);
                  maskValue.writeUint16BE((actualValue.readUint16BE() & andMask) | (orMask & ~andMask));
                  this.setWordToBuffer(maskValue, this.holdingRegisters, referenceAddress)
                  
                  pduReqData.copy(resPduBuffer, 1);
                  
                  //creating object of values writed
                  //let values = new Map();
                  //let registerValue = this.getWordFromBuffer(this.holdingRegisters, referenceAddress);
                  //values.set(referenceAddress, registerValue);
                  //telling user app that some coils was writed
                  this.emit('write-registers', referenceAddress, 1);  
              
            }            
            else{
                //reply modbus exception 2
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
            }
        }        
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

     /**
     * Handles the Modbus "Read/Write Multiple Registers" service (Function Code 23).
     *
     * Processes a request to read and write multiple holding registers (4x reference) in a single operation.
     * Validates the request, checks addresses, quantities, and data length, updates the holding register buffer,
     * emits a 'write-registers' event, and returns a response PDU or an exception response if invalid.
     *
     * @param {Buffer} pduReqData - Buffer containing only the data portion of the request PDU
     *   (minimum 11 bytes: read start address + read quantity + write start address + write quantity + byte count + values).
     * @fires ModbusServer#exception
     * @fires ModbusServer#write-registers
     * @returns {Buffer} Response PDU buffer.
     *
     * @example
     * // Read 2 registers from address 0, write 2 registers to address 10
     * const req = Buffer.from([0x00, 0x00, 0x00, 0x02, 0x00, 0x0A, 0x00, 0x02, 0x04, 0x12, 0x34, 0x56, 0x78]);
     * const res = server.readWriteMultipleRegistersService(req);
     */
    readWriteMultipleRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 23;

        let resPduBuffer;

        if(pduReqData.length >= 11){

            //values to read and write
            let cuantityToRead =   pduReqData.readUInt16BE(2);
            let cuantityToWrite =   pduReqData.readUInt16BE(6);
            //byte count
            let byteCount = pduReqData[8];
            //values to force
            let writeRegisterValues = pduReqData.subarray(9);    

            //Validating Data Value. See Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityToRead > 0 && cuantityToRead <= 0x7D && cuantityToWrite > 0  && cuantityToWrite <= 0x79 && byteCount === cuantityToWrite*2 && byteCount === writeRegisterValues.length){   

                    //starting addresses
                    let readStartingAddress = pduReqData.readUInt16BE(0); 
                    let writeStartingAddress = pduReqData.readUInt16BE(4); 
                                
                    //Validating data address
                    if(readStartingAddress + cuantityToRead <= this.holdingRegisters.length / 2 && writeStartingAddress + cuantityToWrite <= this.holdingRegisters.length / 2){   

                        //Calculando cantidad de bytes de la respuesta
                        //example 12 registers needs 2 bytes
                        let byteCount = cuantityToRead * 2;
                        let readValues = Buffer.alloc(byteCount);
                        resPduBuffer = Buffer.alloc(byteCount + 2);  
                        resPduBuffer[0] = FUNCTION_CODE;            
                        resPduBuffer[1] = byteCount;
                        
                        for(let i = 0; i < cuantityToRead; i++){
                            let word = this.getWordFromBuffer(this.holdingRegisters, readStartingAddress + i);                             
                            word.copy(readValues, i * 2) ;
                        }

                        readValues.copy(resPduBuffer, 2);
                        
                        //writing values on register  
                        for(let i=0; i < cuantityToWrite; i++){
                        let value = this.getWordFromBuffer(writeRegisterValues, i);       
                        this.setWordToBuffer(value, this.holdingRegisters, writeStartingAddress + i);
                        }

                        //creating object of values writed
                        /*let values = new Map();
                        for(let i = 0; i < cuantityToWrite; i++){                  
                        let registerValue = this.getWordFromBuffer(this.holdingRegisters, writeStartingAddress + i);                  
                        values.set(writeStartingAddress + i, registerValue);
                        }   */              
                        //telling user app that some coils was writed
                        this.emit('write-registers', writeStartingAddress, cuantityToWrite);
                    
                    }
                    //Making modbus exeption 2
                    else{
                        //reply modbus exception 3
                        resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                    }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }   
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

      return resPduBuffer;
    }    

     /**
     * Reads a single bit (boolean value) from a buffer at the specified bit offset.
     *
     * This low-level utility function is used to extract the value of a single coil or discrete input
     * from a Modbus data buffer. The buffer is treated as a sequence of bits, and the bit at the given
     * offset is returned as a boolean.
     *
     * @param {Buffer} targetBuffer - Buffer object to read from.
     * @param {number} [offset=0] - Bit address (zero-based) to read.
     * @returns {boolean} The value of the bit at the specified offset.
     * @throws {RangeError} If the offset is out of the buffer's bounds.
     *
     * @example
     * // Read the 5th coil from a buffer
     * const value = server.getBoolFromBuffer(server.coils, 4);
     * // value is true or false
     */
    getBoolFromBuffer(targetBuffer, offset = 0){
        
        // Validate that targetBuffer is a Buffer object
        if (!Buffer.isBuffer(targetBuffer)) {
            throw new TypeError("targetBuffer must be a Buffer object");
        }
        // Validate the offset against the buffer's total bits
        const totalBits = targetBuffer.length * 8;
        if (typeof offset !== 'number' || offset < 0 || offset >= totalBits) {
            throw new RangeError("offset is out of buffer bounds");
        }

        const targetByte = targetBuffer[Math.floor(offset/8)];                  //Byte where  the bit is place inside the buffer
        const bitOffset = offset % 8;                                           //offset of bit inside the byte
        const masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

        let value = (targetByte & masks[bitOffset]) > 0;

        return value;
        
    }

    /**
     * Sets a single bit (boolean value) in a buffer at the specified bit offset.
     *
     * This low-level utility function writes a boolean value to a specific bit position
     * in a Modbus data buffer (such as coils or discrete inputs). The buffer is treated
     * as a sequence of bits, and the bit at the given offset is set or cleared.
     *
     * @param {boolean} value - Boolean value to write (true for 1, false for 0).
     * @param {Buffer} targetBuffer - Buffer object to write to.
     * @param {number} [offset=0] - Bit address (zero-based) to write.
     * @throws {RangeError} If the offset is out of the buffer's bounds.
     *
     * @example
     * // Set the 5th coil in the buffer to ON
     * server.setBoolToBuffer(true, server.coils, 4);
     */
    setBoolToBuffer(value, targetBuffer, offset = 0){

        // Validate that targetBuffer is a Buffer object
        if (!Buffer.isBuffer(targetBuffer)) {
            throw new TypeError("targetBuffer must be a Buffer object");
        }
        // Validate the offset against the buffer's total bits
        const totalBits = targetBuffer.length * 8;
        if (typeof offset !== 'number' || offset < 0 || offset >= totalBits) {
            throw new RangeError("offset is out of buffer bounds");
        }

        const targetOffset = Math.floor(offset / 8);           //byte inside the buffer where the bit is placed
        const bitOffset = offset % 8;                            //offset inside the byte
        const masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        
        if(value){
              targetBuffer[targetOffset] |= masks[bitOffset];
        }
        else{
            targetBuffer[targetOffset] &= (~masks[bitOffset]);
        }      
    }
        
}

ModbusServer.prototype.getWordFromBuffer = utils.getWordFromBuffer;

ModbusServer.prototype.setWordToBuffer = utils.setWordToBuffer;


module.exports = ModbusServer;

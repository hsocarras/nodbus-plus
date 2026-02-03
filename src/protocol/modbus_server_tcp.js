/**
 * Modbus TCP Server Base Class module.
 *
 * This module provides the `ModbusTcpServer` class, which extends the core ModbusServer
 * to implement Modbus TCP protocol specifics, including MBAP header handling and TCP ADU parsing.
 * It includes utilities for extracting the PDU and MBAP header from TCP ADUs, validating MBAP headers,
 * and constructing TCP response ADUs.
 *
 * @module protocol/modbus_server_tcp
 * @author Hector E. Socarras
 * @version 1.0.1
 *
 * @example
 * const ModbusTcpServer = require('./modbus_server_tcp');
 * const server = new ModbusTcpServer();
 * // Use server.getPdu(tcpAduBuffer) to extract the PDU from a TCP ADU buffer
 */

const ModbusServer = require('./modbus_server');


/**
 * Default configuration for the Modbus TCP server.
 * This configuration sets the maximum number of inputs, coils, holding registers, and input registers.
 * @constant
 * @type {Object}
 * @property {number} inputs - Maximum number of inputs (default: 2048).    
 * @property {number} coils - Maximum number of coils (default: 2048).
 * @property {number} holdingRegisters - Maximum number of holding registers (default: 2048).
 * @property {number} inputRegisters - Maximum number of input registers (default: 2048).
 */
const defaultCfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048
}

/**
 * Class representing a Modbus TCP server.
 *
 * The `ModbusTcpServer` class extends the core ModbusServer to implement Modbus TCP protocol specifics,
 * including MBAP header handling, TCP ADU parsing, and response construction. It provides utilities for
 * extracting the PDU and MBAP header from TCP ADUs, validating MBAP headers, and building TCP response ADUs.
 *
 * @extends ModbusServer
 *
 * @example
 * const ModbusTcpServer = require('./modbus_server_tcp');
 * const server = new ModbusTcpServer();
 * // Extract PDU from TCP ADU buffer
 * const pdu = server.getPdu(tcpAduBuffer);
 */
class ModbusTcpServer extends ModbusServer {
  /**
     * Creates a new Modbus TCP Server instance.
     *
     * Initializes the ModbusTcpServer with the specified configuration object, or uses the default configuration
     * if none is provided. The configuration defines the number of inputs, coils, holding registers, and input registers.
     * @constructor
     * @param {object} [mbTcpServercfg=defaultCfg] - Configuration object for the server.
     * @param {number} [mbTcpServercfg.inputs=2048] - Maximum number of inputs.
     * @param {number} [mbTcpServercfg.coils=2048] - Maximum number of coils.
     * @param {number} [mbTcpServercfg.holdingRegisters=2048] - Maximum number of holding registers.
     * @param {number} [mbTcpServercfg.inputRegisters=2048] - Maximum number of input registers.
     * 
     */
    constructor(mbTcpServercfg = defaultCfg){
        super(mbTcpServercfg);

        var self = this;   
       
    }  

    /**
     * Extracts the Modbus PDU (Protocol Data Unit) from a Modbus TCP ADU (Application Data Unit) buffer.
     *
     * The PDU is located after the 7-byte MBAP header in the TCP ADU buffer.
     *
     * @param {Buffer} reqAduBuffer - The Modbus TCP ADU buffer.
     * @returns {Buffer|null} The extracted PDU buffer, or null if the buffer is too short.
     *
     * @example
     * const pdu = server.getPdu(tcpAduBuffer);
     */
    getPdu(reqAduBuffer){
        if(reqAduBuffer.length > 7) {
            return reqAduBuffer.subarray(7);
        }
        else{
            return null
        }
    }

    /**
     * Function to get the header buffer from a tcp adu request.
     * @param {Buffer} reqAduBuffer 
     * @returns {Buffer} Header's buffer.
     */
    getMbapHeader(reqAduBuffer){
        if(reqAduBuffer.length >= 7) {
            return reqAduBuffer.subarray(0, 7);
        }
        else{
            return null
        }
    }
    
    /**
     * Function to parse a mbap buffer.
     * See Fig 16 on Modbus Messaging on TCPIP Implementation Guide V1.0b
     * @param {Buffer} mbapBuffer 7 bytes buffer with the modbus tcp transaction's header
     * @returns {bool} true if is a valid mbap header.
     */
    validateMbapHeader(mbapBuffer){
        if(mbapBuffer.length == 7){            
            if(mbapBuffer.readUInt16BE(2) == 0){
                return true
            }
            else{
                return false;
            }            
        }
        else{
            return false;
        }
    }
    
    /**
     * Processes a Modbus TCP request ADU and generates a response ADU.
     * 
     * This function validates the incoming ADU, extracts the PDU, processes it using the core
     * `processReqPdu` method, and then constructs a valid response ADU with the correct MBAP header.
     * 
     * @param {Buffer} reqAduBuffer - The complete Modbus TCP request ADU buffer.
     * @returns {Buffer} The complete Modbus TCP response ADU buffer.
     * @throws {TypeError} If `reqAduBuffer` is not a Buffer object.
     * @throws {RangeError} If the ADU length is invalid or the MBAP header is malformed.
     */
    getResponseAdu(reqAduBuffer){

        if (!Buffer.isBuffer(reqAduBuffer)) {
            throw new TypeError("Request ADU must be a Buffer object.");
        }

        // An ADU must be at least 8 bytes (7 for header, 1 for function code) and at most 260 bytes.
        if (reqAduBuffer.length < 8 || reqAduBuffer.length > 260) {
            throw new RangeError(`Invalid ADU length: ${reqAduBuffer.length}. Must be between 8 and 260 bytes.`);
        }

        const reqHeader = this.getMbapHeader(reqAduBuffer);
        const reqPdu = this.getPdu(reqAduBuffer);

        // Validate Protocol ID (must be 0) and that the length field matches the actual data length.
        if (!this.validateMbapHeader(reqHeader) || reqHeader.readUInt16BE(4) !== reqPdu.length + 1) {
            throw new RangeError("Invalid MBAP header: Protocol ID must be 0 and length must match PDU size.");
        }

        // Get the response Pdu from the parent server
        const resPdu = this.processReqPdu(reqPdu);

        // Construct the response ADU
        const resAdu = Buffer.alloc(7 + resPdu.length);
        resAdu.writeUInt16BE(reqHeader.readUInt16BE(0), 0); // Copy Transaction ID
        resAdu.writeUInt16BE(0, 2);                         // Protocol ID is 0
        resAdu.writeUInt16BE(resPdu.length + 1, 4);         // Write new length
        resAdu.writeUInt8(reqHeader.readUInt8(6), 6);       // Copy Unit ID
        resPdu.copy(resAdu, 7);                             // Copy response PDU

        return resAdu;
    }
    
   
}



module.exports = ModbusTcpServer;

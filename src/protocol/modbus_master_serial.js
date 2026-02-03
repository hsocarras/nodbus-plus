/**
* Modbus Serial Master (Client) Base Class module.
* This module provides the `ModbusSerialClient` class for handling Modbus serial communication (RTU or ASCII),
* including ADU creation, request management, and response validation.
* @module protocol/modbus_master_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/

const valByte2Chars = require('./utils.js').valByteToChars;

const ModbusClient = require('./modbus_master');

/**
 * Represents a Modbus Serial Master (Client) for handling communication over serial lines (RTU or ASCII).
 *
 * This class extends `ModbusClient` to provide functionality specific to the Modbus serial line protocol.
 * It manages the lifecycle of a single active request, as serial communication is typically half-duplex.
 * It handles ADU (Application Data Unit) creation with the correct checksum (CRC for RTU, LRC for ASCII)
 * and validates incoming response ADUs.
 *
 * @extends ModbusClient
*/
class ModbusSerialClient extends ModbusClient {
    /**
    * Creates a new Modbus Serial Client instance.
    *
    * Initializes the client, setting up properties to manage the active request, its timeout,
    * and the transmission mode (RTU/ASCII).
    */
    constructor(){
        super();  
        
        /**
         * The current pending request ADU buffer. Since serial communication is half-duplex,
         * only one request can be active at a time.
         * @type {Buffer}
         */
        this.activeRequest = null;

        /**
         * Flag indicating if the active request is in ASCII mode.
         * @type {boolean}
         * @private
         */
        this._asciiRequest = false;

        /**
         * The ID of the timer for the active request's timeout.
         * @type {NodeJS.Timeout|number}
         */
        this.activeRequestTimerId = -1;

        /** 
         * The ID of the timer used for the turn-around delay after a broadcast request.
         * @type {NodeJS.Timeout|number}
        */
        this.turnAroundDelay = -1;

    }  
   

    /**
     * Creates a complete Modbus serial ADU (Application Data Unit) request buffer.
     *
     * This function prepends the slave address and appends the correct checksum (CRC for RTU, LRC for ASCII)
     * to the provided PDU buffer.
     * @param {number} address - The slave address (0-247).
     * @param {Buffer} pdu - The Protocol Data Unit buffer.
     * @param {boolean} [asciiMode=false] - If true, creates an ASCII frame; otherwise, creates an RTU frame.
     * @returns {Buffer|null} The complete request ADU buffer, or null if inputs are invalid.
     */
    makeRequest(address, pdu, asciiMode = false){

        if(Buffer.isBuffer(pdu) && address >= 0 && address <= 247){

            let reqBuffer = Buffer.alloc(3 + pdu.length);
            reqBuffer[0] = address;
            pdu.copy(reqBuffer, 1);

            if (asciiMode){
                let reqAsciiBuffer = this.aduRtuToAscii(reqBuffer);
                return reqAsciiBuffer
            }
            else{
                //calculating crc and appending to request                
                let crc = this.calcCRC(reqBuffer);
                // Modbus spec requires CRC to be little-endian (low byte first)
                reqBuffer.writeUInt16BE(crc, reqBuffer.length-2);
                return reqBuffer;
            }   
                        
        }
        else{
            return null;
        }
        
    }

    /**
     * Stores a request as the currently active request.
     *
     * On a serial line, only one request can be pending at a time. This function will fail
     * if another request is already active.
     * @param {Buffer} bufferReq - The request ADU buffer to store.
     * @param {boolean} [asciiMode=false] - Flag indicating if the request is in ASCII format.
     * @returns {boolean} `true` if the request was stored successfully, `false` otherwise.
     */
    storeRequest(bufferReq, asciiMode = false){

        if(this.activeRequest == null){
            if(asciiMode){
                this._asciiRequest = true;
            }
            else{
                this._asciiRequest = false;
            }
            this.activeRequest = bufferReq;
            return true
        }
        else{
            return false;
        }

    }
   
    /**
     * Sets a timeout for the active request.
     *
     * If a response is not received within the timeout period, a 'req-timeout' event is emitted.
     * @param {number} [timeout=100] - The timeout period in milliseconds.
     * @returns {NodeJS.Timeout|-1} The timer ID, or -1 if the timer could not be set.
     * @emits ModbusSerialClient#req-timeout
     */
    setReqTimer(timeout = 100){

        let self = this;
        
        if(this.activeRequest instanceof Buffer && typeof timeout === 'number' && timeout >= 1){
            
            let timerId = setTimeout(()=>{
                self.emit('req-timeout', self.activeRequest); //what to do when timeout occurs is desition for the user app
            }, timeout);
            
            self.activeRequestTimerId = timerId;

            return timerId
        }
        else{
            return -1;
        }
        
    }

    /**
     * Sets a turn-around delay timer after a broadcast request.
     *
     * Broadcast requests do not receive responses. This timer provides a delay before the
     * client can send the next request. When the timer expires, it clears the active
     * request and emits a 'broadcast-timeout' event to signal that the client is ready.
     * @param {number} [timeout=100] - The delay period in milliseconds.
     * @returns {NodeJS.Timeout|-1} The timer ID, or -1 if the timer could not be set.
     * @emits ModbusSerialClient#broadcast-timeout
     */
    setTurnAroundDelay(timeout = 100){

        let self = this;
        
        if(this.activeRequest instanceof Buffer && typeof timeout === 'number' && timeout >= 1){
            
            let timerId = setTimeout(()=>{
                self.activeRequest = null;
                self.emit('broadcast-timeout'); //what to do when timeout occurs is desition for the user app
            }, timeout);
            
            self.turnAroundDelay = timerId;

            return timerId
        }
        else{
            return -1;
        }
    }

    /**
     * Clears the timeout timer for the active request.
     * This should be called when a response is received or the request is cancelled.
     */
    clearReqTimer(){
        clearTimeout(this.activeRequestTimerId);
    }

    /**
     * Processes an incoming response ADU.
     *
     * This function validates the response against the active request. It checks the checksum
     * (CRC or LRC) and the slave address. If the response is valid, it clears the request
     * timeout and emits a 'transaction' event with the original request and the received response.
     * @param {Buffer} bufferAdu - The incoming response ADU buffer.
     * @emits ModbusSerialClient#transaction
     */
    processResAdu(bufferAdu){
        
        // Check that client is waiting for a reply and the response is a buffer
        if(!Buffer.isBuffer(bufferAdu) || !this.activeRequest){
            return;
        }

        if(this._asciiRequest){
            // Validate ASCII response
            if(bufferAdu.length >= 9){
                const calcLrc = this.calcLRC(bufferAdu);
                const frameLrc = Number('0x' + bufferAdu.toString('ascii', bufferAdu.length-4, bufferAdu.length-2));
               
                if(calcLrc === frameLrc){
                    const reqAddr = Number('0x' + this.activeRequest.toString('ascii', 1, 3));
                    const resAddr = Number('0x' + bufferAdu.toString('ascii', 1, 3));

                    if(resAddr === reqAddr){
                        // Address matches, transaction is valid
                        this.clearReqTimer();                            
                        const req = this.activeRequest;
                        this.activeRequest = null;
                        this._asciiRequest = false;
                        this.emit('transaction', req, bufferAdu);
                    }
                }
            }
        }
        else { // RTU Mode
            if(bufferAdu.length >= 4){
                // Validate RTU response
                const calcCrc = this.calcCRC(bufferAdu);
                // Modbus spec requires CRC to be little-endian (low byte first)
                const frameCrc = bufferAdu.readUInt16BE(bufferAdu.length - 2);
                
                if(calcCrc === frameCrc){
                    if(bufferAdu[0] === this.activeRequest[0]){
                        // Address matches, transaction is valid
                        this.clearReqTimer();
                        const req = this.activeRequest;
                        this.activeRequest = null;
                        this.emit('transaction', req, bufferAdu);
                    }
                }
            }
        }
    }
    
}

ModbusSerialClient.prototype.aduAsciiToRtu = require('./utils.js').aduAsciiToRtu;

ModbusSerialClient.prototype.aduRtuToAscii = require('./utils.js').aduRtuToAscii;

ModbusSerialClient.prototype.calcCRC = require('./utils.js').calcCRC;

ModbusSerialClient.prototype.calcLRC = require('./utils.js').calcLRC;

module.exports = ModbusSerialClient;
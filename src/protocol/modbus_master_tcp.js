/**
* Modbus TCP Master (Client) Base Class module.
* This module provides the `ModbusTcpClient` class for handling Modbus TCP communication,
* including MBAP header management and transaction pooling.
* @module protocol/modbus_master_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/


const ModbusClient = require('./modbus_master');

/**
 * Represents a Modbus TCP Master (Client) for handling communication over TCP/IP.
 *
 * This class extends `ModbusClient` to provide functionality specific to the Modbus TCP protocol.
 * It manages the MBAP (Modbus Application Protocol) header, including transaction IDs,
 * and handles the lifecycle of requests, from creation to response matching. It maintains a pool
 * of pending requests to handle multiple concurrent transactions.
 *
 * @extends ModbusClient
*/
class ModbusTcpClient extends ModbusClient {
    /**
    * Creates a new Modbus TCP Client instance.
    *
    * Initializes the client, setting up the transaction counter and pools for managing
    * pending requests and their timeout timers.
    */
    constructor(){
        super();  
        
        /**
        * Transaction counter for Modbus TCP requests. This is a 16-bit value that should
        * increment for each new transaction and wrap around at 65535.
        * @type {number}
        * @private
        */
        this._transactionCount = 0;    
        
        /**
         * Max number of transaction
         * @type {number}
         */
        this.maxNumberOfTransaction = 64;

        /**
         * Pool of pending requests, mapping transaction IDs to request buffers.
         * @type {Map<number, Buffer>}
         */
        this.reqPool = new Map();

        /**
         * Pool of active timers for pending requests, mapping transaction IDs to timer IDs.
         * @type {Map<number, NodeJS.Timeout>}
         */
        this.reqTimersPool = new Map();

    }  
   
    get transactionCount(){
        return this._transactionCount;
    }

    set transactionCount(count){
        if(typeof count === 'number'){
            // The transaction ID is a 16-bit value.
            // We handle wrap-around by taking the value modulo 65536.
            this._transactionCount = count % 0x10000;
        }
    }

    /**
    * Creates the 7-byte Modbus TCP (MBAP) header.
    *
    * The header includes the transaction ID, protocol ID (always 0), length of the
    * following data (Unit ID + PDU), and the Unit ID.
    *
    * @param {number} unitId - The slave address (Unit ID).
    * @param {number} pduLength - The length of the PDU in bytes.
    * @returns {Buffer} The 7-byte MBAP header buffer.
    */
    makeHeader(unitId, pduLength){

        let header = Buffer.alloc(7);
        header.writeUInt16BE(this.transactionCount);
        header.writeUInt16BE(0,2);
        header.writeUInt16BE(pduLength + 1, 4);
        header.writeUInt8(unitId, 6);

        return header;
    }

    /**
    * Parses a 7-byte MBAP header buffer and extracts its fields.
    *
    * @param {Buffer} bufferHeader - The 7-byte buffer containing the Modbus TCP header.
    * @returns {{transactionId: number, protocolId: number, length: number, unitId: number}} An object with the parsed header fields.
    * @throws {TypeError} if bufferHeader is not a Buffer.
    * @throws {RangeError} if bufferHeader's length is different than 7.
    */
    parseHeader(bufferHeader){

        let header = {};
        if(Buffer.isBuffer(bufferHeader)){
            if(bufferHeader.length == 7){
                header.transactionId = bufferHeader.readUInt16BE(0);
                header.protocolId = bufferHeader.readUInt16BE(2);
                header.length = bufferHeader.readUInt16BE(4);
                header.unitId = bufferHeader.readUInt8(6);
                return header;
            }
            else{
                throw new RangeError('Error: Header must be 7 bytes long');
            }
        }
        else{
            throw new TypeError('Error: Header must be a buffer instance');
        }
    }

    /**
     * Creates a complete Modbus TCP ADU (Application Data Unit) request buffer.
     *
     * This function increments the transaction counter, creates the MBAP header,
     * and prepends it to the provided PDU buffer.
     *
    * @param {number} unitId - The slave address (Unit ID, 0-255).
    * @param {Buffer} pdu - The Protocol Data Unit buffer.
    * @returns {Buffer|null} The complete request ADU buffer, or null if inputs are invalid.
     */
    makeRequest(unitId, pdu){

        if(pdu instanceof Buffer & unitId <= 255){

            //Increment of transaction count
            this.transactionCount++;

            let header = this.makeHeader(unitId, pdu.length);

            //allocating memory for request
            let reqBuffer = Buffer.alloc(7 + pdu.length);

            //filling request buffer with data
            header.copy(reqBuffer);
            pdu.copy(reqBuffer, 7);

            return reqBuffer;
                        
        }
        else{
            return null;
        }
        
    }

    /**
     * Stores a pending request in the request pool.
     *
     * A Modbus TCP client can have multiple requests in flight. This function adds a request
     * to a pool, keyed by its transaction ID, so it can be matched with a response later.
     *
     * @param {Buffer} bufferReq - The request ADU buffer to store.
     * @returns {boolean} `true` if the request was stored successfully, `false` if the pool is full.
     */
    storeRequest(bufferReq){
        //storing request on the pool
        if(this.reqPool.size < this.maxNumberOfTransaction){
            let transactionId = bufferReq.readUInt16BE(0);
            //using the transaction Id as key
            this.reqPool.set(transactionId, bufferReq);

            return true;
        }
        else{
            return false;
        }

    }

    /**
     * Sets a timeout for a pending request.
     *
     * If a response for the given transaction ID is not received within the timeout period,
     * a 'req-timeout' event is emitted.
     *
     * @param {number} transactionId - The transaction ID of the request to monitor.
     * @param {number} [timeout=100] - The timeout period in milliseconds.
     * @returns {NodeJS.Timeout|-1} The timer ID, or -1 if the timer could not be set.
     * @emits ModbusTcpClient#req-timeout
     */
    setReqTimer(transactionId, timeout = 100){

        let self = this;
        
        //first, check thar the request exist on the request pool.
        if(this.reqPool.has(transactionId) & typeof timeout === 'number' & timeout >= 1){

            let req = self.reqPool.get(transactionId);
            let timerId = setTimeout(()=>{
                self.emit('req-timeout', transactionId, req); //what to do when timeout occurs is decision for the user app
            }, timeout);
            //storing timer on the timer's pool
            self.reqTimersPool.set(transactionId, timerId)

            return timerId
        }
        else{
            return -1;
        }
    }

    /**
     * Clears the timeout timer for a given request.
     * This should be called when a response is received or the request is cancelled.
     * @param {number} transactionId - The transaction ID of the request whose timer should be cleared.
     */
    clearReqTimer(transactionId){

        if(this.reqTimersPool.has(transactionId)){
            let timerId = this.reqTimersPool.get(transactionId);
            clearTimeout(timerId);
            this.reqTimersPool.delete(transactionId);
        }
    }

    /**
     * Processes an incoming response ADU.
     *
     * This function matches the response to a pending request using the transaction ID,
     * clears the request's timeout, removes it from the pending pool, and emits a
     * 'transaction' event with the original request and the received response.
     * @param {Buffer} bufferAdu - The incoming response ADU buffer.
     * @emits ModbusTcpClient#transaction
     */
    processResAdu(bufferAdu){

        let transactionId = bufferAdu.readUInt16BE(0);
        if(this.reqPool.has(transactionId)){
            
            //removing timer
            this.clearReqTimer(transactionId);
            //getting the original req
            let req = this.reqPool.get(transactionId);
            this.reqPool.delete(transactionId);  
            this.emit('transaction', req, bufferAdu);          
        }
        
    }
    
}

module.exports = ModbusTcpClient;

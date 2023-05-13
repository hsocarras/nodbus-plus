/**
** Modbus TCP Master Base Class module.
* Only deal with basic ADU operations
* @module protocol/modbus_master_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/


const ModbusClient = require('./modbus_master');

/**
 * Class representing a modbus master.
 * @extends EventEmitter
*/
class ModbusTcpClient extends ModbusClient {
    /**
    * Create a Modbus Master.
    */
    constructor(){
        super();  
        
        /**
        * transaction counter
        * @type {number}
        */
        this._transactionCount = 0;    
        
        /**
         * Max number of transaction
         * @type {number}
         */
        this._maxNumberOfTransaction = 64;

        /**
         * Pool with pending request
         * @type {map}
         */
        this.reqPool = new Map();

        this.reqTimersPool = new Map();

        

    }  
   
    get transactionCount(){
        return this._transactionCount;
    }

    set transactionCount(count){
        if(typeof count === 'number'){
            if(count >= 0 & count <= 0xFF){
                this._transactionCount = count;
            }
        }
    }

    /**
    * Function to make the modbus tcp header
    * @param {number} unitId Legacy modbus address  
    * @param {number} pduLength pdu's legth in bytes    
    * @return {buffer} header buffer.
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
    * Function to extract data from modbus tcp header. 
    * @param {Buffer} bufferHeader buffer with modbus tcp header .    
    * @return {object} object containing header's field {transactionID, protocolID, length, unitID}.
    * @throws {TypeError} if bufferHeader is not a Buffer.
    * @throws {RangeError} if bufferHeader's length is diferent than 7..
    */
    parseHeader(bufferHeader){

        let header = {};
        if(bufferHeader instanceof Buffer){
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
     * Function to make a request buffer from pdu buffer and unit id.    
     * @param {number} unitId Legacy modbus address
     * @param {Buffer} pdu Buffer with modbus pdu
     * @returns {object} buffer with request if succesfull or null.
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
     * Function to store the request on the request pool.
     * A modbus Tcp client can have more than one request sended to same server and other server.
     * @param {Buffer} bufferReq
     * @returns {boolean} true if is succesful stored on the pool, false otherwise
     */
    storeRequest(bufferReq){
        //storing request on the pool
        if(this.reqPool.size <= this._maxNumberOfTransaction){
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
     * Function to initialize a timer for timeout detection.
     * @param {number} transactionId 
     * @param {number} timeout 
     * @return {number} timer id for cleartimeout function or -1 if no timer was set.
     * @emits req_timeout. Timeout event
     */
    setReqTimer(transactionId, timeout = 100){

        let self = this;
        
        //first, check thar the request exist on the request pool.
        if(this.reqPool.has(transactionId) & typeof timeout === 'number' & timeout >= 1){

            let req =self.reqPool.get(transactionId);
            let timerId = setTimeout(()=>{
                self.emit('req_timeout', transactionId, req); //what to do when timeout occurs is decision for the user app
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
     * Funcion to clear the timeout imer for a given request
     * @param {number} transactionId 
     */
    clearReqTimer(transactionId){

        if(this.reqTimersPool.has(transactionId)){
            let timerId = this.reqTimersPool.get(transactionId);
            clearTimeout(timerId);
            this.reqTimersPool.delete(transactionId);
        }
    }

    /**
     * Function to make basic processing to response
     * @param {buffer} bufferAdu adu buffer
     * @emits transaction. Event emited when a response is received.
     */
    processResAdu(bufferAdu){

        let transactionId = bufferAdu.readUInt16BE(0); //getting the transaction id
        
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

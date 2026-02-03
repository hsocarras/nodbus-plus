/**
** Modbus Serial Server Base Class module.
* @module protocol/modbus_server_serial
* @author Hector E. Socarras.
* @version 1.0.0
*/

const { Buffer } = require('node:buffer');

const ModbusServer = require('./modbus_server.js');
const valByte2Chars = require('./utils.js').valByteToChars

//Default Server's Configuration object
const defaultCfg = {
    transmitionMode : 0, //transmition mode 0 - rtu or 1 - ascii
    address : 1,
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048
}

/**
 * Represents a Modbus Serial Server (Slave) that handles communication over serial lines (RTU or ASCII).
 *
 * This class extends `ModbusServer` to provide functionality specific to the Modbus serial line protocol.
 * It manages the server's address, transmission mode (RTU/ASCII), and processes incoming Application Data Units (ADUs).
 * It handles request validation, including address matching and checksum verification (CRC for RTU, LRC for ASCII),
 * and constructs appropriate response ADUs.
 *
 * The server also implements diagnostic counters as specified in the "MODBUS over serial line specification and
 * implementation guide V1.02", tracking metrics like message counts, communication errors, and exceptions.
 *
 * @extends ModbusServer
 *
 * @example
 * const ModbusSerialServer = require('./modbus_server_serial');
 *
 * // Create a server in RTU mode with address 1
 * const server = new ModbusSerialServer({
 *   transmitionMode: 0, // 0 for RTU, 1 for ASCII
 *   address: 1,
 *   coils: 1024,
 *   holdingRegisters: 512
 * });
 *
 * // To process a request, you would typically get a buffer from a serial port
 * // and pass it to the server's methods.
*/
class ModbusSerialServer extends ModbusServer {
  /**
  * Creates a new Modbus Serial Server instance.
  *
  * Initializes the server with the specified configuration. If no configuration is provided,
  * it uses default values. The configuration includes the server's Modbus address, the
  * transmission mode (RTU or ASCII), and the size of the data models (coils, registers, etc.).
  *
  * @param {object} [mbSerialServerCfg=defaultCfg] - Configuration object for the serial server.
  * @param {number} [mbSerialServerCfg.transmitionMode=0] - The transmission mode. `0` for RTU (default), `1` for ASCII.
  * @param {number} [mbSerialServerCfg.address=1] - The Modbus address of the server (1-247).
  * @param {number} [mbSerialServerCfg.inputs=2048] - Number of discrete inputs (1x reference).
  * @param {number} [mbSerialServerCfg.coils=2048] - Number of coils (0x reference).
  * @param {number} [mbSerialServerCfg.holdingRegisters=2048] - Number of holding registers (4x reference).
  * @param {number} [mbSerialServerCfg.inputRegisters=2048] - Number of input registers (3x reference).
  */
    constructor(mbSerialServerCfg = defaultCfg){
        super(mbSerialServerCfg);

        var self = this;

        //arguments check
        if(mbSerialServerCfg.transmitionMode === undefined || (mbSerialServerCfg.transmitionMode !== 0 && mbSerialServerCfg.transmitionMode !== 1)){
            mbSerialServerCfg.transmitionMode = defaultCfg.transmitionMode;
        }
        if(mbSerialServerCfg.address == undefined){ mbSerialServerCfg.address = defaultCfg.address;}  
       
        /**
        * address property       
        * @type {number}
        * @private
        */
        this._address;
        this.address = mbSerialServerCfg.address;
        
        /**
        * transmition mode property   
        * Enum {auto, rtu, asscii}     
        * @type {number}
        * @private
        */
        this.transmitionMode = mbSerialServerCfg.transmitionMode;   
        
        //add serial function codes
        this._internalFunctionCode.set(7, 'readExceptionCoilsService');         
        
        /**
        * Exception Coils      
        * @type {buffer}
        * @public
        */
        this.exceptionCoils = Buffer.alloc(1);

        //diagnostic counters
        this.busMessageCount = 0;
        this.busCommunicationErrorCount = 0;    //this counter is managed by network layer, this propety takes a pointer to the counter.
        this.slaveExceptionErrorCount = 0;
        this.slaveMessageCount = 0;
        this.slaveNoResponseCount = 0;
        this.slaveNAKCount = 0;
        this.slaveBusyCount = 0;
        this.busCharacterOverrunCount = 0;      //this counter is managed by network layer, this propety takes a pointer to the counter.

        this.on('exception', (functionCode, exception, message) =>{
            if(exception == 5){
                this.slaveNAKCount++;
            }
            else if(exception == 6){
                this.slaveBusyCount++
            }
        })

    }  

    /**
     * Gets the Modbus address of the server.
     * @returns {number} The server's address.
     */
    get address(){
        return this._address;
    }
    /**
     * Sets the Modbus address of the server.
     * The address must be a number between 1 and 247.
     * If an invalid address is provided, it defaults to 1.
     * @param {number} addr - The new address for the server.
     */
    set address(addr){

        if(typeof addr == 'number'){
            if(addr > 0 && addr <= 247){
                this._address = addr;
            }
            else{
                this._address = 1;
            }
        }
        else{
            this._address = 1;
        }
    } 

    /**
     * Extracts the server address from a Modbus serial ADU request buffer.
     *
     * This method parses the address field from the incoming request frame,
     * handling both RTU (first byte) and ASCII (first two hex characters after ':') formats.
     *
     * @param {Buffer} reqAduBuffer - The Modbus serial ADU buffer.
     * @returns {number} The server address found in the request.
     */
    getAddress(reqAduBuffer){
        
        if(this.transmitionMode == 1){
            //Modbus Ascii Frame            
            return  parseInt('0x' + String.fromCharCode(reqAduBuffer[1]) + String.fromCharCode(reqAduBuffer[2]));
        }
        else {
            //Modbus Rtu Frame
            return reqAduBuffer[0];
        }
    }
    
    /**
     * Extracts the Modbus PDU (Protocol Data Unit) from a serial ADU (Application Data Unit) buffer.
     *
     * For RTU, it returns the buffer slice between the address byte and the CRC.
     * For ASCII, it first converts the frame to RTU format and then extracts the PDU.
     *
     * @param {Buffer} reqAduBuffer - The Modbus serial ADU buffer.
     * @returns {Buffer} The extracted PDU buffer.
     */
    getPdu(reqAduBuffer){
        if(this.transmitionMode == 1){
            //Modbus Ascii Frame
            let reqAduRtuBuffer = this.aduAsciiToRtu(reqAduBuffer);            
            return reqAduRtuBuffer.subarray(1,reqAduRtuBuffer.length-2);
        }
        else {
            //Modbus Rtu Frame           
            return reqAduBuffer.subarray(1,reqAduBuffer.length-2);
        }
        
    }

    /**
     * Calculates the checksum for a given serial ADU request buffer.
     *
     * It computes the CRC for RTU frames or the LRC for ASCII frames.
     *
     * @param {Buffer} reqAduBuffer - The Modbus serial ADU buffer.
     * @returns {number} The calculated checksum (CRC or LRC).
     */
    getChecksum(reqAduBuffer){
        if(this.transmitionMode == 1){
            //Modbus Ascii Frame                        
            return this.calcLRC(reqAduBuffer);
        }
        else {
            //Modbus Rtu Frame
            return this.calcCRC(reqAduBuffer);
        }
        
    }

        
    /**
    * Processes a request ADU and generates a response ADU.
    *
    * This function implements the server-side logic for handling a Modbus serial request.
    * It increments the message counters, extracts and processes the PDU, and builds the
    * full response ADU, including the server address and the appropriate checksum (CRC or LRC).
    * If the request results in an exception, the exception counter is incremented.
    *
    * See "MODBUS over serial line specification and implementation guide V1.02" for the
    * Counters Management Diagram.
    *
    * @param {Buffer} reqAduBuffer - The incoming Modbus serial request ADU buffer.
    * @returns {Buffer} The complete Modbus serial response ADU buffer.
    * @throws {RangeError} If the request ADU buffer is too short.
    * @throws {TypeError} If the request ADU is not a Buffer object.
    */
    getResponseAdu(reqAduBuffer){

        var self = this;        
         
        if (!Buffer.isBuffer(reqAduBuffer)) {
            throw new TypeError("Request ADU must be a Buffer object.");
        }

        const minLength = this.transmitionMode === 1 ? 9 : 4; // ASCII min: ':123456\r\n' (9), RTU min: Addr,FC,CRCH,CRCL (4)
        if (reqAduBuffer.length >= minLength) {
                
                let reqPduBuffer = this.getPdu(reqAduBuffer);
                    
                this.slaveMessageCount++;
                
                let resPduBuffer = this.processReqPdu(reqPduBuffer);

                if(resPduBuffer[0] == reqPduBuffer[0] + 0x80){      //exception response
                    this.slaveExceptionErrorCount++;
                }

                //calculando la adu
                let resAduBuffer;
                let resRtuAduBuffer = Buffer.alloc(resPduBuffer.length + 3);
                resRtuAduBuffer[0] = this.address;                        
                resPduBuffer.copy(resRtuAduBuffer, 1)
                        
                if(this.transmitionMode == 1){
                    
                    resAduBuffer = this.aduRtuToAscii(resRtuAduBuffer)
                    
                }
                else {
                    //calculating CRC
                    let crc = this.calcCRC(resRtuAduBuffer);

                    resAduBuffer = resRtuAduBuffer;                            
                    resAduBuffer.writeUint16BE(crc, resAduBuffer.length - 2);
                }

                return resAduBuffer;                    
                
        } else {
            throw new RangeError(`Request ADU length is too short. Received ${reqAduBuffer.length}, expected at least ${minLength}.`);
        }
        

        
    }  

    /**
    * Executes a broadcast request without sending a response.
    *
    * This method is similar to `getResponseAdu` but is used for broadcast messages (address 0).
    * It processes the request PDU, updates the relevant counters (e.g., `slaveMessageCount`,
    * `slaveNoResponseCount`), but does not generate or return a response ADU, as per the
    * Modbus specification for broadcast requests.
    *
    * @param {Buffer} reqAduBuffer - The broadcast request ADU buffer.
    * @throws {RangeError} If the request ADU buffer is too short.
    * @throws {TypeError} If the request ADU is not a Buffer object.
    */
    executeBroadcastReq(reqAduBuffer) {

        let self = this;
        
        if (!Buffer.isBuffer(reqAduBuffer)) {
            throw new TypeError("Request ADU must be a Buffer object.");
        }

        const minLength = this.transmitionMode === 1 ? 9 : 4; // ASCII min: ':123456\r\n' (9), RTU min: Addr,FC,CRCH,CRCL (4)
        if (reqAduBuffer.length >= minLength) {

                let reqPduBuffer = this.getPdu(reqAduBuffer);
                    
                this.slaveMessageCount++;
                //is Broadcast
                this.slaveNoResponseCount++;

                let noResPdu = this.processReqPdu(reqPduBuffer);

                if(noResPdu[0] == reqPduBuffer[0] + 0x80){
                    this.slaveExceptionErrorCount++;
                }
                
        } else {
            throw new RangeError(`Broadcast ADU length is too short. Received ${reqAduBuffer.length}, expected at least ${minLength}.`);
        }
    }
    
    /**
    * Handles the "Read Exception Status" service (Function Code 07).
    *
    * This service allows a client to read the contents of 8 exception status "coils".
    * In this implementation, it returns a single byte representing the status.
    * The request PDU data should be empty.
    *
    * @param {Buffer} pduReqData - The data portion of the request PDU. Should be empty for this function.
    * @returns {Buffer} The response PDU buffer containing the exception status byte.
    */
    readExceptionCoilsService(pduReqData){
        
        //Defining function code for this service
        const FUNCTION_CODE = 7;

        let resPduBuffer;
        
        if(pduReqData.length == 0){
           
            resPduBuffer = Buffer.alloc(2);  
            resPduBuffer[0] = FUNCTION_CODE;            
            this.exceptionCoils.copy(resPduBuffer,1);
            
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    } 

    /**
    * Validates the address field of an incoming serial ADU frame.
    *
    * @param {Buffer} frame - The incoming Modbus serial ADU frame.
    * @returns {boolean} `true` if the frame's address matches the server's address or is the broadcast address (0), otherwise `false`.
    */
    validateAddress(frame){

        let addressField = this.getAddress(frame);

        if (addressField === this.address || addressField === 0){
            return true;
        }
        else {
            return false;
        }
    }

    /**
    * Validates the checksum (CRC or LRC) of an incoming serial ADU frame.
    *
    * @param {Buffer} frame - The incoming Modbus serial ADU frame.
    * @returns {boolean} `true` if the calculated checksum matches the one in the frame, otherwise `false`.
    */
    validateCheckSum(frame){
        
        let calcErrorCheck = 0;
        let frameErrorCheck = 0;

        if(this.transmitionMode == 1){
            //Modbus Ascii Frame
            calcErrorCheck = this.calcLRC(frame);
            frameErrorCheck = Number('0x' + frame.toString('ascii', frame.length-4, frame.length-2));
        }
        else {
            //Modbus Rtu Frame
            calcErrorCheck = this.calcCRC(frame);
            frameErrorCheck = frame.readUInt16BE(frame.length - 2);
        }
                   
        //cheking checsum
        if(calcErrorCheck === frameErrorCheck){
            return true;
        }
        else{
            //check sum not ok
            return false;
        }
        

    }
    

    /**
     * Resets all diagnostic counters to zero.
     */
    resetCounters(){
        //diagnostic counters
        this.busMessageCount = 0;
        this.busCommunicationErrorCount = 0;    //this counter is managed by network layer, this propety takes a pointer to the counter.
        this.slaveExceptionErrorCount = 0;
        this.slaveMessageCount = 0;
        this.slaveNoResponseCount = 0;
        this.slaveNAKCount = 0;
        this.slaveBusyCount = 0;
        this.busCharacterOverrunCount = 0;      //this counter is managed by network layer, this propety takes a pointer to the counter.
    }
   
}

ModbusSerialServer.prototype.aduAsciiToRtu = require('./utils.js').aduAsciiToRtu;

ModbusSerialServer.prototype.aduRtuToAscii = require('./utils.js').aduRtuToAscii;

ModbusSerialServer.prototype.calcCRC = require('./utils.js').calcCRC;

ModbusSerialServer.prototype.calcLRC = require('./utils.js').calcLRC;

module.exports = ModbusSerialServer;

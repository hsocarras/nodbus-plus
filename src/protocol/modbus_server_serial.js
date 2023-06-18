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
 * Class representing a modbus serial server.
 * @extends ModbusServer
*/
class ModbusSerialServer extends ModbusServer {
  /**
  * Create a Modbus Slave.
  */
    constructor(mbSerialServerCfg = defaultCfg){
        super(mbSerialServerCfg);

        var self = this;

        //arguments check
        if(mbSerialServerCfg.transmitionMode == undefined | (mbSerialServerCfg.transmitionMode != 0 & mbSerialServerCfg.transmitionMode != 1)){
            mbSerialServerCfg.transmitionMode = defaultCfg.transmitionMode;
        }
        if(mbSerialServerCfg.address == undefined){ mbSerialServerCfg.address = defaultCfg.address;}  
        
        /**
        * address property       
        * @type {number}
        * @private
        */
        this._address = mbSerialServerCfg.address;
        
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
     * getter for address property
     * 
     */
    get address(){
        return this._address;
    }    
    set address(addr){
        if(add instanceof Number){
            if(addr >0 & addr <= 247){
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
     * Function to get the address on a serial adu request in rtu format.
     * @param {Buffer} reqAduBuffer 
     * @returns {number} server address on requesr.
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
     * Function to get the pdu buffer from a serial adu request in rtu format
     * @param {Buffer} reqAduBuffer 
     * @returns {Buffer} Pdu's buffer.
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
     * Function to get the pdu buffer from a serial adu request in rtu format
     * @param {Buffer} reqAduBuffer 
     * @returns {Buffer} Pdu's buffer.
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
    * Function to be called when request adu is received. Imlement the Counters Management Diagram.    
    * See MODBUS over serial line specification and implementation guide V1.02
    * @param {Buffer}  modbus indication's frame
    * @return {Buffer} Response Adu 
    * 
    */
    getResponseAdu(reqAduBuffer){

        var self = this;        
         
        if(reqAduBuffer instanceof Buffer){
            
            //check CRC or LRC 
            if(reqAduBuffer.length >= 3){                
                
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
                
            }
            else{                       
                throw new RangeError("Pdu's length must be between 0 an 253");
            }
        }
        else{           
            throw new TypeError("request adu must be Buffer objects");
        }
        
        

        
    }  

    /**
    * @brief Similar to getResponseAdu but return nothing, just execute the request service without response. Used when broadcast address is receivedd
    * @param {Buffer} reqAduBuffer request buffer
    * @fires ModbusServer#mb_exception    
    * @fires ModbusServer#error
    * @return {Buffer} buffer containing a protocol data unit
    */
    executeBroadcastReq(reqAduBuffer) {

        let self = this;
        
        if(reqAduBuffer instanceof Buffer){
            
            //check CRC or LRC 
            if(reqAduBuffer.length >= 3){
                
                
                let reqPduBuffer = this.getPdu(reqAduBuffer);
                    
                this.slaveMessageCount++;
                //is Broadcast
                this.slaveNoResponseCount++;

                let noResPdu = this.processReqPdu(reqPduBuffer);

                if(noResPdu[0] == reqPduBuffer[0] + 0x80){
                    this.slaveExceptionErrorCount++;
                }
                
            }
            else{                       
                throw new RangeError("Pdu's length must be between 0 an 253");
            }
        }
        else{           
            throw new TypeError("request adu must be Buffer objects");
        }
  
    }
    
    /**
    * @brief Function to implement Read Exception Status service on server. Function code 07.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @return {Buffer} resPduBuffer. Response pdu.
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
    * Check the address field of the frame.
    * @param {Buffer} frame frame off modbus indication
    * @return {boolean} return true if the frame's address field match withserver address or is 0.    
    */
    validateAddress(frame){

        let addressField = this.getAddress(frame);

        if (addressField == this.address | addressField == 0){
            return true;
        }
        else {
            return false;
        }
    }

    /**
    * Check the CRC or LRC on the frame.
    * @param {Buffer} frame frame off modbus indication
    * @return {boolean} check sum ok return true.    
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
        if(calcErrorCheck == frameErrorCheck){
            return true;
        }
        else{
            //check sum not ok
            return false;
        }
        

    }
    

    /**
     * Function to restart the counter's value
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


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
        * Get server's modbus functions code supported on broadcast network
        * @return {set object} a set objects with funcion codes suported for the server
        *
        */
        this._broadcastFunctionCode = new Map();        
        this._broadcastFunctionCode.set(5, 'writeSingleCoilService');
        this._broadcastFunctionCode.set(6, 'writeSingleRegisterService');
        this._broadcastFunctionCode.set(15, 'writeMultipleCoilsService');
        this._broadcastFunctionCode.set(16, 'writeMultipleRegistersService');
        this._broadcastFunctionCode.set(22, 'maskWriteRegisterService');
        this._broadcastFunctionCode.set(23, 'readWriteMultipleRegistersService');
         
        
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
            return reqAduRtuBuffer.subarray(1,reqAduBuffer.length-2);
        }
        else {
            //Modbus Rtu Frame
            return reqAduBuffer.subarray(1,reqAduBuffer.length-2);
        }
        
    }

        
    /**
    * Function to be called when request adu is received. Imlement the Counters Management Diagram.    
    * See MODBUS over serial line specification and implementation guide V1.02
    * @param {Buffer}  modbus indication's frame
    * @return {Buffer} Adu  if success, otherwise null
    * 
    */
    getResponseAdu(reqAduBuffer){

        var self = this;
        
         
        if(reqAduBuffer.length > 3){
            
            //check CRC or LRC 
            if(this.validateCheckSum(reqAduBuffer)){
                
                this.busMessageCount++;
                let reqPduBuffer
                if(this.transmitionMode == 1){
                    reqAduBuffer = this.aduAsciiToRtu(reqAduBuffer);                                               
                    reqPduBuffer = reqAduBuffer.subarray(1,reqAduBuffer.length-2);
                }
                else {
                    reqPduBuffer = reqAduBuffer.subarray(1,reqAduBuffer.length-2);
                }
                            
                //checking message address
                if(this.address == reqAduBuffer[0] || reqAduBuffer[0] == 0){
                    
                    this.slaveMessageCount++;
                    

                    if(reqAduBuffer[0] == 0){
                        //is Broadcast
                        this.slaveNoResponseCount++;

                        let noResPdu = this.processBroadcastReqPdu(reqPduBuffer);
                        if(noResPdu[0] == reqPduBuffer[0] + 0x80){
                            this.slaveExceptionErrorCount++;
                        }
                        
                        return null
                    }
                    else{
                        let resPduBuffer = this.processReqPdu(reqPduBuffer);
                        if(resPduBuffer[0] == reqPduBuffer[0] + 0x80){
                            this.this.slaveExceptionErrorCount++;
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
                }
                else{ console.log('null 3')     
                    return null;
                }
            }
            else{                       
                this.busCommunicationErrorCount++;
                return null;
            }
        }
        else{           
            this.busCommunicationErrorCount++;
            return null;
        }
        
        

        
    }  

    /**
    * @brief Server function.Ident to process req pdu but only in broadcast mode, execute de service and return a response pdu.
    * @param {Buffer} reqPduBuffe buffer containing a protocol data unit
    * @fires ModbusServer#mb_exception
    * @fires ModbusServer#write
    * @fires ModbusServer#error
    * @return {Buffer} buffer containing a protocol data unit
    */
    processBroadcastReqPdu(reqPduBuffer) {

        let self = this;
        let functionCode = reqPduBuffer[0];      
        
        //Check for function code
        if(this._broadcastFunctionCode.has(functionCode)){
  
            try {
                //gets pdu data
                let reqPduData = Buffer.alloc(reqPduBuffer.length - 1);
                reqPduBuffer.copy(reqPduData,0,1);
  
                let serviceName = this._broadcastFunctionCode.get(functionCode);      //get de function code prossesing function
                var resPduBuffer = this[serviceName](reqPduData);                          //execute service procesing
              
                return resPduBuffer;
            }
            catch(e){
                //reply modbus exception 4
                resPduBuffer = this.makeExceptionResPdu(functionCode, 4);    //Slave failure exception response
                this.emit('error', e);      
                return resPduBuffer;
            }
        }        
        else{ 
            //reply modbus exception 1
            resPduBuffer = this.makeExceptionResPdu(functionCode, 1);           
            return resPduBuffer;
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


/**
** Modbus Serial Server Base Class module.
* @module protocol/modbus_server_serial
* @author Hector E. Socarras.
* @version 1.0.0
*/

const { Buffer } = require('node:buffer');

const ModbusServer = require('./modbus_server');
const valByte2Chars = require('utils').valByte2Chars

//Default Server's Configuration object
const defaultCfg = {
    transmitMode : 0, //transmition mode 0-auto, 1-rtu, 2-ascii
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
    constructor(mbSerialServercfg){
        super(mbSerialServercfg);

        var self = this;
        
        /**
        * address property       
        * @type {number}
        * @private
        */
        this._address = mbSerialServercfg.address | 1;
        
        /**
        * transmition mode property   
        * Enum {auto, rtu, asscii}     
        * @type {number}
        * @private
        */
        this._transmitionMode = mbSerialServercfg.transmition_mode | 0;   
        
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
        this.BusMessageCounter = 0;
        this.BusCommunicationErrorCounter;    //this counter is managed by network layer, this propety takes a pointer to the counter.
        this.SlaveExceptionErrorCounter = 0;
        this.SlaveMessageCounter = 0;
        this.SlaveNoResponseCounter = 0;
        this.SlaveNAKCounter = 0;
        this.SlaveBusyCounter = 0;
        this.BusCharacterOverrunCounter = 0;      //this counter is managed by network layer, this propety takes a pointer to the counter.

        this.on('exception', (functionCode, exception, message) =>{
            if(exception == 5){
                this.SlaveNAKCounter++;
            }
            else if(exception == 6){
                this.SlaveBusyCounter++
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

    get transmitionMode(){
        return this._transmitionMode;
    }
    set transmitionMode(mode){
        if(mode instanceof Number){
            if(mode >= 0 & mode <= 2){
                this._transmitionMode = mode;
            }
            else{
                this._transmitionMode = 0;
            }
        }
        else{
            this._transmitionMode = 0;
        }
    }

    incBusCommunicationErrorCounter(){
        this.BusCommunicationErrorCounter++;
    }

    /**
    * @brief Server function.Ident to process req pdu but only in broadcast mode, execute de service and return a response pdu.
    * @param {Buffer} reqPduBuffe buffer containing a protocol data unit
    * @fires ModbusServer#exception
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
    * Function to be called when request adu is received. Imlement the Counters Management Diagram.    
    * See MODBUS over serial line specification and implementation guide V1.02
    * @param {Buffer}  modbus indication's frame
    * @return {Buffer} Adu  if success, otherwise null
    * 
    */
    getResponseAduBuffer(reqAduBuffer){

        var self = this;
        
            
        if(reqAduBuffer.length >= 3){

            //check CRC or LRC 
            if(this.validateCheckSum(reqAduBuffer)){

                this.BusMessageCounter++;
                let reqPduBuffer
                if(this.transmitionMode == 2 | (this.transmitionMode == 0 & reqAduBuffer[0] == 0x3A)){
                    let reqAduRtuBuffer = aduAscciiToRtu(reqAduBuffer)
                    reqPduBuffer = reqAduRtuBuffer.subarray(1,reqAduRtuBuffer.length-2);
                }
                else {
                    reqPduBuffer = reqAduBuffer.subarray(1,reqAduBuffer.length-2);
                }
                
              
                //checking message address
                if(this.address == reqAduBuffer[0] || reqAduBuffer[0] == 0){

                    this.SlaveMessageCounter++;
                    

                    if(reqAduBuffer[0] == 0){
                        //is Broadcast
                        this.SlaveNoResponseCounter++;

                        let noResPdu = this.processReqPdu(reqPduBuffer);
                        if(noResPdu[0] == reqPduBuffer[0] + 0x80){
                            this.this.SlaveExceptionErrorCounter++;
                        }
                        return null
                    }
                    else{
                        let resPduBuffer = this.processReqPdu(reqPduBuffer);
                        if(resPduBuffer[0] == reqPduBuffer[0] + 0x80){
                            this.this.SlaveExceptionErrorCounter++;
                        }
                        //calculando la adu
                        let resAduBuffer;
                        let resRtuAduBuffer = Buffer.alloc(resPdu.length + 3);
                        resRtuAduBuffer[0] = this.address;                        

                        if(this.transmitionMode == 2 | (this.transmitionMode == 0 & reqAduBuffer[0] == 0x3A)){
                            resAduBuffer = aduRtuToAscii(resRtuAduBuffer)
                        }
                        else {
                            //calculating CRC
                            crc = this.calcCRC(resRtuAduBuffer);

                            resAduBuffer = resRtuAduBuffer;                            
                            resAduBuffer.writeUint16BE(crc, reqAduBuffer.length - 2);
                        }

                        return resAduBuffer;

                    }
                }
                else{ 
                    return null;
                }
            }
            else{                    
                this.BusCommunicationErrorCounter++;
                return null;
            }
        }
        else{                
            this.BusCommunicationErrorCounter++;
            return null;
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

        if(pduReqData.length == 1){
           
            resPduBuffer = Buffer.alloc(2);  
            resPduBuffer[0] = FUNCTION_CODE;            
            this.exceptionCoils.copiy(resPduBuffer,1);
            
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    } 

    /**
    * Check the CRC or LRC on the frame.
    * @param {Bufferr} frame frame off modbus indication
    * @return {boolean} check sum ok return true.    
    */
    validateCheckSum(frame){
        
        let calcErrorCheck = 0;
        let frameErrorCheck = 0;

        if(this.transmitionMode == 2 | (this.transmitionMode == 0 & frame[0] == 0x3A)){
            //Modbus Ascii Frame
            calcErrorCheck = this.calcLRC(frame);
            frameErrorCheck = Number('0x'+this.frame.toString('ascii', frameLength-4, frameLength-2));
        }
        else {
            //Modbus Rtu Frame
            calcErrorCheck = this.calcCRC(frame);
            frameErrorCheck = this.frame.readUInt16BE(this.aduBuffer.length - 2);
        }
                   
        //cheking checsum
        if(calcErrorCheck == frameErrorCheck){
            return 1;
        }
        else{
            //check sum not ok
            return 0;
        }
        

    }

    /**
     * Function to convert a asccii frame to rtu to be processed
     * @param {Buffre} asciiFrame 
     * @returns {Buffer} a equivalent rtu buffer
     */
    aduAsciiToRtu(asciiFrame){

       
        //creating rtu frame. content frame + 2 bytes for crc
        let rtuFrame = Buffer.alloc(content.length/2 + 2);

        //droping first character (:), lrc and ending character(CR, LF) see Mover over serial line 1.02 b
        for(let i = 1; i < asciiFrame - 4; i++){
            rtuFrame[i] = Number('0x'+ this.asciiFrame.toString('ascii', 2*i + 1 , 2*i + 3));
        }
        
        return rtuFrame;

    }

    /**
     * Function to convert a rtu frame to ascii to be responsed
     * @param {Buffre} rtuFrame
     * @returns {Buffer} a equivalent ascii buffer
     */
    aduRtuToAscii(rtuFrame){

        //creating rtu frame. content frame + 2 bytes for crc
        let asciiFrame = Buffer.alloc(rtuFrame*2 + 3);
        asciiFrame[0] = 0x3A;
        asciiFrame[asciiFrame.length - 2] = 0x0D;
        asciiFrame[asciiFrame.length - 1] = 0x0A;

        //LRC calculation
        byteLRC = Buffer.alloc(1);

        //chars value
        charsBuffer = buffer.alloc(2);

        for(let i = 0; i < rtuFrame - 2; i++){
            byteLRC[0] = byteLRC[0] + rtuFrame[i];
            charsBuffer = valByte2Chars(rtuFrame[i])
            charsBuffer.copy(asciiFrame, 2*i +1)
        }

        byteLRC[0] = -byteLRC[0]
        //get lrc chars 
        charsBuffer = valByte2Chars(byteLRC[0]);
        charsBuffer.copy(asciiFrame, asciiFrame.length - 4);

        return asciiFrame;
    }

    /**
     * Function to restart the counter's value
     */
    resetCounters(){
        //diagnostic counters
        this.BusMessageCounter = 0;
        this.BusCommunicationErrorCounter;    //this counter is managed by network layer, this propety takes a pointer to the counter.
        this.SlaveExceptionErrorCounter = 0;
        this.SlaveMessageCounter = 0;
        this.SlaveNoResponseCounter = 0;
        this.SlaveNAKCounter = 0;
        this.SlaveBusyCounter = 0;
        this.BusCharacterOverrunCounter = 0;      //this counter is managed by network layer, this propety takes a pointer to the counter.
    }
   
}

ModbusSerialServer.prototype.calcCRC = require('utils').calcCRC;

ModbusSerialServer.prototype.calcLRC = require('utils').calcLRC;;

module.exports = ModbusSerialServer;


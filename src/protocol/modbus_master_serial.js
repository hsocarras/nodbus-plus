/**
** Modbus Serial Master Base Class module.
* Only deal with basic ADU operations
* @module protocol/modbus_master_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/

const valByte2Chars = require('./utils.js').valByteToChars;

const ModbusClient = require('./modbus_master');

/**
 * Class representing a modbus master.
 * @extends ModbusClient
*/
class ModbusSerialClient extends ModbusClient {
    /**
    * Create a Modbus Master.
    */
    constructor(){
        super();  
        
        
        /**
         * Current pending request
         * @type {Buffer}
         */
        this.activeRequest = null;

        this._asciiRequest = false;

        /**
         * Variable that holds the timer's id for request timeout
         */
        this.activeRequestTimerId = -1;

        /** 
         * variable that holds the timer used when broadcast request is sended.
        */
        this.turnAroundDelay = 100;

        

    }  
   
    

    

    /**
     * Function to make a request buffer from pdu buffer and unit id.    
     * @param {number} address Legacy modbus address
     * @param {Buffer} pdu Buffer with modbus pdu
     * @returns {object} buffer with request if succesfull or null.
     */
    makeRtuRequest(address, pdu){

        if(pdu instanceof Buffer & address >= 0 & address <= 247){

            let reqBuffer = Buffer.alloc(3 + pdu.length);
            reqBuffer[0] = address;
            pdu.copy(reqBuffer, 1);

            //calculating crc and appending to requst                
            let crc = this.calcCRC(reqBuffer);
            reqBuffer.writeUInt16BE(crc, reqBuffer.length-2);

            
            return reqBuffer;
                        
        }
        else{
            return null;
        }
        
    }

   
    /**
     * Function to initialize a timer for timeout detection.
     * @param {number} transactionId 
     * @param {number} timeout 
     * @return {number} timer id for cleartimeout function or -1 if no timer was set.
     * @emits req_timeout. Timeout event
     */
    setReqTimer(timeout = 100){

        let self = this;
        
        if(this.activeRequest instanceof Buffer & typeof timeout === 'number' & timeout >= 1){
            
            let timerId = setTimeout(()=>{
                self.emit('req_timeout', self.activeRequest); //what to do when timeout occurs is desition for the user app
            }, timeout);
            
            self.activeRequestTimerId = timerId;

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
    clearReqTimer(){

       
        clearTimeout(this.activeRequestTimerId);
            
    }

    /**
     * Function to make basic processing to response
     * @param {buffer} bufferAdu adu buffer
     * @emits transaction. Event emited when a response is received.
     */
    processResAdu(bufferAdu, ascii = false){
        
        //check that client is waiting for replay (this.activerequest is diferent than null)
        if(bufferAdu instanceof Buffer & this.activeRequest instanceof Buffer){
            if(ascii){
                if(bufferAdu.length >= 9){
                    //validating error check
                    //Modbus Ascii Frame
                    let calcErrorCheck = this.calcLRC(bufferAdu);
                    let frameErrorCheck = Number('0x' + bufferAdu.toString('ascii', bufferAdu.length-4, bufferAdu.length-2));
                    
                    if(calcErrorCheck == frameErrorCheck){
                        //valid frame
                        let res = this.aduAsciiToRtu(bufferAdu);
                        if(res[0] == this.activeRequest[0]){
                            //if address match
                            this.clearReqTimer();

                            let req = this.activeRequest;
                            this.activeRequest = null;
                            this.emit('transaction', req, res);

                        }
                        
                    }
                    
                }
            }
            else{
                if(bufferAdu.length >= 4){
                    //validating error check
                    //Modbus Ascii Frame
                    let calcErrorCheck = this.calcCRC(bufferAdu);
                    let frameErrorCheck = bufferAdu.readUInt16BE(bufferAdu.length - 2);
                    
                    if(calcErrorCheck == frameErrorCheck){
                        //valid frame
                        let res = bufferAdu;
                        if(res[0] == this.activeRequest[0]){
                            //if address match
                            this.clearReqTimer();
                            
                            let req = this.activeRequest;
                            this.activeRequest = null;
                            this.emit('transaction', req, res);

                        }
                        
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
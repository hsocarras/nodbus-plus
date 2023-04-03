/**
** Modbus TCP Server Base Class module.
* @module protocol/modbus_server_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/

const ModbusServer = require('./modbus_slave');


//Default Server's Configuration object
const defaultCfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048
}

/**
 * Class representing a modbus tcp server.
 * @extends ModbusDevice
*/
class ModbusTcpServer extends ModbusServer {
  /**
  * Create a Modbus TCP Server.
  */
    constructor(mbTcpServercfg = defaultCfg){
        super(mbTcpServercfg);

        var self = this;   
       
    }  

   
    /**
    * this function is the interface for tcp layer to send modbus message.   
    * See Fig 16 on Modbus Messaging on TCPIP Implementation Guide V1.0b
    * @param {buffer} messageFrame modbus indication's frame
    * @return {object} Transaction object. {header: Buffer, pdu: Buffer}
    * 
    */
    getTransactionObject(messageFrame){
        let self = this;
        //Starting server activity
        if(messageFrame > 7){
            let mbapBuffer = messageFrame.subarray(0, 6);
            
            if(this.validateMbapHeader(mbapBuffer)){
                let pduBuffer = messageFrame.subarray(7);
                return {
                    header: mbapBuffer,
                    pdu : pduBuffer
                }
            }
            else{
                //discard
                return null
            }
        }
        else{
            //discard
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
     * 
     * @param {Object} req Object containing a header property type buffer, and pdu property type buffer.
     * @returns {Buffer}
     * @throws {TypeError} if header or pdu are not Buffer instances.
     * @throws {RangeError} if header and pdu buffer has incorrect length.
     */
    builResponseAdu(req){

        //Type check
        if(req.header instanceof Buffer & req.pdu instanceof Buffer ){
            //Range check
            if(req.header.length == 7 & req.pdu.length > 0 & req.pdu.length <= 253){
                //Get the response Pdu
                let resPdu = this.processReqPdu(req.pdu);
                //Crating response Buffer
                let resAdu = Buffer.alloc(7+resPdu.length);
                //copying values fron req header 
                req.header.copy(resAdu);
                //copying pdu to response
                resPdu.copy(resAdu, 7);
                //Calculating header lenth field
                resAdu.writeUint16BE(resPdu.length, 4)  
                    
                return resAdu;
            }
            else{
                throw new RangeError("header's length musb be 7, and pdu's length must be between 0 an 253");
              }
        }
        else{
            throw new TypeError("header and pdu must be Buffer objects");
        }
    }
    
   
}



module.exports = ModbusTcpServer;

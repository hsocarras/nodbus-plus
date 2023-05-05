/**
** Modbus TCP Server Base Class module.
* @module protocol/modbus_server_tcp
* @author Hector E. Socarras.
* @version 1.0.0
*/

const ModbusServer = require('./modbus_server');


//Default Server's Configuration object
const defaultCfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048
}

/**
 * Class representing a modbus tcp server.
 * @extends ModbusServer
*/
class ModbusTcpServer extends ModbusServer {
  /**
  * Create a Modbus TCP Server.
  * @param {Object} mbTcpServercfg Configuration object.
  */
    constructor(mbTcpServercfg = defaultCfg){
        super(mbTcpServercfg);

        var self = this;   
       
    }  

    /**
     * Function to get the pdu buffer from a tcp adu request.
     * @param {Buffer} reqAduBuffer 
     * @returns {Buffer} Pdu's buffer.
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
     * 
     * @param {Object} req Object containing a header property type buffer, and pdu property type buffer.
     * @returns {Buffer}
     * @throws {TypeError} if header or pdu are not Buffer instances.
     * @throws {RangeError} if header and pdu buffer has incorrect length.
     */
    getResponseAdu(reqAduBuffer){

        //Type check
       
        if(reqAduBuffer instanceof Buffer){
            
            //Range check
            if(reqAduBuffer.length > 7 & reqAduBuffer.length <= 260){

                let header = reqAduBuffer.subarray(0, 7);
                let pdu = reqAduBuffer.subarray(7);

                //Get the response Pdu
                let resPdu = this.processReqPdu(pdu);
                //Crating response Buffer
                let resAdu = Buffer.alloc(7+resPdu.length);
                //copying values fron req header 
                header.copy(resAdu);
                //copying pdu to response
                resPdu.copy(resAdu, 7);
                //Calculating header lenth field. Unit Id Byte plus pdu length
                resAdu.writeUint16BE(resPdu.length + 1, 4)  
                    
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

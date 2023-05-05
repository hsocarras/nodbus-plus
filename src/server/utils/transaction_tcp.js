/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/
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
    if(messageFrame.length > 7){
        let mbapBuffer = messageFrame.subarray(0, 7);
        
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

class MBTcpTransaction {
    constructor(socket, mb_adu){        
        var self = this;
        /**
         * type
         * @type {string} Indicate is a tcp request
         */
        const transmition_mode = 'tcp';
        Object.defineProperty(self, 'transmitionMode',{
            get: function(){
            return transmition_mode;
            }
        })

        /**
         * type
         *  @type {number} indicate when the reqest was received          
         */
        self.timeStamp = Date.now();

        /**
         * type
         * @type {string} Indicate master ip address
         */
        this.clientAddress = socket.remoteAddress;

        /**
         * type
         * @type {string} Indicate master ip address family 'IPv4' or 'IPv6'
         */
        this.clientAddressFamily = socket.remoteFamily;

        /**
         * type
         * @type {number} Indicate the transaction id on modbus indication
         */
        this.requestID = mb_adu.mbapHeader.transactionID;

        /**
         * type
         * @type {number} Indicate the destination address of mosbus serial device behind a gateway
         */
        this.unitID = mb_adu.mbapHeader.unitID;

        /**
         * type
         * @type {number} Indicate the service requested
         */
        this.functionCode = mb_adu.pdu.modbus_function;

        /**
         * type
         * @type {number} indicate de data of serveice requested
         */
        this.data = mb_adu.pdu.modbus_data;
        
    }
    
}

module.exports = MBTcpTransaction;
/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/

class MBTcpTransaction {
    constructor(socket, mb_adu){        

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
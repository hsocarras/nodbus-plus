/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/

const TCPAdu = require('./tcp_adu');
const RTUAdu = require('./rtu_adu');
const ASCIIAdu = require('./ascii_adu');

class Response {
    constructor(type){
        var self = this;

        /**
         * type
         * @type {string} Indicate if is a tcp or serial request
         */
        self.type = type;

        /**
         * adu
         * @type {ADU Object} Protocol aplication data unit 
         */
        self.adu;
        switch(type){
            case 'tcp':
                self.adu = new TCPAdu();
                break;
            case 'TCP':
                self.adu = new TCPAdu();
                break;
            case 'rtu':
                self.adu = new RTUAdu();
                break;
            case 'RTU':
                self.adu = new RTUAdu();
                break;
            case 'ascii':
                self.adu = new ASCIIAdu();
                break;
            case 'ASCII':
                self.adu = new ASCIIAdu();
                break;             
            default:
                throw new TypeError('type must be a string whit a valid modbus frame type')
        }

        /**
         * On master this field indicate for with slave id are come from 
         * On slave takes 
         */
        self.connectionID = null;

        /**
         * On master this field indicate the transaction id of response 
         * On slave the same
         */
        self.id = 0;

        /**
         * On master this field indicate when the response was received 
         * On slave indicate when the response was sended
         */
        self.timeStamp = null;

        /**
         * This field indicate a detailed data about pdu
         */
        self.data = null
    }
    
}

module.exports = Response;
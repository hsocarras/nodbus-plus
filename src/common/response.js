/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/

const TcpADU = require('../protocol/tcp_adu');
const SerialADU = require('../protocol/serial_adu');

class Response {
    constructor(trans_mode){
        var self = this;

        /**
         * type
         * @type {string} Indicate if is a tcp or serial request
         */
        self.transmition_mode = trans_mode;

        /**
         * adu
         * @type {ADU Object} Protocol aplication data unit 
         */
        self.adu;
        switch(transmition_mode){
            case 'tcp':
                self.adu = new TcpADU('tcp');
                break;
            case 'TCP':
                self.adu = new TcpADU('tcp');
                break;
            case 'rtu':
                self.adu = new SerialADU('rtu');
                break;
            case 'RTU':
                self.adu = new SerialADU('rtu');
                break;
            case 'ascii':
                self.adu = new SerialADU('ascii');
                break;
            case 'ASCII':
                self.adu = new SerialADU('ascii');
                break;
            default:
                throw new TypeError('transmition_mode must be a string whit a valid modbus frame transmition mode', 'request.js', '46')
        }

        /**
         * On master this field indicate for with slave id are come from 
         * On slave takes the index on the conection stack
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
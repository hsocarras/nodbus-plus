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

        self.type = type;
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

        self.deviceID = 0;
        self.id = 0;
        self.timeStamp = null;
        self.data = null
    }
    
}

module.exports = Response;
/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/

const TCPAdu = require('./tcp_adu');
const RTUAdu = require('./rtu_adu');
const ASCIIAdu = require('./ascii_adu');

class Request {
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
         * On master this field indicate for with slave are intended to
         * On slave takes his modbus address
         */
        self.slaveID = null;

        /**
         * On master this field indicate of id on req stack, it match with transactionID
         * On slave has no use, take the value of reqest counter
         */
        self.id = 0;

        /**
         * On master this field indicate the timout value for request
         * On slave has no use yet
         */
        self.timeout = 1000;

        self.OnTimeout = null;
        self._timer = null;
        self._retriesNumber = 0;
    }

    StartTimer(){
        var self = this
        self._timer = setTimeout(function(){
            self.OnTimeout(self.slaveID, self);
        }, self.timeout)
    }

    StopTimer(){
        clearTimeout(this._timer);
    }
}

module.exports = Request;
/**
** Modbus request class.
* @module protocol/request
* @author Hector E. Socarras.
* @version 0.9.0
*/

const TcpADU = require('../protocol/tcp_adu');
const SerialADU = require('../protocol/serial_adu');


class Request {
    constructor(trans_mode = 'tcp'){
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
        switch(this.transmition_mode){
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
                throw new TypeError('transmition_mode must be a string whit a valid modbus frame transmition mode', 'request.js', '47')
        }

        /**
         * On master this field indicate for with slave are intended to
         * On slave takes his modbus address
         */
        self.slaveID = null;

        /**
         * On master this field indicate the id on req stack, it match with transactionID
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
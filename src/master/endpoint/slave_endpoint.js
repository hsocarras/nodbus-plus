const EventEmitter = require('events');


class SlaveEndPoint extends EventEmitter {
    constructor(){
        super();
        var self = this;

        this.id = null;

        /**
         * type of slave. tcp, rtu or ascii
         * @type {string}
         */
        this.type = null;

        /**
         * ip address of slave
         * @type {string}
         */
        this.ip = null;

        /**
         * port from the slave is listening
         * @type {number | string} number in case of tcp port, in case of serial port string whit port path
         */
        this.port = null;

        /**
         * modbus address
         * @type {number} modbus address a value between 1 and 247
         */        
        this.modbus_address = 1;

        this.timeout = 1000;
        
        this.isConnected = false;
        this.maxRetries = 0;
        

        
        
    }

        
    get address(){
        return this.modbus_address;
    }

    set address(newAddress){
        if(newAddress > 0 & newAddress <= 247){
            this.modbus_address = newAddress;
        }
        else{
            throw new RangeError('modbus address number 1 - 247')
        }
    }

}

module.exports = SlaveEndPoint;
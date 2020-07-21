const EventEmitter = require('events');


class Slave extends EventEmitter {
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
        this.serialMode = null;
        this.isConnected = false;
        this.maxRetries = 1;
        this.maxRequests = 1
        
        this.requestStack = new Map();

        
        
    }

    get isMaxRequest(){        
        if(this.maxRequests > this.requestStack.size){
            return false
        }
        else return true
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
   
    AddRequest(req){
        if(this.isMaxRequest == false){
            this.requestStack.set(req.id, req);
            return true
        }
        else{
            this.emit('full');          
            return false
        }
    }

    RemoveRequest(req){
        this.requestStack.delete(req.id)
        if(this.requestStack.length == 0){
            this.emit('drain');
        }
    }

    SearchRequest(id){
               
        return this.requestStack.get(id);
    }


}

module.exports = Slave;
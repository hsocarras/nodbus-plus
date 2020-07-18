const EventEmitter = require('events');


class Slave extends EventEmitter {
    constructor(){
        super();
        var self = this;

        self.id = null;
        this.type = null;
        this.ip = null;
        this.port = null;
        this.address = 1;
        this.timeout = 1000;
        this.serialMode = null;
        this.isConnected = false;
        this.maxRetries = 1;
        this.maxRequests = 1
        
        Object.defineProperty(self, 'isMaxRequest',{
            get: function(){
                if(self.maxRequests > self.requestStack.size){
                    return false
                }
                else return true
            },
            enumerable: true,
            configurable: false
        })

        this.requestStack = new Map();
        
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
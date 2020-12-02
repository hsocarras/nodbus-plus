const SlaveEndPoint = require('./slave_endpoint');


class TCPEndPoint extends SlaveEndPoint {
    constructor(){
        super();
        var self = this;

        

        /**
         * type of slave. tcp, rtu or ascii
         * @type {string}
         */
        this.type = 'tcp';

        
        
        
        this.requestStack = new Map();

        
        
    }

    get isMaxRequest(){
        if(this.maxRequests > this.requestStack.size){
            return false
        }
        else return true
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
        if(this.requestStack.size == 0){            
            this.emit('drain');
        }
    }

    SearchRequest(id){
               
        return this.requestStack.get(id);
    }


}

module.exports = TCPEndPoint;
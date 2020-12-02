const SlaveEndPoint = require('./slave_endpoint');


class SerialEndPoint extends SlaveEndPoint {
    constructor(type){
        super();
        var self = this;

        

        /**
         * type of slave. rtu or ascii
         * @type {string}
         */
        if(type == 'rtu' || type == 'ascii'){
            this.type = type;
        }
        else{
            this.type = 'rtu';
        }
        

        

        //retry attemp before emit timeout event
        this.maxRetries = 0;        
        
        this.request = null

        
        
    }

    get isMaxRequest(){        
        if(this.request == null){
            return false
        }
        else return true
    }    
   
    AddRequest(req){
        if(this.request == null){
            this.request = req;
            return true
        }
        else{
            this.emit('full');          
            return false
        }
    }

    RemoveRequest(req){ 
        
        this.request = null               
        this.emit('drain');
        
    }

    SearchRequest(id){
               
        return this.request;
    }


}

module.exports = SerialEndPoint;
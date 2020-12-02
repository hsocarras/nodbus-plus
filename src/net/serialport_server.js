/**
**  Serialport module for server.
* @module serialport.
* @author Hector E. Socarras.
* @version 0.11.0
*/


const SerialPort = require('serialport')

class SerialPortServer {
    constructor(path){
        var self = this;

        //array whit connections
        let connections = [path];
        
        /**
         * Port configuration
         */
        this.portConfig = {
            autoOpen:false,
            baudRate:19200,
            dataBits:8,
            highWaterMark:1024,
            lock:true,
            stopBits:1,
            parity:'none',
            rtscts:false,
            xon:false,
            xoff:false,
            xany:false,                
        }
        
        this.port = path;            

        /**
         * serialport object
         * @type {object}
         */
        this.serialport = new SerialPort(this.port, this.portConfig)

        /**
         * list of connections
         * @type {Object[]}
         */
        Object.defineProperty(self,'activeConnections',{
            get: function(){
                return connections
            }
        })             

        /**
        *  Inactivity time to close a connection
        * @type {number}
        */
        this.connectionTimeout = 0;

        /**
         * frame
         */
        this._dataFrame = null;

        /**
         * timer for emit data
         */
        this._timer = null;

        //User listeners
        /**
        *  function to executed when event data is emited
        * @param {Buffer} data
        */
        this.onData = function(index, data){console.log('data: ' + data + 'from master' + index)};       

        /**
        *  function to executed when event listening is emited
        */
        this.onListening = function(){ console.log('listening')};

        /**
        *  function to executed when event error is emited
        * @param {Object} error
        */
        this.onError = function(err){ console.log(err)};

        /**
         *  function to executed when event close is emited
         */
        this.onServerClose = function(){ console.log('server close')};            

        /**
        *  function to executed when event write is emited
        * @param {Buffer} buff
        */
        this.onWrite = null                        

    }

    get baudRate(){
        return this.serialport.baudRate;
    }

    set baudRate(br){
        if(br instanceof 'number'){

            switch(br){
                case 1200:
                    this.portConfig.baudRate = 1200;
                    break
                case 2400:
                    this.portConfig.baudRate = 2400;
                    break
                case 4800:
                    this.portConfig.baudRate = 4800;
                    break
                case 9600:
                    this.portConfig.baudRate = 9600;
                    break
                case 14400:
                    this.portConfig.baudRate = 14400;
                    break
                case 19200:
                    this.portConfig.baudRate = 19200;
                    break
                case 38400:
                    this.portConfig.baudRate = 38400;
                    break
                case 57600:
                    this.portConfig.baudRate = 57600;
                    break
                case 115200:
                    this.portConfig.baudRate = 115200;
                    break
                default:
                    throw new RangeError('baudrate not suported')                    
            }
            if(this.serialport.isOpen == false){
                this.Create();
            }
        }
        else{
            throw new TypeError('baudrate must be a number')
        }
    }  
    
    get parity(){
        return this.portConfig.parity
    }

    set parity(par){
        if(par instanceof 'string'){

            switch(par){
                case 'none':
                    this.portConfig.parity = 'none';
                    break
                case 'even':
                    this.portConfig.parity = 'even';
                    break
                case 'odd':
                    this.portConfig.parity = 'odd';
                    break
                case 'mark':
                    this.portConfig.parity = 'mark';
                    break
                case 'space':
                    this.portConfig.parity = 'space';
                    break                    
                default:
                    throw new RangeError('parity not suported')                    
            }
            if(this.serialport.isOpen == false){
                this.Create();
            }
        }
        else{
            throw new TypeError('parity must be a string')
        }
    }

    get dataBits(){
        return this.serialport.portConfig.dataBits;
    }

    set dataBits(dbits){
        if(dbits instanceof 'number'){

            switch(dbits){
                case 8:
                    this.portConfig.dataBits = 8;
                    break
                case 7:
                    this.portConfig.dataBits = 7;
                    break
                case 6:
                    this.portConfig.dataBits = 6;
                    break
                case 5:
                    this.portConfig.dataBits = 5;
                    break                                     
                default:
                    throw new RangeError('databits not suported')                    
            }
            if(this.serialport.isOpen == false){
                this.Create();
            }
        }
        else{
            throw new TypeError('databits must be a number')
        }
    }

    get stopBits(){
        return this.serialport.portConfig.stopBits;
    }

    set stopBits(sbits){
        if(sbits instanceof 'number'){

            switch(sbits){
                case 1:
                    this.portConfig.stopBits = 1;
                    break
                case 2:
                    this.portConfig.stopBits = 2;
                    break                                                    
                default:
                    throw new RangeError('stopbits not suported')                    
            }
            if(this.serialport.isOpen == false){
                this.Create();
            }            
        }
        else{
            throw new TypeError('databits must be a number')
        }
    }

    get maxConnections(){
        return 1
    }
        
    set maxConnections(max){   
        
    }
        
    /**
    * listening status
    * @type {boolean}
    */
    get isListening(){
        return this.serialport.isOpen;
    }

    Create(){

        var self = this;
        /**
         * serialport object
         * @type {object}
         */
        this.serialport = new SerialPort(this.port, this.portConfig);   
        
                           
        this.serialport.on('data', function(data_buff){

            self.onData(0, data_buff);
            self.serialport.flush();

        }); 

        //setting listeners
        this.serialport.on('error', self.onError);

        this.serialport.on('close', function(){            
            self.onServerClose();
        });

        this.serialport.on('open', self.onListening);
    }
    

    /**
     * Start the tcp server
     */
    Start (){
        
        this.Create();
        this.serialport.open();
        
    }

    /**
     * Stop the tcp server
     */
    Stop (){
        //cerrando el server
        this.serialport.close();      
    }

    /**
     * function to write in a conection
     * @param {number} socketIndex. Index to socket in connections array
     * @param {buffer} data
     */
    Write (socketIndex, resp){
        let self = this;
        
        this.serialport.write(resp.adu.aduBuffer, 'utf8', function(){
            if(self.onWrite){
                self.onWrite(resp);
            }
        });
    }

}

module.exports = SerialPortServer;
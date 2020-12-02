/**
**  Serialport module for server.
* @module serialport.
* @author Hector E. Socarras.
* @version 0.11.0
*/


const SerialPort = require('serialport')

class SerialPortClient {
    constructor(port){
        var self = this;          

        this.slaves = new Map();

        this.port = port;

        /**
         * Reverse lookup table
         * used to know which slave belong to a ip address, in case of tcp
         * gateway,  only one socket is used for all serial slave, instead to open a conection
         * for every slave on tcp gateway because commonly tcp gateway's server don't suport many 
         * connection
         * Necesary for compatibility purpose
         */
        this.ipMap = new Map();

        
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
        
        this.serialport = null;

        /**
         * frame. in case that real serial port behabior requieres to construct the frame
         */
        this._dataFrame = null;

        /**
         * timer for emit data. Same reason previous
         */
        this._timer = null;

        //User listeners
        /**
        *  function to executed when event data is emited
        * @param {Buffer} data
        */
        this.onData = function(index, data){console.log('data: ' + data + 'from master' + index)};  
        
        //Funcion a ejecutar cuando se establece la coneccion
        this.onConnect = function(){console.log('connection establish whit: ' + this.port)};
        
        /**
        *  function to executed when event error is emited
        * @param {Object} error
        */
        this.onError = function(err){ console.log(err)};        

        this.onTimeOut = function(){console.log('timeout')};  
        
        this.onClose =  function(had_error){
            if(had_error){
                console.log('closed by error conexion')
            }
            else{
                console.log('closed');
            }
        }

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
        }
        else{
            throw new TypeError('databits must be a number')
        }
    }

    
    /**
    * listening status
    * @type {boolean}
    */
    get isConected(){
        
        if(this.serialport){
            return this.serialport.isOpen;
        }
        else{
            return false;
        }
        
    }


    /**
     * Conect the client to a serial port
     */
    Connect (slave){
        var self = this;
        
        let promises = new Promise(function(resolve, reject){           

            try{
                
                
                if(self.serialport){

                    //slaves'list asociated to that port
                    let slaves = self.ipMap.get(self.port);
                    //add the new slave to the list
                    
                    if(slave.port == self.port){
                        
                        //add the new slaves to the port list
                        slaves.push(slave.id)
                        //add the salve conection map
                        self.slaves.set(slave.id, self.serialport);                        
                        
                    }

                    if(self.isConnected){
                        resolve(self.port)
                        self.onConnect(slave.id);
                    }
                    else{
                        reject(slave.id)
                    }
                    
                }
                else{
                    
                   
                    self.serialport = new SerialPort(self.port, self.portConfig);

                    if(slave.port == self.port){
                        self.ipMap.set(self.port, [slave.id]);  
                        self.slaves.set(slave.id, self.port)   
                    } 
                    else{
                        reject(slave.id)
                    }
                    
                    self.serialport.once('open',function(){ 
                        
                        resolve(self.port);                         
                        let slaves = self.ipMap.get(self.port);
                        slaves.forEach((id)=>{
                            self.slaves.set(id, self.port);
                            self.onConnect(id);
                          })                            
                                       
                    })

                    self.serialport.once('error', function(err){                        
                        
                        reject(self.port);
                                
                    })
                    
                    //setting listeners
                    self.serialport.on('error', self.onError);

                    self.serialport.on('close', function(had_error){    

                        let slaves = self.ipMap.get(self.port);

                        
                        slaves.forEach(element => {
                            self.slaves.delete(element);
                            self.onClose(element, had_error);
                        });
                        self.ipMap.delete(self.port); 
                        
                    });
                    
                    
                    
                    self.serialport.on('data', function(data_buff){

                        self.onData(self.port, data_buff);

                    }); 
                    
                    self.serialport.open();
                    
                }
                
            }
            catch(e){
                self.onError(e);
                reject(self.port);
            }
        })
                    
        return promises;        
        
    }

    Disconnet(id){
        let self = this;

        if(this.slaves.has(id) == false){
            return Promise.resolve(id);
        }
        else if(self.ipMap.get(self.port).length > 1){

                 
            let listofId = self.ipMap.get(self.port);
            let index = listofId.indexOf(id);
            if(index != -1){
                listofId.splice(index, 1);
            }
            
            self.slaves.delete(id);
            return Promise.resolve(id);

        }
        else {
            let promise = new Promise(function(resolve, reject){
                
                self.serialport.close();

                self.serialport.once('close', function(){
                    self.ipMap.delete(self.port)
                    self.slaves.clear()
                    
                    resolve(id)
                })
                resolve(self.port)
            })
            return promise;
        }
              
      }

    /**
     * function to write in a conection
     * @param {number} socketIndex. Index to socket in connections array
     * @param {buffer} data
     */
    Write (id, request){
        let self = this;
        if(this.slaves.has(id) == false){
            return false;
        }
        else{
            let isSuccesfull
            let data = request.adu.aduBuffer;
            isSuccesfull = this.serialport.write(data, 'utf8', function(){
                if(self.onWrite){
                    self.onWrite(id, request);                
                }
                request.StartTimer();
            });
        }
    }

}

module.exports = SerialPortClient;
/**
* Tcp Client  module.
* @module net/tcpclient.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const net = require('node:net'); 

//No operation default function for listeners
const noop = () => {};

//default config
defaultCfg = {
    
    ip: '127.0.0.1',
    port: 502,    
    tcpCoalescingDetection : false,
}

/**
 * Class representing a tcp channes.
*/
class TcpChannel {
  /**
  * Create a tcp client.
  */
    constructor(channelCfg){

        let self = this;

        if(channelCfg.port == undefined){ channelCfg.port = defaultCfg.port}
        if(channelCfg.ip == undefined){ channelCfg.ip = defaultCfg.ip}        
        if(channelCfg.tcpCoalescingDetection == undefined){ channelCfg.tcpCoalescingDetection = defaultCfg.tcpCoalescingDetection}
        
        /**
        * prevent than server close de connection for idle time
        * @type {bool}
        */
        this.keepAliveConnection = true;

        this.name = channelCfg.name;

        this.ip = channelCfg.ip;

        this.port = channelCfg.port;

        this.tcpCoalescingDetection = channelCfg.tcpCoalescingDetection;

        /**
        *net.socket Object
        * @type {object}
        */
        this.coreChannel = new net.Socket();

        //Hooks functions *****************************************************************************************************************************
         /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */
        this.onMbAduHook = noop;
        this.onDataHook = noop;
        this.coreChannel.on('data', (data)=>{

            self.onDataHook(data);

            //Active tcp coalesing detection for modbus tcp
            if(self.tcpCoalescingDetection){
                //one tcp message can have more than one modbus indication.
                //each modbus tcp message have a length field
                let messages = self.resolveTcpCoalescing(data);
                    
                messages.forEach((message) => {
                    if(self.validateFrame(message)){
                        self.onMbAduHook(self.coreChannel, message);
                    }
                })

            }
            //Non active tcp coalesing detection for modbus serial
            else{  
                        
                if(self.validateFrame(data)){
                    self.onMbAduHook(self.coreChannel, data);
                }
                                           
            }
        });
        
        this.onConnectHook = noop;
        this.coreChannel.on('connect', ()=>{
            self.onConnectHook(self.coreChannel);
        })

        this.onErrorHook = noop;
        this.coreChannel.on('error', (e)=>{
            this.onErrorHook(e);
        })
        /*
        this.onEndHook = noop;
        this.coreChannel.on('end', () =>{

        })

        this.onTimeOutHook = noop;
        */
        this.onCloseHook =  noop;
        this.coreChannel.on('close', (e) =>{
            self.onCloseHook();
        })
        
        this.onWriteHook = noop;

        this.validateFrame = noop;

    }

    isConnected(){
        
        if(this.coreChannel.readyState == 'open'){
            return true;
        }
        else {
            return false;
        }
        
    }

    /**
    * Init a connection with a server 
    * @returns {Promise} A promise that will be resolve once the connection is stablished with the socket as argument, or will 
    * be rejected with ip and por as parameters.
    */
    connect(){

        let self = this;
        let promise = new Promise(function(resolve, reject){

            try{

                function rejectConnection(e){
                    reject(self.ip, self.port);
                }

                self.coreChannel.once('error', rejectConnection)

                self.coreChannel.connect(self.port,self.ip, ()=>{
                    self.coreChannel.removeListener('error', rejectConnection);
                    resolve(self.coreChannel);
                });
                     
                
            }
            catch(e){
                self.onError(e);
                reject(self.ip, self.port);
            }
        })

        return promise;
    }

    disconnet(){
        let self = this;
       
        let promise = new Promise(function(resolve, reject){
            
            self.coreChannel.end(()=>{
                resolve()
            });
                
        })

        return promise;
               
    }

    /**
    * Write data to a server 
    * @param {Buffer} data data to send to server.
    * @returns {bool} True if success, otherwise false
    * be rejected with ip and por as parameters.
    */
    write(frame){

        let self = this;
        if(self.isConnected == false){
            return false;
        }
        else{

            let isSuccesfull 

            isSuccesfull = this.coreChannel.write(frame, 'utf8', function(){
              
                self.onWriteHook(self.coreChannel, frame);               
              
            });            

            return isSuccesfull;
        }
    }

    resolveTcpCoalescing(dataFrame){
        //get de first tcp header length
        let responseList = [];

        if (dataFrame.length > 7){
            let expectedlength = dataFrame.readUInt16BE(4);
            let indication = Buffer.alloc(expectedlength + 6);

            if(dataFrame.length == expectedlength + 6){
                dataFrame.copy(indication);
                responseList.push(indication);          
            }
            else if (dataFrame.length > expectedlength + 6){
                dataFrame.copy(indication,  0, 0, expectedlength + 6);
                responseList.push(indication);
                responseList = responseList.concat(this.resolveTcpCoalescing(dataFrame.slice(expectedlength + 6)));          
            }          
        }   

        return responseList;
    }

}

module.exports = TcpChannel

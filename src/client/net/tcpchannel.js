/**
* Tcp Client  module.
* @module net/tcpclient.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const { on } = require('node:events');
const net = require('node:net'); 

//No operation default function for listeners
const noop = () => {};

//default config
const defaultCfg = {
    
    ip: '127.0.0.1',
    port: 502,    
    tcpCoalescingDetection : false,
}

/**
 * Class representing a tcp channel.
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
        * @type {boolean}
        */
        this.keepAliveConnection = true;

        this.name = channelCfg.name;

        this.ip = channelCfg.ip;

        this.port = channelCfg.port;

        this.tcpCoalescingDetection = channelCfg.tcpCoalescingDetection;

        /**
        * net.Socket object for the channel.
        * @type {net.Socket}
        */
        this.coreChannel = new net.Socket();
        //Hooks functions *****************************************************************************************************************************

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */       
        this.onMbAduHook = noop;
        this.onDataHook = noop;
        this.coreChannel.on('data', (data) => {

            self.onDataHook(data);
            
            //Active tcp coalesing detection for modbus tcp
            if(self.tcpCoalescingDetection){
                
                //one tcp message can have more than one modbus indication.
                //each modbus tcp message have a length field
                let messages = self.resolveTcpCoalescing(data);
              
                messages.forEach((message, index) => {   
                                                
                    if(self.validateFrame(message)){                        
                        if (typeof self.onMbAduHook === 'function') {                           
                            self.onMbAduHook(message);
                            
                        } else {
                            throw new Error("onMbAduHook is not a function");
                        }
                    }
                })

            }
            //Non active tcp coalesing detection for modbus serial
            else{                      
                if(self.validateFrame(data)){
                    
                    if (typeof self.onMbAduHook === 'function') {                       
                        self.onMbAduHook(data);                       
                    } else {
                        throw new Error("onMbAduHook is not a function");
                    }
                }
                                            
            }
        });
        
        this.onConnectHook = noop;
        this.coreChannel.on('connect', ()=>{  
            self.__connected_status = true;
            self.onConnectHook();
        })

        this.onErrorHook = noop;
        this.coreChannel.on('error', (e) => {
            self.onErrorHook(e);
        })

        /*
        this.onEndHook = noop;
        this.coreChannel.on('end', () =>{
            
        })

        this.onTimeOutHook = noop;
        */
        this.onCloseHook =  noop;
        this.coreChannel.on('close', (e) =>{
            self.__connected_status = false;
            self.onCloseHook();
        })
        
        this.onWriteHook = noop;

        this.validateFrame = noop;

        this.__connected_status = false;

    }

    isConnected(){      
        return this.__connected_status;        
    }

    /**
    * Init a connection with a server 
    * @returns {Promise} A promise that will be resolve once the connection is stablished with the socket as argument, or will 
    * be rejected with ip and port as parameters.
    */
    connect(){
        
        let self = this; 
        return new Promise(function(resolve, reject){

            try{

                function onceRejectConnection(e){
                    reject({ip:self.ip, port:self.port});
                }

                self.coreChannel.once('error', onceRejectConnection);
               
                self.coreChannel.connect(self.port,self.ip, ()=>{
                    self.coreChannel.removeListener('error', onceRejectConnection);
                    resolve(self.coreChannel);
                });                    
                
            }
            catch(e){  
                self.onErrorHook(e);                
                reject({ip:self.ip, port:self.port});
            }
        })        
    }

    disconnect(){
        let self = this;
       
        return new Promise(function(resolve, reject){
            
            self.coreChannel.end(()=>{                
                resolve()
            });                
        })               
    }

    /**
    * Write data to a server 
    * @param {Buffer} frame data to send to server.
    * @returns {boolean} True if the entire data was flushed successfully to the kernel buffer; false otherwise.
    */
    write(frame){

        let self = this;
        if(!self.isConnected()){
            return false;
        }
        else{

            let isSuccessfull  = this.coreChannel.write(frame, 'utf8', function(){
              
                self.onWriteHook(frame);               
              
            });            

            return isSuccessfull;
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

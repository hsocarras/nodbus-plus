/**
* UDP Client  module.
* @module net/udpChannel.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const dgram = require('node:dgram');

//No operation default function for listeners
const noop = () => {};

//default config
defaultCfg = {
    
    ip: '127.0.0.1',
    port: 502,    
    tcpCoalescingDetection : false,
    udpType: 'udp4'
}

/**
 * Class representing a udp channel.
*/
class UdpChannel {
    constructor(channelCfg){

        let self = this;

        if(channelCfg.port == undefined){ channelCfg.port = defaultCfg.port}
        if(channelCfg.ip == undefined){ channelCfg.ip = defaultCfg.ip}        
        if(channelCfg.tcpCoalescingDetection == undefined){ channelCfg.tcpCoalescingDetection = defaultCfg.tcpCoalescingDetection}
        if(channelCfg.udpType == undefined){channelCfg.udpType = defaultCfg.udpType};

        /**
        * prevent than server close de connection for idle time
        * @type {bool}
        */
        this.name = channelCfg.name;

        this.ip = channelCfg.ip;

        this.port = channelCfg.port;

        this.tcpCoalescingDetection = channelCfg.tcpCoalescingDetection;
        

        /**
        *net.socket Object
        * @type {object}
        */
        this.coreChannel = dgram.createSocket(channelCfg.udpType);
       
        //Hooks functions *****************************************************************************************************************************
        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */ 
        this.onMbAduHook = noop;
        this.onDataHook = noop;
        this.coreChannel.on('message', (data, rinfo)=>{

            self.onDataHook(data);
            
            //Active tcp coalesing detection for modbus tcp
            if(self.tcpCoalescingDetection){
                
                //one tcp message can have more than one modbus indication.
                //each modbus tcp message have a length field
                let messages = self.resolveTcpCoalescing(data);
              
                messages.forEach((message, index) => {                                     
                    if(self.validateFrame(message)){                        
                        self.onMbAduHook(message);
                    }
                })

            }
            //Non active tcp coalesing detection for modbus serial
            else{  
                      
                if(self.validateFrame(data)){
                    self.onMbAduHook(data);
                }
                                           
            }
        });

        this.onConnectHook = noop;
        this.coreChannel.on('connect', ()=>{  
            self.onConnectHook();
        })

        this.onErrorHook = noop;
        this.coreChannel.on('error', (e)=>{
            this.onErrorHook(e);
        })

        this.onCloseHook =  noop;
        this.coreChannel.on('close', (e) =>{
            self.onCloseHook();
        })
        
        this.onWriteHook = noop;

        this.validateFrame = noop;
       
    }

    isConnected(){
        try{
            let remoteIp = this.coreChannel.remoteAddress()
            if (remoteIp == this.ip){
                return true;
            }
            else{
                return false;
            }
        }
        catch(e){
            return false;
        }
    }


    /**
    * Init an asociation to a remote address
    * @returns {Promise} A promise that will be resolve once the connection is stablished with the socket as argument, or will 
    * be rejected with ip and port as parameters.
    */
    connect(){

        let self = this;
        
        let promise = new Promise(function(resolve, reject){

            try{
            
                self.coreChannel.connect(self.port, self.ip, (e)=>{

                    if(e){
                        resolve(self.coreChannel);
                    }
                    else{
                        reject(self.ip, self.port);
                    }
                })             
            
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

        let promise = new Promise(function(resolve,reject){

            if(self.isConnected() == true){
                try{
                    self.coreChannel.disconnet();
                    resolve();
                }
                catch(e){
                    resolve()
                }
            }
            else{
                resolve();
            }
        })
        
        return promise;
              
    }

    /**
    * Write data to a server 
    * @param {Buffer} frame data to send to server.
    * @returns {bool} True if success, otherwise false
    * be rejected with ip and por as parameters.
    */
    write(frame){

        let self = this;

        if(self.isConnected() == false){
            return false;
        }
        else{

            

            this.coreChannel.send(frame, function(e){
              
                if(e){
                    self.onErrorHook(e)
                }
                else{
                    self.onWriteHook(frame);   
                }                            
              
            });            

            return true;
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

module.exports = UDPClient;
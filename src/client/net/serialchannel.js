/**
* Serial Channel  module.
* @module net/serialchannel.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const { SerialPort } = require('serialport');
const { InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout')
const { ReadlineParser } = require('@serialport/parser-readline') 

//No operation default function for listeners
const noop = () => {};

//default config
//Default Server's Configuration object
const defaultCfg = {
    
    speed : 7, //Enum startin at 0
    dataBits : 8,    
    stopBits : 1,
    parity : 1,    
    timeBetweenFrame : 20,
}

//BaudRates Map
const allowedBaudRates = [110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];
const allowedParity = ['none', 'even', 'odd'];

/**
 * Class representing a serial channel.
*/
class SerialChannel {
  /**
  * Create a serial channel.
  */
    constructor(channelCfg){

        let self = this;

        channelCfg.autoOpen = false;
        channelCfg.path = channelCfg.port;
        if(channelCfg.speed == undefined){ channelCfg.speed = defaultCfg.speed}
        channelCfg.baudRate = allowedBaudRates[channelCfg.speed];
        if(channelCfg.dataBits == undefined){ channelCfg.dataBits = defaultCfg.dataBits}
        if(channelCfg.stopBits == undefined){ channelCfg.stopBits = defaultCfg.stopBits}
        if(channelCfg.parity == undefined | channelCfg.parity < 0 | channelCfg.parity > 2){ channelCfg.parity = allowedParity[defaultCfg.parity]}
        if(channelCfg.timeBetweenFrame == undefined){channelCfg.timeBetweenFrame = defaultCfg.timeBetweenFrame}
        
       

        this.name = channelCfg.name;

       
        this.port = channelCfg.port;

        

        /**
        *net.socket Object
        * @type {object}
        */
        this.coreChannel = new SerialPort(netCfg);
        this.parser = this.coreChannel.pipe(new InterByteTimeoutParser({ interval: netCfg.timeBetweenFrame }));

        //Hooks functions *****************************************************************************************************************************

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */       
        this.onMbAduHook = noop;
        this.onDataHook = noop;
        this.parser.on('data', (data)=>{

            self.onDataHook(data);
            
            
                    
            if(self.validateFrame(data)){
                self.onMbAduHook(data);
            }
                                           
            
        });
        
        this.onConnectHook = noop;
        this.coreChannel.on('open', ()=>{  
            self.onConnectHook();
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
        
        return this.coreChannel.isOpen;
        
    }

    /**
    * Init a connection with a server 
    * @returns {Promise} A promise that will be resolve once the connection is stablished with the socket as argument, or will 
    * be rejected with ip and port as parameters.
    */
    connect(){
        
        let self = this;
        let promise = new Promise(function(resolve, reject){

            try{                
               
                self.coreChannel.open((err)=>{
                    
                    if(err){
                        self.onErrorHook(e);                
                        reject('serial', self.port);
                    }
                    else{
                        resolve(self.coreChannel);
                    }                                       
                   
                });
                     
                
            }
            catch(e){                
                self.onErrorHook(e);                
                reject('serial', self.port);
            }
        })

        return promise;
    }


    disconnect(){
        let self = this;
       
        this.coreChannel.close();

        return Promise.resolve();
               
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

            this.coreChannel.write(frame, function(){
              
                self.onWriteHook(frame);               
              
            });            

            return true;
        }
    }

   

}

module.exports = SerialChannel;
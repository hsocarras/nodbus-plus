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
    
    speed : 7, // Corresponds to 19200 baudRate
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
  * @throws {Error} Will throw an error if channelCfg.port is not provided.
  * @param {Object} channelCfg - The configuration object for the serial channel.
  * @property {string} channelCfg.port - The port name (e.g., 'COM1' or '/dev/ttyUSB0').
  * @property {string} [channelCfg.name] - The name of the channel.
  * @property {number} [channelCfg.speed=7] - The speed index (0-10) corresponding to standard baud rates.
  * @property {number} [channelCfg.dataBits=8] - The number of data bits.
  * @property {number} [channelCfg.stopBits=1] - The number of stop bits.
  * @property {number} [channelCfg.parity=1] - The parity index (0-2) corresponding to 'none', 'even', 'odd'.
  * @property {number} [channelCfg.timeBetweenFrame=20] - The inter-byte timeout in milliseconds.
  */
    constructor(channelCfg){

        let self = this;

        // Validate that a port was provided to avoid runtime errors when creating SerialPort
        if (!channelCfg || !channelCfg.port) {
            throw new Error('SerialChannel: channelCfg.port is required');
        }

        channelCfg.autoOpen = false;
        channelCfg.path = channelCfg.port;

        //Set default for missing properties
        if(channelCfg.speed === undefined){ channelCfg.speed = defaultCfg.speed}
        if(channelCfg.dataBits === undefined){ channelCfg.dataBits = defaultCfg.dataBits}
        if(channelCfg.stopBits === undefined){ channelCfg.stopBits = defaultCfg.stopBits}
        if(channelCfg.parity === undefined){ channelCfg.parity = defaultCfg.parity}
        if(channelCfg.timeBetweenFrame === undefined){channelCfg.timeBetweenFrame = defaultCfg.timeBetweenFrame}
        
       // Validate and map configuration values
        if (channelCfg.speed < 0 || channelCfg.speed >= allowedBaudRates.length) {
            channelCfg.speed = defaultCfg.speed; // Default to a safe value if out of bounds
        }
        channelCfg.baudRate = allowedBaudRates[channelCfg.speed];
        if (channelCfg.parity < 0 || channelCfg.parity >= allowedParity.length) {
            channelCfg.parity = defaultCfg.parity; // Default to a safe value if out of bounds
        }
        channelCfg.parity = allowedParity[channelCfg.parity];

        this.name = channelCfg.name;       
        this.port = channelCfg.port;

        

        /**
        * The underlying SerialPort object.
        * @type {SerialPort}
        */
        this.coreChannel = new SerialPort(channelCfg);
        this.parser = this.coreChannel.pipe(new InterByteTimeoutParser({ interval: channelCfg.timeBetweenFrame }));

        //Hooks functions *****************************************************************************************************************************

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */       
        this.onMbAduHook = noop;
        this.onDataHook = noop;
        this.parser.on('data', (data) => {

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
        return new Promise(function(resolve, reject){

            try{                
               
                self.coreChannel.open((err) => {
                    
                    if(err){
                        self.onErrorHook(err);                
                        reject(self);
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
        if(!self.isConnected()){
            return false;
        }
       

        this.coreChannel.write(frame, function(err){
            if(err){ 
                self.onErrorHook(err);
            }
            self.onWriteHook(frame); 
        });            

        return true;
        
    }

   

}

module.exports = SerialChannel;
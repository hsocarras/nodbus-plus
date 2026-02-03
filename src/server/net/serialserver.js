/**
**  Serial server module.
* @module net/tcpserver.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const { SerialPort } = require('serialport');
const { InterByteTimeoutParser } = require('@serialport/parser-inter-byte-timeout')
const { ReadlineParser } = require('@serialport/parser-readline')

//Default Server's Configuration object
const defaultCfg = {
    
    speed : 7, //Enum startin at 0
    dataBits : 8,    
    stopBits : 1,
    parity : 1,    
    timeBetweenFrame : 20,
}

//No operation default function for listeners
const noop = () => {};

//BaudRates Map
const allowedBaudRates = [110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200];
const allowedParity = ['none', 'even', 'odd'];

/**
 * Class to wrap a serial port.
 */
class SerialServer {
    /**
    * Create a Serial Server.
    * @param {object} netCfg configuration object.
    */
    constructor(netCfg = defaultCfg){
        // Ensure path is defined for SerialPort
        if (netCfg.port === undefined) {
            throw new Error("Serial port path (netCfg.port) must be defined.");
        }

        netCfg.autoOpen = false;
        netCfg.path = netCfg.port;
        if(netCfg.speed === undefined){ netCfg.speed = defaultCfg.speed}
        netCfg.baudRate = allowedBaudRates[netCfg.speed];
        if(netCfg.dataBits === undefined){ netCfg.dataBits = defaultCfg.dataBits}
        if(netCfg.stopBits === undefined){ netCfg.stopBits = defaultCfg.stopBits}
        // Correct parity assignment: use provided if valid, else default
        netCfg.parity = (netCfg.parity !== undefined && netCfg.parity >= 0 && netCfg.parity <= 2) ? allowedParity[netCfg.parity] : allowedParity[defaultCfg.parity];
        if(netCfg.timeBetweenFrame === undefined){netCfg.timeBetweenFrame = defaultCfg.timeBetweenFrame}

        let self = this;
        
        /**
        * serial port instance
        * @type {Object}
        */
        this.coreServer = new SerialPort(netCfg);
       
        this.parser = this.coreServer.pipe(new InterByteTimeoutParser({ interval: netCfg.timeBetweenFrame })); // Use netCfg.timeBetweenFrame directly
               

      
        /**
        * port
        * @type {string}
        */
        this.port = netCfg.port;  
                
        

        //API Callback interfaces****************************************************************************************************************************************

         /**
        *  function to executed when event data is emited
        * @param {Buffer} data
        */
        this.onDataHook = noop;

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */
        this.onMbAduHook = noop;

        /**
        *  function to executed when event listening is emited
        */
        this.onListeningHook = noop;
        this.coreServer.on('open', () => {          
            self.onListeningHook();          
        });

        
        /**
        *  function to executed when event error is emited
        * @param {Object} error
        */
        this.onErrorHook = noop;
        this.coreServer.on('error', (e) => {            
            self.onErrorHook(e);            
        });

        /**
        *  function to executed when event close is emited
        */
        this.onServerCloseHook = noop;
        this.coreServer.on('close', function(){            
             
            self.onServerCloseHook();
               
        });


        /**
        *  function to executed when event write is emited
        * @param {Buffer} buff
        */
        this.onWriteHook = noop;
        //******************************************************************************************************************************************************

        //function for validating data****************************************************************
        this.validateFrame = ()=>{           
            return false
        }
        
        this.parser.on('data',function(data){
            
            if(self.onDataHook instanceof Function){
                self.onDataHook(self, data);
            }      

                     
            if(self.onMbAduHook  instanceof Function && self.validateFrame(data)){                
                self.onMbAduHook(self, data);
            }                 
                    
        });

    }     

    /**
    * listening status
    * @type {boolean}
    */
    get isListening(){
        return this.coreServer.isOpen;
    }

      
    /**
    * Start the tcp server
    */
    start (){       
        
        this.coreServer.open( (err) => { // Use arrow function to preserve 'this' context
            if (err) {
                this.onErrorHook(err); // 'this' refers to SerialServer instance
            }
        })
          
    }

    /**
    * Stop the tcp server
    */
    stop (){
        //cerrando el server 
        this.coreServer.close(); 
    }

    /**
    * function to write in a conection. Callback to onWriteHook hook function.
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    write (socket, frame){
        let self = this;   
        
        this.coreServer.write(frame, function(){
            self.onWriteHook(socket, frame);
        });        
    }
    

}

module.exports = SerialServer;
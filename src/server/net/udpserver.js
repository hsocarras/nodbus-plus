/**
**  UDP server module.
* @module net/udpnet.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const dgram = require('node:dgram');

//Default Server's Configuration object
const defaultCfg = {
    port : 502,
    maxConnections : 32,
    accessControlEnable: false, 
    tcpCoalescingDetection : false, 
    //connectionTimeout : 0,
    udpType: 'udp4'
}

//No operation default function for listeners
const noop = () => {};

/**
 * Class to wrap a node udp datagram socket.
 */
class UdpServer {
    /**
    * Create a UdpServer.
    * @param {object} netCfg configuration object.
    */
    constructor(netCfg = defaultCfg, type){
        
        if(netCfg.port == undefined){ netCfg.port = defaultCfg.port}
        if(netCfg.maxConnections == undefined){ netCfg.maxConnections = defaultCfg.maxConnections}
        if(netCfg.accessControlEnable == undefined){ netCfg.accessControlEnable = defaultCfg.accessControlEnable}
        if(netCfg.tcpCoalescingDetection == undefined){ netCfg.tcpCoalescingDetection = defaultCfg.tcpCoalescingDetection}
        if(netCfg.udpType != 'udp4' & netCfg.udpType != 'udp6'){ netCfg.udpType = defaultCfg.udpType}
        
        
        var self = this;

        /**
        * udp server
        * @type {Object}
        */
        this.coreServer = dgram.createSocket(netCfg.udpType);

        //array whit connections
        this.activeConnections = [];

        /**
        * port
        * @type {number}
        */
        this.port = netCfg.port;  

        this.maxConnections = netCfg.maxConnections;

        this.accessControlEnable = true;    
        
        this.tcpCoalescingDetection = netCfg.tcpCoalescingDetection;
        
         /**
        * listening status
        * @type {boolean}
        */
        this.isListening = false;       
                
        //Hoocks functions***************************************************************************************************

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
        this.coreServer.on('listening', () => {         
            self.isListening = true; 
            self.onListeningHook();          
        });

        /**
        *  function to executed access control
        * @param {Object} net.socket
        */
        this.onConnectionRequestHook = noop;

        /**
        *  function to executed when event connection is emited
        * @param {Object} net.socket
        */
        this.onConnectionAcceptedHook = noop;

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

            self.isListening = false;       
            self.onServerCloseHook();
               
        });

        /**
        *  function to executed when event socket#close is emited
        */
        this.onConnectionCloseHook = noop;

        /**
        *  function to executed when event write is emited
        * @param {Buffer} buff
        */
        this.onWriteHook = noop;

        //function for validating data****************************************************************
        this.validateFrame = ()=>{ return false}
      
    } 
        
    /**
    * Start the tcp server
    */
    start (){
        var self = this; 

        this.coreServer.on('message', function(msg, rinfo){

            //udp is conexionless protocol.

            rinfo.remoteAddress = rinfo.address;
            rinfo.remotePort = rinfo.port;                 
            
            if(self.onDataHook instanceof Function){
                self.onDataHook(rinfo, msg);
            }

            if(msg.length > 7){

                let messages = [];

                //Active tcp coalesing detection
                
                if(self.tcpCoalescingDetection){
                    //one tcp message can have more than one modbus indication.
                    //each modbus tcp message have a length field
                    messages = self.resolveTcpCoalescing(msg);

                    messages.forEach((message) => {
                        if(self.onMbAduHook  instanceof Function  & self.validateFrame(message)){
                            self.onMbAduHook(rinfo, message);
                        }
                    })

                }
                else{
                    //if tcpcoalesing is not active only one indication per tcp frame will be processed.
                    let expectedLength = msg.readUInt16BE(4) + 6;
                    if(msg.length >= expectedLength){

                        let message = msg.subarray(0, expectedLength);
                        if(self.onMbAduHook  instanceof Function & self.validateFrame(message)){
                            self.onMbAduHook(rinfo, message);
                        }
                    }   
                }
            }

        });

        try {
            this.coreServer.bind(this.port)
        }
        catch(error){
            this.onError(error);
        }

    }

    /**
    * Stop the tcp server
    */
    stop (){
        //cerrando el server
        this.coreServer.close();      
    }
    
    /**
    * function to write in a conection
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    write (rinfo, frame){
        let self = this;    
        
        self.coreServer.send(frame, 0, frame.length, rinfo.port, rinfo.address, function(){
            if(self.onWrite){
                self.onWrite(rinfo, frame);
            }
        })    
    }

    /**
     * Split the input buffer in several indication buffer baset on length property
     * of modbus tcp header. The goal of this funcion is suport several modbus indication
     * on same tcp frame due to tcp coalesing.
     * @param {Buffer Object} dataFrame 
     * @return {Buffer array}
     */
    resolveTcpCoalescing(dataFrame){
        //get de first tcp header length
        let indicationsList = [];

        if (dataFrame.length > 7){
            let expectedlength = dataFrame.readUInt16BE(4);
            let indication = Buffer.alloc(expectedlength + 6);

            if(dataFrame.length == expectedlength + 6){
                dataFrame.copy(indication);
                indicationsList.push(indication);          
            }
            else if (dataFrame.length > expectedlength + 6){
                dataFrame.copy(indication,  0, 0, expectedlength + 6);
                indicationsList.push(indication);
                indicationsList = indicationsList.concat(this.resolveTcpCoalescing(dataFrame.slice(expectedlength + 6)));          
            }          
        }   

        return indicationsList;
    }
}

//Old pattern for static members
UdpServer.prototype.validateFrame = require('./tcpserver').prototype.validateFrame;

module.exports = UdpServer;
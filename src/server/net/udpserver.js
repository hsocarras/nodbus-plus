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
    //connectionTimeout : 0,
    type: 'udp4'
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
        if(netCfg.type == undefined){ netCfg.type = defaultCfg.type}
        
        var self = this;

        /**
        * udp server
        * @type {Object}
        */
        this.coreServer = dgram.createSocket(netCfg.type);

        //array whit connections
        this.activeConnections = [];

        /**
        * port
        * @type {number}
        */
        this.port = netCfg.port;  

        this.maxConnections = netCfg.maxConnections;

        this.accessControlEnable = true;

        //array whit connections
        this.connections = new Array (this.coreServer.maxConnections);

        for(let i = 0; i < self.connections.length; i++){        
          this.connections[i] = 0;
        }  
            
        /**
        * list of connections
        * @type {Object[]}
        */
        Object.defineProperty(self,'activeConnections',{
            get: function(){
              let index = this.connections.indexOf(0);            
              return this.connections.slice(0, index);
            }
        })      
        
        
        //User listeners
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
        this.tcpServer.on('listening', () => {          
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
        this.tcpServer.on('error', (e) => {            
                self.onErrorHook(e);            
        });

        /**
        *  function to executed when event close is emited
        */
        this.onServerCloseHook = noop;
        this.tcpServer.on('close', function(){
            
            self.activeConnections = [];          
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

      
    }   

    get maxConnections(){
        this.coreServer.maxConnections
    }
    
    set maxConnections(max){   
        var self = this;
        this.coreServer.maxConnections  
        if(typeof max == 'number') {
          let extend = new Array(max);

          for(let i = 0; i < extend.length; i++){
            extend[i] = 0;
          }
          
          self.connections.concat(extend);
        }
        else{
          throw new TypeError('parameter must be a number')
        }
    }
    
    /**
    * listening status
    * @type {boolean}
    */
    get isListening(){
        return this.coreServer.listening;
    }
    
    /**
    * Start the tcp server
    */
    Start (){
      var self = this;

      this.coreServer.on('error', function(err){
        self.onError(err);
      });

      this.coreServer.on('close', () => {
        self.coreServer.listening = false;
        self.onServerClose
      });

      this.coreServer.on('listening', () => {
        self.coreServer.listening = true;
        self.onListening();
      });

      this.coreServer.on('message', function(msg, rinfo){

        //udp is conexionless protocol. connections array is used for compatibility for the 
        //tcp api
        let id = self.connections.indexOf(0)
        rinfo.remoteAddress = rinfo.address;
        rinfo.remotePort = rinfo.port;
        self.connections[id] = rinfo;      
        self.onData(id, msg);

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
    Stop (){
        //cerrando el server
        this.coreServer.close();      
    }
    
    /**
    * function to write in a conection
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    Write (socketIndex, resp){
      let self = this;    
      let rinfo = self.connections[socketIndex];    
      self.connections[socketIndex] = 0;
      self.coreServer.send(resp.adu.aduBuffer, 0, resp.adu.aduBuffer.length, rinfo.port, rinfo.address, function(){
        if(self.onWrite){
          self.onWrite(resp);
        }
      })    
    }
}

//Old pattern for static members
UdpServer.prototype.validateFrame = require('./tcpserver').prototype.validateFrame;

module.exports = UdpServer;
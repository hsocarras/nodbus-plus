/**
**  UDP server module.
* @module net/udpnet.
* @author Hector E. Socarras.
* @version 0.9.0
*/

const dgram = require('dgram');

class UDPServer {
    constructor(p=502, type = 'udp4'){
        var self = this;

        /**
        * udp server
        * @type {Object}
        */
      this.udpServer = dgram.createSocket(type)

      this.udpServer.maxConnections = 16;

      //array whit connections
      this.connections = new Array (this.udpServer.maxConnections);

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
        
        /**
        * port
        * @type {number}
        */
        this.port = p;   
        

        /**
        *  Inactivity time to close a connection
        * @type {number}
        */
        this.connectionTimeout = 0;

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
        *  function to executed when event connection is emited
        * @param {Object} net.socket
        */
        this.onConnection = function(){ console.log('new connection')};

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
        *  function to executed when event socket#close is emited
        */
        this.onConnectionClose = null;;

        /**
        *function to executed when event socket#end is emited
        */
        this.onClientEnd = null;

      /**
      *  function to executed when event write is emited
      * @param {Buffer} buff
      */
      this.onWrite = null

      
    }   

    get maxConnections(){
      this.udpServer.maxConnections
      }
    
    set maxConnections(max){   
      var self = this;
      this.udpServer.maxConnections  
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
        return this.udpServer.listening;
      }
    
    /**
  * Start the tcp server
  */
  Start (){
    var self = this;

    this.udpServer.on('error', function(err){
      self.onError(err);
    });

    this.udpServer.on('close', () => {
      self.udpServer.listening = false;
      self.onServerClose
    });

    this.udpServer.on('listening', () => {
      self.udpServer.listening = true;
      self.onListening();
    });

    this.udpServer.on('message', function(msg, rinfo){

      //udp is conexionless protocol. connections array is used for compatibility for the 
      //tcp api
      let id = self.connections.indexOf(0)
      rinfo.remoteAddress = rinfo.address;
      rinfo.remotePort = rinfo.port;
      self.connections[id] = rinfo;      
      self.onData(id, msg);

    });
    try {
       this.udpServer.bind(this.port)
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
      this.udpServer.close();      
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
    self.udpServer.send(resp.adu.aduBuffer, 0, resp.adu.aduBuffer.length, rinfo.port, rinfo.address, function(){
      if(self.onWrite){
        self.onWrite(resp);
      }
    })    
  }
}

module.exports = UDPServer;
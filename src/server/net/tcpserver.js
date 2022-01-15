/**
**  Tcp server module.
* @module net/tcpserver.
* @author Hector E. Socarras.
* @version 0.4.0
*/

var net = require('net');

/**
 * Class representing a tcp server layer for modbus tcp.
 */
class TCPServer {
  /**
  * Create a Tcp Server.
  * @param {int} port Port for the server listen with.
  */
  constructor(p=502){

    var self = this;

    /**
    * tcp server
    * @type {Object}
    */
    this.tcpServer = net.createServer();

    //array whit connections
    let connections = [];
    
    /**
    * list of connections
    * @type {Object[]}
    */
    Object.defineProperty(self,'activeConnections',{
        get: function(){ return connections}
    })
    
      

    /**
    * port
    * @type {number}
    */
    this.port = p;   

    //Socket config

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

    this.tcpServer.on('error', self.onError);

    this.tcpServer.on('close', function(){
      connections = [];
      self.onServerClose();
    });

    this.tcpServer.on('listening', self.onListening);

    this.tcpServer.on('connection', function(socket) {

      self.onConnection(socket);
        

      //adding sockets to connections array
      connections.push(socket)

      //defining sockets behavior
      if(self.connectionTimeout > 0) {
        socket.setTimeout(self.connectionTimeout);
      }

      socket.on('data',function(data){

        let index = connections.indexOf(socket);
        self.onData(index, data);
          
      });

      socket.on('error',self.onError);

      socket.on('timeout',function() {
          socket.end();
      })


      if(self.onClientEnd){
        socket.on('end', self.onClientEnd);
      }

      socket.on('close',function(){
          var index = connections.indexOf(socket);
          connections.splice(index,1);
      });

      if(self.onConnectionClose){
        socket.on('close', self.onConnectionClose);
      }        
        
    });

  }  

  get maxConnections(){
    return this.tcpServer.maxConnections;
  }

  set maxConnections(max){
    this.tcpServer.maxConnections = max;
  }

  /**
  * listening status
  * @type {boolean}
  */
  get isListening(){
    return this.tcpServer.listening;
  }
  
  /**
  * Start the tcp server
  */
  Start (){
      try {
         this.tcpServer.listen(this.port)
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
      this.tcpServer.close();
      var sockets = this.activeConnections;
      sockets.forEach(function(element){
          element.destroy();
      });
  }

  /**
  * function to write in a conection
  * @param {number} socketIndex. Index to socket in connections array
  * @param {buffer} data
  */
  Write (socketIndex, resp){
    let self = this;
    let socket = self.activeConnections[socketIndex];
    socket.write(resp.adu.aduBuffer, 'utf8', function(){
      if(self.onWrite){
        self.onWrite(resp);
      }
    });
  }

}

module.exports = TCPServer;

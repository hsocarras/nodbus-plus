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
  constructor(net_cfg = {port:502}){

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
    this.port = net_cfg.port || 502;   

    this.accesControlEnable = net_cfg.accesControlEnable || false;

    //Socket config

    /**
    *  Inactivity time to close a connection
    * @type {number}
    */
    this.connectionTimeout = net_cfg.connectionTimeout || 0;;

    //callback interfaces

    /**
    *  function to executed when event data is emited
    * @param {Buffer} data
    */
    this.onData = undefined;

    /**
    *  function to executed when modbus message is detected
    * @param {Buffer} data
    */
    this.onMessage = undefined;

    /**
    *  function to executed when event listening is emited
    */
    this.onListening = undefined;

    /**
    *  function to executed access control
    * @param {Object} net.socket
    */
   this.onConnectionRequest = (socket) => {return true};

    /**
    *  function to executed when event connection is emited
    * @param {Object} net.socket
    */
    this.onConnectionAccepted = undefined;

    /**
    *  function to executed when event error is emited
    * @param {Object} error
    */
    this.onError = undefined;

    /**
    *  function to executed when event close is emited
    */
    this.onServerClose = undefined;

    /**
    *  function to executed when event socket#close is emited
    */
    this.onConnectionClose = undefined;

    /**
    *  function to executed when event write is emited
    * @param {Buffer} buff
    */
    this.onWrite = undefined;

    this.tcpServer.on('error', (e) => {
        if(self.onError instanceof Function){
            self.onError(e);
        }
    });

    this.tcpServer.on('close', function(){
      connections = [];
      if(self.onServerClose instanceof Function){
        self.onServerClose();
      }      
    });

    this.tcpServer.on('listening', () => {
      if(self.onListening instanceof Function){
        self.onListening();
      }
    });

    this.tcpServer.on('connection', function(socket) {

      function AceptConnection(socket){

          if(self.onConnectionAccepted instanceof Function){
            self.onConnectionAccepted(socket);
          }

          //adding sockets to connections pool
          connections.push(socket)

          //disabling nagle algorithm
          socket.setNoDelay(true);
          
          socket.on('data',function(data){

            let index = connections.indexOf(socket);

            if(self.onData instanceof Function){
                self.onData(index, data);
            }

            let messages = self.SplitTCPFrame(data);

            messages.forEach((message) => {
                if(self.onMessage  instanceof Function){
                  self.onMessage(index, message);
                }
            })
                          
          });

          socket.on('error', (e) => {
            if(self.onError instanceof Function){
                self.onError(e);
            }
          });

          socket.on('close',function(had_error){

            var index = connections.indexOf(socket);
            //deleting socket from pool
            connections.splice(index,1);

            if(self.onConnectionClose instanceof Function){
              self.onConnectionClose(had_error);
            }
          });

      }

      if(self.accesControlEnable){
          if(self.onConnectionRequest(socket)){
              AceptConnection(socket);
          }
      }
      else{
          AceptConnection(socket);
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

  GetSocket(socket_index){
      return this.activeConnections[socket_index];
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
  Write (socketIndex, message_frame){
    let self = this;
    let socket = self.activeConnections[socketIndex];
    socket.write(message_frame, 'utf8', function(){
      if(self.onWrite instanceof Function){
        self.onWrite(socket.remoteAddress, message_frame);
      }
    });
  }

  /**
   * Split the input buffer in several indication buffer baset on length property
   * of modbus tcp header. The goal of this funcion is suport several modbus indication
   * on same tcp frame due to tcp coalesing.
   * @param {Buffer Object} dataFrame 
   * @return {Buffer array}
   */
  SplitTCPFrame(dataFrame){
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
          indicationsList = indicationsList.concat(this.SplitTCPFrame(dataFrame.slice(expectedlength + 6)));          
        }          
    }   

    return indicationsList;
  }
  

}

module.exports = TCPServer;

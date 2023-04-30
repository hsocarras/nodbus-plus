/**
**  Tcp server module.
* @module net/tcpserver.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const net = require('node:net'); 

//Default Server's Configuration object
const defaultCfg = {
  port : 502,
  maxConnections : 32,
  accesControlEnable: false,
  connectionTimeout : 0
}

//No operation default function for listeners
const noop = () => {};

/**
 * Class to wrap a node net server.
 */
class TCPServer {
    /**
    * Create a Tcp Server.
    * @param {int} port Port for the server listen with.
    */
    constructor(netCfg = defaultCfg){

        if(netCfg.port == undefined){ netCfg.port = defaultCfg.port}
        if(netCfg.maxConnections == undefined){ netCfg.maxConnections = defaultCfg.maxConnections}
        if(netCfg.accesControlEnable == undefined){ netCfg.accesControlEnable = defaultCfg.accesControlEnable}
        if(netCfg.connectionTimeout == undefined){ netCfg.connectionTimeout = defaultCfg.connectionTimeout}

        let self = this;

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
        this.port = netCfg.port;   

        this.accesControlEnable = netCfg.accesControlEnable;
        
        /**
        *  Inactivity time to close a connection
        * @type {number}
        */
        this.connectionTimeout = netCfg.connectionTimeout;

        //API Callback interfaces****************************************************************************************************************************************

        /**
        *  function to executed when event data is emited
        * @param {Buffer} data
        */
        this.onData = noop;

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */
        this.onMessage = noop;

        /**
        *  function to executed when event listening is emited
        */
        this.onListening = noop;
        this.tcpServer.on('listening', () => {          
            self.onListening();          
        });

        /**
        *  function to executed access control
        * @param {Object} net.socket
        */
        this.onConnectionRequest = noop;

        /**
        *  function to executed when event connection is emited
        * @param {Object} net.socket
        */
        this.onConnectionAccepted = noop;

        /**
        *  function to executed when event error is emited
        * @param {Object} error
        */
        this.onError = noop;
        this.tcpServer.on('error', (e) => {            
                self.onError(e);            
        });

        /**
        *  function to executed when event close is emited
        */
        this.onServerClose = noop;
        this.tcpServer.on('close', function(){
            connections = [];          
            self.onServerClose();
               
        });

        /**
        *  function to executed when event socket#close is emited
        */
        this.onConnectionClose = noop;

        /**
        *  function to executed when event write is emited
        * @param {Buffer} buff
        */
        this.onWrite = noop;
        //******************************************************************************************************************************************************


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

    getSocket(socket_index){
        return this.activeConnections[socket_index];
    }
  
    /**
    * Start the tcp server
    */
    start (){
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
    stop (){
        //cerrando el server
        this.tcpServer.close();
        var sockets = this.activeConnections;
        sockets.forEach(function(element){
            element.destroy();
        });
    }

    /**
    * function to write in a conection. Callback to onWrite hook function.
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    write (socketIndex, frame){
        let self = this;    
        let socket = self.activeConnections[socketIndex];
        socket.write(frame, 'utf8', function(){        
            self.onWrite(socket.remoteAddress, frame);        
        });
    }

    /**
     * Split the input buffer in several indication buffer baset on length property
     * of modbus tcp header. The goal of this funcion is suport several modbus indication
     * on same tcp frame due to tcp coalesing.
     * @param {Buffer Object} dataFrame 
     * @return {Buffer array}
     */
    splitTcpFrame(dataFrame){
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

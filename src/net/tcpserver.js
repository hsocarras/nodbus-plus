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
class TcpServer {
    /**
    * Create a Tcp Server.
    * @param {object} netCfg configuration object.
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
        this.onDataHook = noop;

        /**
        *  function to executed when modbus message is detected
        * @param {Buffer} data
        */
        this.onMessageHook = noop;

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
            connections = [];          
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
        //******************************************************************************************************************************************************


        this.tcpServer.on('connection', function(socket) {

          function AceptConnection(socket){

              if(self.onConnectionAcceptedHook instanceof Function){
                self.onConnectionAcceptedHook(socket);
              }

              //adding sockets to connections pool
              connections.push(socket)

              //disabling nagle algorithm
              socket.setNoDelay(true);
              
              socket.on('data',function(data){

                let index = connections.indexOf(socket);

                if(self.onDataHook instanceof Function){
                    self.onDataHook(index, data);
                }

                let messages = self.SplitTCPFrame(data);

                messages.forEach((message) => {
                    if(self.onMessageHook  instanceof Function){
                      self.onMessageHook(index, message);
                    }
                })
                              
              });

              socket.on('error', (e) => {
                if(self.onErrorHook instanceof Function){
                    self.onErrorHook(e);
                }
              });

              socket.on('close',function(had_error){

                var index = connections.indexOf(socket);
                //deleting socket from pool
                connections.splice(index,1);

                if(self.onConnectionCloseHook instanceof Function){
                  self.onConnectionCloseHook(had_error);
                }
              });

          }

          if(self.accesControlEnable){
              if(self.onConnectionRequestHook(socket)){
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
            this.onErrorHook(error);
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
    * function to write in a conection. Callback to onWriteHook hook function.
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    write (socketIndex, frame){
        let self = this;    
        let socket = self.activeConnections[socketIndex];
        socket.write(frame, 'utf8', function(){        
            self.onWriteHook(socket.remoteAddress, frame);        
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

module.exports = TcpServer;

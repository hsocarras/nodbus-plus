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
  accessControlEnable: false,
  //connectionTimeout : 0
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
        if(netCfg.accessControlEnable == undefined){ netCfg.accessControlEnable = defaultCfg.accessControlEnable}
        //if(netCfg.connectionTimeout == undefined){ netCfg.connectionTimeout = defaultCfg.connectionTimeout}

        let self = this;

        /**
        * tcp server
        * @type {Object}
        */
        this.coreServer = net.createServer();

        //array whit connections
        this.activeConnections = [];
      
        /**
        * port
        * @type {number}
        */
        this.port = netCfg.port;  

        this.maxConnections = netCfg.maxConnections;
        
        this.accessControlEnable = true;
        
        /**
        *  Inactivity time to close a connection
        * @type {number}
        */
        //this.connectionTimeout = netCfg.connectionTimeout;

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
        this.coreServer.on('listening', () => {          
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
        //******************************************************************************************************************************************************

        //function for validating data****************************************************************
        this.validateFrame = ()=>{ return false}

        this.coreServer.on('connection', function(socket) {  
           

            //disabling nagle algorithm
            socket.setNoDelay(true);
          
            socket.on('data',function(data){

                
                if(self.onDataHook instanceof Function){
                    self.onDataHook(socket, data);
                }

                let messages = self.resolveTcpCoalescing(data);

                messages.forEach((message) => {
                    if(self.onMbAduHook  instanceof Function){
                      self.onMbAduHook(socket, message);
                    }
                })
                          
            });

            socket.on('error', (e) => {
                if(self.onErrorHook instanceof Function){
                    self.onErrorHook(e);
                }
            });

            socket.on('close',function(had_error){

                var index = self.activeConnections.indexOf(socket);
                //deleting socket from pool
                self.activeConnections.splice(index,1);

                if(self.onConnectionCloseHook instanceof Function){
                    self.onConnectionCloseHook(had_error);
                }
            });            

            //adding sockets to connections pool
            self.activeConnections.push(socket)

            if(self.onConnectionAcceptedHook instanceof Function){
              self.onConnectionAcceptedHook(socket);
            }
            
        });

    }  

    get maxConnections(){
      return this.coreServer.maxConnections;
    }

    set maxConnections(max){
      this.coreServer.maxConnections = max;
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
    start (){
        try {
          this.coreServer.listen(this.port)
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
        this.activeConnections.forEach(function(element){
            element.destroy();
        });
       
        this.coreServer.close(); 
    }

    /**
    * function to write in a conection. Callback to onWriteHook hook function.
    * @param {number} socketIndex. Index to socket in connections array
    * @param {buffer} data
    */
    write (socket, frame){
        let self = this;    
        
        socket.write(frame, 'utf8', function(){        
            self.onWriteHook(socket, frame);        
        });
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

module.exports = TcpServer;



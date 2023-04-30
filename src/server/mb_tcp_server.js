/**
* A fully functional Modbus Tcp protocol server.
* @module server/mb_tcp_server.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const ModbusTcpServer = require('../protocol/modbus_server_tcp');
const tcpServer = require('./net/tcpserver');
const udpServer = require('./net/udpserver');

//Default Server's Configuration object
const defaultCfg = {
  inputs : 2048,
  coils : 2048,
  holdingRegisters : 2048,
  inputRegisters : 2048,
  transportProtocol : 0,  //0 - tcp, 1- udp4, 2 - udp6
  port : 502,
  maxConnections : 32
}

/**
 * Class representing a modbus tcp server fully functionl.
 * @extends ModbusTcpServer
*/
class NodbusTcpServer extends ModbusTcpServer {
    /**
    * Create a Modbus Tcp Server.
    * @param {object} config object.
    * 
    */
    constructor(mbTcpServerCfg = defaultCfg){
        super(mbTcpServerCfg);
        let self = this;

        //arguments check
        if(mbTcpServerCfg.transportProtocol == undefined){mbTcpServerCfg.transportProtocol = defaultCfg.transportProtocol}
        if(mbTcpServerCfg.port == undefined){ mbTcpServerCfg.port = defaultCfg.port}
        if(mbTcpServerCfg.maxConnections == undefined){ mbTcpServerCfg.maxConnections = defaultCfg.maxConnections}
      
        /**
        * network layer
        * @type {object}
        */
              
        switch(mbTcpServerCfg.transportProtocol){
            case 0:
                this.netServer = new tcpServer(mbTcpServerCfg);
                break
            case 1:
                this.netServer = new udpServer(mbTcpServerCfg, 'udp4');
                break;
            case 'udp6':
                this.netServer = new udpServer(mbTcpServerCfg, 'udp6');
                break;
            default:
                this.netServer = new tcpServer(mbTcpServerCfg);
        }
      

        //Adding listeners to netServer events
        //function to call by net interface when data arrive.
        this.netServer.onData = (socket, dataFrame) => {
            /**
            * indication event.
            * @event ModbusnetServer#indication
            */
            this.emit('indication', socket, dataFrame);
        };

        this.netServer.onMessage = this.ReceiveIndicationMessage.bind(this);

        /**
        * @fires ModbusnetServer#connection
        */
        this.netServer.onConnectionAccepted = (socket) => {
            /**
           * connection event.
           * Emited when new connecton is sablished
           * @event ModbusnetServer#connection
           * @type {object}
           * @see https://nodejs.org/api/net.html
           */
            this.emit('connection',socket);
        };


        /**
        * Event connection closed
        * Emited when socket closed
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#connection-closed
        */
        this.netServer.onConnectionClose = (socket) => {
          /**
         * connection-closed event.
         * @event ModbusnetServer#connection-closed
         * @type {object}
         */
            this.emit('connection-closed', socket)
        };

      
        /**
        * Event listening
        * Emited when server is listening
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#listening
        */
        this.netServer.onListening  = () => {
          /**
         * listening event.
         * @event ModbusNetServer#listening
         * @type {number}
         */
          this.emit('listening',self.port);
        };

        /**
        * Event closed
        * Emited when server is closed
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#closed
        */
        this.netServer.onServerClose = () => {
            /**
            * closed event.
            * @event ModbusNetServer#closed
            */
            this.emit('closed');
        };

        /**
        * Event error
        * Emited when error hapen
        * @fires ModbusNetServer#error
        */
        this.netServer.onError = (err) =>{
          /**
         * error event.
         * @event ModbusNetServer#error
         */
          this.emit('error', err);
        };

        /**
        * Event response
        * Emited when response is send to master
        * @fires ModbusnetServer#response
        */
        this.netServer.onWrite = (ip_address, message_frame) => {
          /**
         * response event.
         * @event ModbusnetServer#response
         */
          this.emit('sended_response', ip_address, message_frame);
        
        };

        this.SendResponseMessage = this.netServer.Write.bind(this.netServer);

        this.on('transaction_acepted', function(transaction){
            //building Request Object
            let sock = self.netServer.GetSocket(transaction.connectionID);
            let req = new Transaction(sock, transaction.request);
            self.emit('request', req);
        });

        this.on('transaction_resolved', function(connection_id, mb_resp_adu){
          //building Request Object
          let sock = self.netServer.GetSocket(connection_id); 
          let resp = new Transaction(sock, mb_resp_adu);
          self.emit('response', resp);
        });
        
        //Sellando el netServer
        Object.defineProperty(self, 'netServer', {
          enumerable:false,
          writable:false,
          configurable:false
        })
            
    }
    
    /**
      * Getter listening status
      */
    get isListening(){
      return this.netServer.isListening;
    }

    get maxConnections(){
      return this.netServer.maxConnections;
    }

    set maxConnections(max){
      this.netServer.maxConnections = max;
    }
    
    get port(){
      return this.netServer.port
    }

    set port(newport){
      this.netServer.port = newport
    }

    /**
    * Function to start the server
    */
    Start(){
      
      this.netServer.Start();
    }

    /**
    * Function to stop the server
    */
    Stop(){
      
      this.netServer.Stop();
    }

        
}

module.exports = NodbusTcpServer;

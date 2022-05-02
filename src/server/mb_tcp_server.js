/**
* A ready to use modbus tcp server.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.14.0
*/

const ModbusServer = require('../protocol/modbus_server_tcp');
const tcpServer = require('./net/tcpserver');
const udpServer = require('./net/udpserver');
const Transaction = require('./utils/transaction_tcp');




/**
 * Class representing a modbus tcp server.
 * @extends ModbusServer
*/
class ModbusTCPServer extends ModbusServer {
  /**
  * Create a Modbus Tcp Server.
  * @param {object} config object.
  * 
  */
    constructor(mb_tcp_server_cfg){
      super(mb_tcp_server_cfg);
      var self = this;

      var transportProtocol = mb_tcp_server_cfg.transportProtocol || 'tcp';
      
     
      /**
      * network layer
      * @type {object}
      */
     switch(transportProtocol){

        case 'udp4':
          this.netServer = new udpServer(mb_tcp_server_cfg.net, 'udp4');
          break;
        case 'udp6':
          this.netServer = new udpServer(mb_tcp_server_cfg.net, 'udp6');
          break;
        default:
            this.netServer = new tcpServer(mb_tcp_server_cfg.net);
     }
      

      //Adding listeners to netServer events
      this.netServer.onData = function EmitData(socket, dataFrame){
          /**
          * indication event.
          * @event ModbusnetServer#indication
          */
          this.emit('indication', socket, dataFrame);
      }.bind(this);

      this.netServer.onMessage = this.ReceiveIndicationMessage.bind(this);

      /**
      * @fires ModbusnetServer#connection
      */
       this.netServer.onConnectionAccepted = function EmitConnection (socket) {
          /**
         * connection event.
         * Emited when new connecton is sablished
         * @event ModbusnetServer#connection
         * @type {object}
         * @see https://nodejs.org/api/net.html
         */
          this.emit('connection',socket);
      }.bind(this);


      /**
      * Event connection closed
      * Emited when socket closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusnetServer#connection-closed
      */
      this.netServer.onConnectionClose = function EmitConnectionClosed(socket){
        /**
       * connection-closed event.
       * @event ModbusnetServer#connection-closed
       * @type {object}
       */
          this.emit('connection-closed', socket)
      }.bind(this);

      
      /**
      * Event listening
      * Emited when server is listening
      * @see https://nodejs.org/api/net.html
      * @fires ModbusnetServer#listening
      */
      this.netServer.onListening  = function EmitListening(){
        /**
       * listening event.
       * @event ModbusNetServer#listening
       * @type {number}
       */
        this.emit('listening',self.port);
      }.bind(this);

      /**
      * Event closed
      * Emited when server is closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusnetServer#closed
      */
      this.netServer.onServerClose = function EmitClosed(){
        /**
       * closed event.
       * @event ModbusNetServer#closed
       */
        this.emit('closed');
      }.bind(this);

      /**
      * Event error
      * Emited when error hapen
      * @fires ModbusNetServer#error
      */
      this.netServer.onError = function EmitError(err){
        /**
       * error event.
       * @event ModbusNetServer#error
       */
        this.emit('error', err);
      }.bind(this);

      /**
      * Event response
      * Emited when response is send to master
      * @fires ModbusnetServer#response
      */
      this.netServer.onWrite = function EmitWriteMessage(ip_address, message_frame){
        /**
       * response event.
       * @event ModbusnetServer#response
       */
        this.emit('mb_response', ip_address, message_frame);
       
      }.bind(this);

      this.SendResponseMessage = this.netServer.Write;

      this.on('transaction_acepted', function(transaction){
          //building Request Object
          let sock = self.netServer.GetSocket(transaction.connectionID);
          let req = new Transaction(sock, transaction.request);
          self.emit('request', req);
      });

      this.on('transaction_resolved', function(connection_id, mb_resp_adu){
        //building Request Object
        let sock = self.netServer.GetSocket(connection_id);
        let resp = new Request(sock, mb_resp_adu);
        self.emit('response', resp);
      });
            
      /**
      * max client
      * @type {number}
      * @public
      */         
      this.maxConnections = 12;

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
      this.StartServer();
      this.netServer.Start();
    }

    /**
    * Function to stop the server
    */
    Stop(){
      this.StopServer();
      this.netServer.Stop();
    }

        
}

module.exports = ModbusTCPServer;

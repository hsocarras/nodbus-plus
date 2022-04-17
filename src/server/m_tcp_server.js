/**
* Modbus Tcp server module.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_server_tcp');
const tcpServer = require('./net/tcpserver');
const udpServer = require('./net/udpserver');
const Request = require('../common/request');
const Response = require('../common/response');



/**
 * Class representing a modbus tcp server.
 * @extends ModbusSlave
*/
class ModbusTCPServer extends ModbusSlave {
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

      this.netServer.onMessage = this.ProcessModbusIndication.bind(this);

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
      this.netServer.onWrite = function EmitResponse(resp){
        /**
       * response event.
       * @event ModbusnetServer#response
       */
        this.emit('response', resp);
        this.resCounter++;
      }.bind(this);

            
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

      this.acceptedCallback = function(message){

        this.emit('message', message);
        let request = this.BuildRequestObject(message);
      }
      
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

    /**
    * Function to execute when data are receive
    * @param {Buffer} dataFrame frame received by server
    * @return {bool} true if success;
    * @fires ModbusnetServer#indication {Buffer}
    */
    ProcessModbusIndication(connectionID, message){
        var self = this;
        
        this.CheckModbusADU(connectionID, message);
        
        
            
           
            self.emit('request', socket, req);

           
            //creating Response
            let respADU = self.CreateRespTcpADU(req.adu);                    
            if(respADU != null){
                var resp = new Response('tcp');
                resp.connectionID = connectionID;
                resp.adu = respADU;
                resp.id = req.id;
                resp.adu.MakeBuffer();
                resp.timeStamp = Date.now();                
                self.resCounter++;                  
                self.netServer.Write(connectionID, resp); 
                return true;
            }
            else {
                return false;
            }         
         
    }

    /**
    * Function to build the request object from a valid modbus message
    * @param {Buffer} message frame received by server    
    * @emit request
    */
    BuildRequestObject(message){

        //building Request Object
        let req = new Request('tcp');
        req.adu.aduBuffer = message;
        req.slaveID = 255;
        req.id = req.adu.mbapHeader.transactionID;


    }

    
}

module.exports = ModbusTCPServer;

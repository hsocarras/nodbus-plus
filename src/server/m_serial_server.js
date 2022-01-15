/**
* Modbus Serial encapsulated on Tcp server module.
* @module server/m_stcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
const tcpServer = require('./net/tcpserver');
const udpServer = require('./net/udpserver');
const Request = require('../common/request');
const Response = require('../common/response');


/**
 * Class representing a modbus serial over tcp server.
 * @extends ModbusSlave
*/
class ModbusSerialServer extends ModbusSlave {
  /**
  * Create a Modbus Tcp Server.
  * @param {number} p Port to listen.
  * @param {string} tp. Transport layer. Can be tcp, udp4 or udp6
  * @param {number} modbusAddress. address based on modbus protocol
  * @param {string} mode mode of work. 'rtu' frame rtu only, 'ascii' frame ascii only, 'auto' (default) both mode
  */
    constructor(p = 502, tp='tcp', modbusAddress = 1, mode = 'rtu'){
      super(modbusAddress);

      var self = this;

      var transportProtocol
      if(typeof tp == 'string'){
        transportProtocol = tp
      }
      else{
        throw new TypeError('transport protocol should be a string')
      }

      /**
      * network layer
      * @type {object}
      */
      switch(transportProtocol){
        case 'udp4':
          this.netServer = new udpServer(p, 'udp4');
          break;
        case 'udp6':
          this.netServer = new udpServer(p, 'udp6');
          break;
        default:
            this.netServer = new tcpServer(p);
      }
      
      //Adding listeners to netServer events

      this.netServer.onData = this.ProcessModbusIndication.bind(this);

      /**
      * @fires ModbusnetServer#connection
      */
       this.netServer.onConnection = function EmitConnection (socket) {
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
      this.netServer.onListening  = function EmitListening(port){
        /**
       * listening event.
       * @event ModbusnetServer#listening
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
       * @event ModbusnetServer#closed
       */
        this.emit('closed');
      }.bind(this);

      /**
      * Event error
      * Emited when error hapen
      * @fires ModbusnetServer#error
      */
      this.netServer.onError = function EmitError(err){
        /**
       * error event.
       * @event ModbusnetServer#error
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
      * Event client disconnect
      * Emited when client send fin packet
      * @fires ModbusnetServer#client-disconnect
      */
      this.netServer.onClientEnd = function EmitClientDisconnect(socket){
        /**
       * client-disconnect event.
       * @event ModbusnetServer#client-disconnect
       */
        this.emit('client-disconnect',socket);
      }       

      /**
      * mode
      * @type {string}
      */
      this.mode = mode;

      /**
       * current req 
       * If another req arrive while the current req is not null, exepction 5 should be sended
       * @type {Array}
       */
      this.currentRequest = null;  

      //Sellando el netServer
      Object.defineProperty(self, 'netServer', {
        enumerable:false,
        writable:false,
        configurable:false
      })
      
    }

    get maxConnections(){
      return this.netServer.maxConnections;
    }

    set maxConnections(max){
      this.netServer.maxConnections = 1;
    }

    /**
      * Getter listening status
      */
     get isListening(){
      return this.netServer.isListening;
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
    * Function to execute when data are recive
    * @param {Buffer} aduBuffer frame received by server
    * @return {Buffer} response;
    * @fires ModbusnetServer#indication {Buffer}
    */
    ProcessModbusIndication(connectionID, dataFrame){

      var self = this;
      let socket = this.netServer.activeConnections[connectionID];

      /**
     * indication event.
     * @event ModbusnetServer#indication
     */
      this.emit('indication', socket, dataFrame);

      let req = new Request(self.mode);
      req.adu.aduBuffer = dataFrame;
      req.slaveID = self.address;

      let reqADUParsedOk =  req.adu.ParseBuffer();
      if(reqADUParsedOk){

          //add req to request stack
          self.reqCounter++;
          req.id = self.reqCounter;
          self.emit('request', socket, req);

          //creating Response 
          var resp = new Response(self.mode);
          if(this.currentRequest == null){

              let respADU = self.CreateRespSerialADU(req.adu);
              if(respADU != null){
                  
                  resp.connectionID = connectionID;

                  self.currentRequest = req;
                  resp.adu = self.CreateRespSerialADU(req.adu);
                  resp.id = self.resCounter;
                  resp.adu.MakeBuffer();
                  resp.timeStamp = Date.now();
                  resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
                  self.resCounter++;
                  //removing req from req stak
                  self.currentRequest = null;
                  self.netServer.Write(connectionID, resp);
              }
          }
          else{
              //response modbus exeption 6 slave Busy
              resp.adu.pdu = self.MakeModbusException(req.adu.pdu, 6);              
              resp.adu.MakeBuffer();
              resp.timeStamp = Date.now();
              resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
              self.resCounter++
              self.netServer.Write(connectionID, resp); 
          }
            return true;
      }
      else {
          return false;
      }
        
    }
    
}

module.exports = ModbusSerialServer;

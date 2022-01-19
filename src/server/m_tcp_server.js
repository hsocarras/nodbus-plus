/**
* Modbus Tcp server module.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
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
  * @param {number} p Port to listen.
  * @param {string} tp. Transport layer. Can be tcp, udp4 or udp6
  */
    constructor(p=502, tp = 'tcp', modbusAddress = 1){
      super(modbusAddress);

      var transportProtocol
      if(typeof tp == 'string'){
        transportProtocol = tp
      }
      else{
        throw new TypeError('transport protocol should be a string', 'm_tcp_server.js', '34');
      }

      var self = this;

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
      * Event client disconnect
      * Emited when client send fin packet
      * @fires ModbusNetServer#client-disconnect
      */
      this.netServer.onClientEnd = function EmitClientDisconnect(socket){
        /**
       * client-disconnect event.
       * @event ModbusnetServer#client-disconnect
       */
        this.emit('client-disconnect',socket);
      }
      
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
    * @param {Buffer} dataFrame frame received by server
    * @return {bool} true if success;
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
      let indicationStack = self.SplitTCPFrame(dataFrame)

      indicationStack.forEach(function(element, index, array){
        let req = new Request('tcp');
        req.adu.aduBuffer = element;
        req.slaveID = self.address;

        
        let reqADUParsedOk =  req.adu.ParseBuffer();
        if(reqADUParsedOk){
            
            req.id = req.adu.mbapHeader.transactionID;
            self.emit('request', socket, req);

            //add reqest counter
            self.reqCounter++;

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
        else{
          self.emit('modbus_exeption','Error parsing request');
          return false;
        }
                         
      })    
    }

    
}

module.exports = ModbusTCPServer;

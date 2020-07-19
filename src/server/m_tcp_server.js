/**
* Modbus Tcp server module.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
const TcpServer = require('../net/tcpserver');
const Request = require('../protocol/request');
const Response = require('../protocol/response');
const ADU = require('../protocol/tcp_adu');


/**
 * Class representing a modbus tcp server.
 * @extends ModbusSlave
*/
class ModbusTCPServer extends ModbusSlave {
  /**
  * Create a Modbus Tcp Server.
  * @param {number} p Port to listen.
  */
    constructor(p=502){
      super();

      var self = this;

      /**
      * network layer
      * @type {object}
      */
      this.tcpServer = new TcpServer(p);

      //Adding listeners to tcpServer events
      this.tcpServer.onData = this.ProcessModbusIndication.bind(this);

      /**
      * @fires ModbusTCPServer#connection
      */
       this.tcpServer.onConnection = function EmitConnection (socket) {
          /**
         * connection event.
         * Emited when new connecton is sablished
         * @event ModbusTCPServer#connection
         * @type {object}
         * @see https://nodejs.org/api/net.html
         */
          this.emit('connection',socket);
      }.bind(this);


      /**
      * Event connection closed
      * Emited when socket closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#connection-closed
      */
      this.tcpServer.onConnectionClose = function EmitConnectionClosed(socket){
        /**
       * connection-closed event.
       * @event ModbusTCPServer#connection-closed
       * @type {object}
       */
          this.emit('connection-closed', socket)
      }.bind(this);

      
      /**
      * Event listening
      * Emited when server is listening
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#listening
      */
      this.tcpServer.onListening  = function EmitListening(){
        /**
       * listening event.
       * @event ModbusTCPServer#listening
       * @type {number}
       */
        this.emit('listening',self.port);
      }.bind(this);

      /**
      * Event closed
      * Emited when server is closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#closed
      */
      this.tcpServer.onServerClose = function EmitClosed(){
        /**
       * closed event.
       * @event ModbusTCPServer#closed
       */
        this.emit('closed');
      }.bind(this);

      /**
      * Event error
      * Emited when error hapen
      * @fires ModbusTCPServer#error
      */
      this.tcpServer.onError = function EmitError(err){
        /**
       * error event.
       * @event ModbusTCPServer#error
       */
        this.emit('error', err);
      }.bind(this);

      /**
      * Event response
      * Emited when response is send to master
      * @fires ModbusTCPServer#response
      */
      this.tcpServer.onWrite = function EmitResponse(resp){
        /**
       * response event.
       * @event ModbusTCPServer#response
       */
        this.emit('response', resp);
      }.bind(this);

      /**
      * Event client disconnect
      * Emited when client send fin packet
      * @fires ModbusTCPServer#client-disconnect
      */
      this.tcpServer.onClientEnd = function EmitClientDisconnect(socket){
        /**
       * client-disconnect event.
       * @event ModbusTCPServer#client-disconnect
       */
        this.emit('client-disconnect',socket);
      }

      /**
      * port
      * @type {number}
      * @public
      */
      Object.defineProperty(self, 'port', {
        get : function(){
          return self.tcpServer.port;
        },
        set : function(p){
          self.tcpServer.port = p;
        }
      })
      this.port = p;

      /**
      * listening status
      * @type {bool}
      * @public
      */
      Object.defineProperty(self, 'isListening',{
        get: function(){
          return self.tcpServer.isListening;
        }
      })

      /**
      * max client
      * @type {number}
      * @public
      */
      Object.defineProperty(self, 'maxConnections',{
        get: function(){
          return self.tcpServer.maxConnections;
        },
        set: function(max){
          self.tcpServer.maxConnections = max;
        }
      })     

      //Sellando el tcpServer
      Object.defineProperty(self, 'tcpServer', {
        enumerable:false,
        writable:false,
        configurable:false
      })
      
    }

    /**
    * Function to start the server
    */
    Start(){
      this.tcpServer.Start();
    }

    /**
    * Function to stop the server
    */
    Stop(){
      this.tcpServer.Stop();
    }

    /**
    * Function to execute when data are recive
    * @param {Buffer} dataFrame frame received by server
    * @return {Buffer} response;
    * @fires ModbusTCPServer#indication {Buffer}
    */
    ProcessModbusIndication(socketIndex, dataFrame){
      var self = this;
      let socket = this.tcpServer.activeConections[socketIndex];
      

      /**
     * indication event.
     * @event ModbusTCPServer#indication
     */
      this.emit('indication', socket, dataFrame);
      let indicationStack = self.SplitTCPFrame(dataFrame)

      indicationStack.forEach(function(element, index, array){
        let req = new Request('tcp');
        req.adu.aduBuffer = element;

        try {
          req.adu.ParseBuffer();
          self.emit('request', socket, req);

          if(self.AnalizeADU(req.adu)){
            return
          }
          else{
            //creando la respuesta
            let resp = new Response('tcp');
            resp.deviceId = socketIndex;
            resp.adu.pdu = self.BuildResponse(req.adu.pdu);

            if(req.address == 0){
              //broadcast no response
              return
            }
            else{
              //response
              if(resp.adu.pdu != null){
                
                resp.adu.address = req.adu.mbap.unitID;
                resp.adu.transactionCounter = req.adu.mbap.transactionID;                
                resp.adu.MakeBuffer();
                resp.timeStamp = Date.now();
                resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);

                self.tcpServer.Write(socketIndex, resp)
              }
            }
          }
        }
        catch(e){
          self.emit('error', e)
        }
      })    
    }

    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusTCPServer#error {object}
    */
    AnalizeADU(adu){
              
        if (adu.mbap.protocolID != 0){
            //si el protocolo no es modbus standard
            this.emit('modbus_exeption','Protocol not Suported');
            return 1;
        }
        else if (adu.mbap.length != adu.aduBuffer.length-6){
            //Verificando el campo length
            this.emit('modbus_exeption','ByteCount error');
            return 1;
        }
        else{
          return 0;
        }
      
    }

    
}

module.exports = ModbusTCPServer;

/**
* Modbus Serial encapsulated on Tcp server module.
* @module server/m_stcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
const tcpServer = require('../net/tcpserver');
const udpServer = require('../net/udpserver');
const Request = require('../protocol/request');
const Response = require('../protocol/response');
const ASCII_ADU = require('../protocol/ascii_adu');

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
  * @param {string} mode mode of work. 'rtu' frame rtu only, 'ascii' frame ascii only, 'aut' (default) both mode
  */
    constructor(p = 502, tp='tcp', modbusAddress = 1, mode = 'aut'){
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
      * port
      * @type {number}
      * @public
      */
      Object.defineProperty(ModbusSerialServer.prototype, 'port', {
        get : function(){
          return self.netServer.port;
        },
        set : function(p){
          self.netServer.port = p;
        }
      })
      this.port = p;
              

      /**
      * mode
      * @type {string}
      */
      this.mode = mode;

      /**
       * current req stack or input buffer
       * If exeded his max length exepction 5 should be sended
       * @type {Array}
       */
      this.reqStack = [];
      
      /**
       * current req stack max length
       * @type {Map}
       */
      this.maxRequests = 16;

      /**
      * listening status
      * @type {bool}
      * @public
      */
      Object.defineProperty(ModbusSerialServer.prototype, 'isListening',{
        get: function(){
          return this.netServer.isListening;
        }
      })

      /**
      * max client
      * @type {number}
      * @public
      */
      Object.defineProperty(ModbusSerialServer.prototype, 'maxConnections',{
        get: function(){
          return this.netServer.maxConnections;
        },
        set: function(max){
          this.netServer.maxConnections = max;
        }
      })

      //Sellando el netServer
      Object.defineProperty(self, 'netServer', {
        enumerable:false,
        writable:false,
        configurable:false
      })
      
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

      let req;

      if(this.mode == 'auto'){        
          (ASCII_ADU.isAsciiAdu(dataFrame)) ? req = new Request('ascii') : req = new Request('rtu');;
      }
      else{
        req = new Request(self.mode);
      }

      req.adu.aduBuffer = dataFrame;
      req.slaveID = self.address;

      try{
        req.adu.ParseBuffer();
      }
      catch(e){
        if(typeof e == 'string') {
          this.emit('modbus_exception', req.slaveID, "CHEKSUM ERROR");
        }
        else{
          self.emit('error', e);
        }
        return
      }
      
      

        //checking adu
        if (this.AnalizeADU(req.adu)){
                     
            return;
        }
        else{          
            //add req to request stack
            self.reqCounter++;     
            
            req.id = self.reqCounter;
            self.emit('request', socket, req);

            //creando la respuesta
            let resp = new Response(req.type);
            resp.connectionID = connectionID;
            resp.adu.address = self.address;

            if(this.reqStack.length < self.maxRequests){
              //if requestStack is not full

              self.reqStack.push(req);             

              try{
                
                resp.adu.pdu = self.BuildResponse(req.adu.pdu);                
                
                //response
                if(resp.adu.pdu != null){                  
                                  
                  resp.adu.MakeBuffer();                  
                  
                }
                
              }
              catch(e){
                //slave failure exeption
                self.emit('error', e)
                resp.adu.pdu = self.CreatePDU();
                resp.adu.pdu.modbus_function = req.adu.pdu.modbus_function | 0x80;
                resp.adu.pdu.modbus_data[0] = 4;
                resp.adu.MakeBuffer();
              }
              finally{
                if(req.address != 0){
                  resp.timeStamp = Date.now();
                  resp.id = self.resCounter;
                  resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
                  self.resCounter++; 
                  //removing req from req stak
                  self.reqStack.splice(self.reqStack.indexOf(req), 1);
                  self.netServer.Write(connectionID, resp); 
                   
                }
              }
            }
            else{
              //response modbus exeption 6 slave Busy
              resp.adu.pdu = this.CreatePDU();
              resp.adu.pdu.modbus_function = req.adu.pdu.modbus_function | 0x80
              resp.adu.pdu.modbus_data[0] = 6;
              resp.adu.MakeBuffer();
              resp.timeStamp = Date.now();
              resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
              self.netServer.Write(connectionID, resp); 
            }

        }
    }


    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusnetServer#error {object}
    */
    AnalizeADU(adu){
        
        if (adu.address == this.address){
            //address ok
            return 0;
        }
        else{
          //address mistmatch
          return 1;
        }
      
    }
}

module.exports = ModbusSerialServer;

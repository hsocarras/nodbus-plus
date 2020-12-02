/**
* Modbus Tcp server module.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('./modbus_slave');
const tcpServer = require('../net/tcpserver');
const udpServer = require('../net/udpserver');
const Request = require('../protocol/request');
const Response = require('../protocol/response');



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
        throw new TypeError('transport protocol should be a string')
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
      let indicationStack = self.SplitTCPFrame(dataFrame)

      indicationStack.forEach(function(element, index, array){
        let req = new Request('tcp');
        req.adu.aduBuffer = element;
        req.slaveID = self.address;

        try {
          req.adu.ParseBuffer();
        }
        catch(e){
          self.emit('error', e);
          return
        }

        req.id = req.adu.mbap.transactionID;
        self.emit('request', socket, req);

          if(self.AnalizeADU(req.adu)){
            return
          }
          else{

            //add reqest counter
            self.reqCounter++;

            //creando la respuesta
            let resp = new Response('tcp');
            resp.connectionID = connectionID;
            resp.adu.address = req.adu.mbap.unitID;
            resp.adu.transactionCounter = req.adu.mbap.transactionID;
            resp.id = req.id;

            try{
              resp.adu.pdu = self.BuildResponse(req.adu.pdu);              
            }
            catch(e){
               //slave failure exeption
               self.emit('error', e)
               resp.adu.pdu = self.CreatePDU();
               resp.adu.pdu.modbus_function = req.adu.pdu.modbus_function | 0x80;
               resp.adu.pdu.modbus_data[0] = 4;
               resp.adu.MakeBuffer();
               this.emit('modbus_exception', 'Slave Device Failure');
            }
            finally{
              if(resp.adu.pdu != null){
                resp.adu.MakeBuffer();
                if(req.address != 0){
                  resp.timeStamp = Date.now();
                  resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
                  self.resCounter++;
                  
                  self.netServer.Write(connectionID, resp); 
                    
                }
              }
            }
          }               
      })    
    }

    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusnetServer#error {object}
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

    /**
     * Split the input buffer in several indication buffer baset on length property
     * of modbus tcp header. The goal of this funcion is suport several modbus indication
     * on same tcp frame
     * @param {Buffer Object} dataFrame 
     * @return {Buffer array}
     */
    SplitTCPFrame(dataFrame){
      //get de first tcp header length
      let indicationsList = [];
      let expectedlength = dataFrame.readUInt16BE(4);
      let indication = Buffer.alloc(expectedlength + 6);

      if(dataFrame.length <= expectedlength + 6){
        dataFrame.copy(indication,  0, 0, expectedlength + 6);
        indicationsList.push(indication);
        return indicationsList;
      }
      else{
        dataFrame.copy(indication,  0, 0, expectedlength + 6);
        indicationsList.push(indication);
        let otherIndication = dataFrame.slice(expectedlength + 6);
        let other = this.SplitTCPFrame(otherIndication);
        indicationsList = indicationsList.concat(other)
        return indicationsList;
      }      
    }

    
}

module.exports = ModbusTCPServer;

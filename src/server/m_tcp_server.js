/**
** Modbus Tcp server module.
* @module server/m_tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
const TcpServer = require('../net/tcpserver');
const ADU = require('../protocol/tcp_adu');
const MBAP = require('../protocol/mbap');

/**
 * Class representing a modbus tcp server.
 * @extends ModbusSlave
*/
class ModbusTCPServer extends ModbusSlave {
  /**
  * Create a Modbus Tcp Server.
  */
    constructor(){
      super();

      var self = this;

      /**
      * network layer
      * @type {object}
      */
      this.tcpServer = new TcpServer();

      //Adding listeners to tcpServer events

      this.tcpServer.onData = this.ProcessModbusIndication.bind(this);

      /**
      * Event connection
      * Emited when new connecton is sablished
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#connection
      */
      this.tcpServer.onConnection = function EmitConnection (socket) {
        this.emit('connection',socket);
      }.bind(this);

      /**
      * Event connection closed
      * Emited when socket closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#connection-closed
      */
      this.tcpServer.onConnectionClose = function EmitConnectionClosed(socket){
          this.emit('connection-closed', socket)
      }.bind(this);

      /**
      * Event access denied
      * Emited when new connecton is rejected by filter rules
      * @fires ModbusTCPServer#access-denied
      */
      this.tcpServer.onAccessDenied = function EmitAccesDenied(socket){
        this.emit('access-denied', socket);
      }.bind(this);

      /**
      * Event listening
      * Emited when server is listening
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#listening
      */
      this.tcpServer.onListening  = function EmitListening(port){
        this.emit('listening',self.port);
      }.bind(this);

      /**
      * Event closed
      * Emited when server is closed
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#closed
      */
      this.tcpServer.onServerClose = function EmitClosed(){
        this.emit('closed');
      }.bind(this);

      /**
      * Event error
      * Emited when error hapen
      * @fires ModbusTCPServer#error
      */
      this.tcpServer.onError = function EmitError(err){
        this.emit('error', err);
      }.bind(this);

      /**
      * Event response
      * Emited when response is send to master
      * @fires ModbusTCPServer#response
      */
      this.tcpServer.onWrite = function EmitResponse(resp){
        this.emit('response', resp);
      }.bind(this);

      /**
      * Event client disconnect
      * Emited when client send fin packet
      * @fires ModbusTCPServer#client-disconnect
      */
      this.tcpServer.onClientEnd = function EmitClientDisconnect(socket){
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
      //Sellando la propiedad ProcessModbusIndication
      Object.defineProperty(self.__proto__, 'ProcessModbusIndication', {
        enumerable : true,
        configurable : false,
        writable : false
      })

      //Sellando la propiedad BuildMBAP
      Object.defineProperty(self.__proto__, 'BuildMBAP', {
        enumerable : false,
        configurable : false,
        writable : false
      })

      //Sellando la propiedad AnalizeADU
      Object.defineProperty(self.__proto__, 'AnalizeADU', {
        enumerable : false,
        configurable : false,
        writable : false
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
    * @param {Buffer} aduBuffer frame received by server
    * @return {Buffer} response;
    * @fires ModbusTCPServer#indication {Buffer}
    */
    ProcessModbusIndication(aduBuffer){

      //emitiendo un evento de recivo de indicacion
      this.emit('indication', aduBuffer);

      var indicationADU = new ADU(aduBuffer);

        //checking header
        if (this.AnalizeADU(indicationADU)){
            //Si retorna 1
            return Buffer.alloc(0);
        }
        else{
            //Header ok
            indicationADU.ParseBuffer();
            //creando la respuesta
            var responsePDU = this.BuildResponse(indicationADU.pdu);
            var responseMBAP = this.BuildMBAP(indicationADU.mbap,responsePDU);

            //response
            var modbusResponse = new ADU();
            modbusResponse.mbap = responseMBAP;
            modbusResponse.pdu = responsePDU;
            modbusResponse.MakeBuffer();

            return modbusResponse.aduBuffer;
        }
    }

    /**
    * Make the response modbus tcp header
    * @param {Object} indicationMBAP header of indication
    * @param {Object} responsePDU The response PDU object
    * @return {Object}
    */
    BuildMBAP(indicationMBAP,responsePDU){


      //Creando la cabecera de la respuesta a partir de la cabecera de la indication
      var responseMBAP = new MBAP (indicationMBAP.mbapBuffer);
      responseMBAP.ParseBuffer();

      //modificando el campo length
      responseMBAP.length = responsePDU.pduBuffer.length + 1;
      responseMBAP.MakeBuffer();

      return responseMBAP;
    }

    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    */
    AnalizeADU(adu){
      try{
        adu.ParseBuffer();

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
      catch(e){
        this.emit('modbus_exeption','Bytes error on Modbus Indication');
        return 1;
      }
    }
}

module.exports = ModbusTCPServer

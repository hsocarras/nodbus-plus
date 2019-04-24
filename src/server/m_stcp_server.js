/**
* Modbus Serial encapsulated on Tcp server module.
* @module server/m_stcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSlave = require('../protocol/modbus_slave');
const TcpServer = require('../net/tcpserver');
const RTU_ADU = require('../protocol/rtu_adu');
const ASCII_ADU = require('../protocol/ascii_adu');

/**
 * Class representing a modbus serial over tcp server.
 * @extends ModbusSlave
*/
class ModbusSTCPServer extends ModbusSlave {
  /**
  * Create a Modbus Tcp Server.
  * @param {number} p Port to listen.
  * @param {string} mode mode of work. 'rtu' frame rtu only, 'ascii' frame ascii only, 'aut' (default) both mode
  */
    constructor(p = 502, modbusAddress = 1, mode = 'aut'){
      super(modbusAddress = 1);

      var self = this;

      /**
      * network layer
      * @type {object}
      */
      this.tcpServer = new TcpServer();

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
      * Event access denied
      * Emited when new connecton is rejected by filter rules
      * @fires ModbusTCPServer#access-denied
      */
      this.tcpServer.onAccessDenied = function EmitAccesDenied(socket){
        /**
       * access-denied event.
       * @event ModbusTCPServer#access-denied
       * @type {object}
       */
        this.emit('access-denied', socket);
      }.bind(this);

      /**
      * Event listening
      * Emited when server is listening
      * @see https://nodejs.org/api/net.html
      * @fires ModbusTCPServer#listening
      */
      this.tcpServer.onListening  = function EmitListening(port){
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
      * mode
      * @type {string}
      */
      this.mode = mode;

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

      /**
     * indication event.
     * @event ModbusTCPServer#indication
     */
      this.emit('indication', aduBuffer);

      let ADU;
      var indicationADU;

      switch (this.mode){
        case 'rtu':
          ADU =  RTU_ADU;
          break;
        case 'ascii':
          ADU = ASCII_ADU;
          break;
        case 'aut':
          (ASCII_ADU.isAsciiAdu(aduBuffer)) ? ADU = ASCII_ADU : ADU =  RTU_ADU;
      }

      indicationADU = new ADU(aduBuffer);


        //checking adu
        if (this.AnalizeADU(indicationADU)){
            //Si retorna 1
            return Buffer.alloc(0);
        }
        else{
            //adu ok
            indicationADU.ParseBuffer();
            //creando la respuesta
            var responsePDU = this.BuildResponse(indicationADU.pdu);

            if(indicationADU.address == 0){
              //broadcast no response
              return Buffer.alloc(0);
            }
            else{
              //response
              var modbusResponse = new ADU();
              modbusResponse.address = this.modbusAddress;
              modbusResponse.pdu = responsePDU;
              modbusResponse.MakeBuffer();

              return modbusResponse.aduBuffer;
            }

        }
    }


    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusTCPServer#error {object}
    */
    AnalizeADU(adu){
      try{
        adu.ParseBuffer();

        if ((adu.address != this.modbusAddress & adu.address != 0) | adu.address > 247){
            //ignore the frame if address missmatch
            return 1;
        }
        else{
          return 0;
        }
      }
      catch(e){
        this.emit('error', e);
        return 1;
      }
    }
}

module.exports = ModbusSTCPServer;

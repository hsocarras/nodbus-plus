/**
*@author Hector E. Socarras Cabrera
*
*
*/

const ModbusServer = require('../protocol/modbus_server');
const TcpServer = require('../net/tcpserver');
const ADU = require('../protocol/tcp_adu');
const MBAP = require('../protocol/mbap');

module.exports = class ModbusTCPServer extends ModbusServer {
    constructor(){
      super();

      var self = this;

      // network layer
      this.tcpServer = new TcpServer();

      function ProcessModbusIndication(aduBuffer){
        /**
        *@brief Esta es la funcion que se ejecuta cuando se resiven datos en la conexion
        *@param Esta funcion recive el stream del socket, que es la aplication data unit del protocolo modbus.
        *@return return Buffer con la respuesta.
        */

        //emitiendo un evento de recivo de indicacion
        this.emit('indication', aduBuffer);

        //mbap from modbus indication
        if(aduBuffer.length > 7){
            var indicationADU = new ADU(aduBuffer);
            indicationADU.ParseBuffer();

            //Analizando la cabecera
            if (indicationADU.mbap.protocolID != 0){
                //si el protocolo no es modbus standard
                this.emit('modbus_exeption','Protocol not Suported');
                return -1;
            }
            else if (indicationADU.mbap.length != aduBuffer.length-6){
                //Verificando el campo length
                this.emit('modbus_exeption','ByteCount error');
                return -1;
            }
            else{
                //cabecera correcta

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
        else {
            this.emit('modbus_exeption','Bytes error on Modbus Indication');
            return -1;
        }

      }

      //Core de modbus server
      this.tcpServer.onData = ProcessModbusIndication.bind(this);

      //Event connection
      this.tcpServer.onConnection = function EmitConnection (socket) {
        this.emit('connection',socket);
      }.bind(this);

      //Evento connection_closed
      this.tcpServer.onConnectionClose = function EmitClientDisconnect(socket){
          this.emit('client-disconnect', socket)
      }.bind(this);

      //Evento listenning
      this.tcpServer.onListening  = function EmitListening(port){
        this.emit('listening',port);
      }.bind(this);

      //Evento Closed
      this.tcpServer.onServerClose = function EmitClosed(){
        this.emit('closed');
      }.bind(this);

      //Evento conection error
      this.tcpServer.onError = function EmitConnectionError(){
        this.emit('connection-error');
      }.bind(this);

      //Evento Response
      this.tcpServer.onWrite = function EmitResponse(resp){
        this.emit('response', resp);
      }.bind(this);

      //Evento access_denied
      this.tcpServer.onAccessDenied = function(socket){
        his.emit('access-denied',socket);
      }.bind(this);

      //Sellando el server tcp onData
      Object.defineProperty(this.tcpServer, 'onData', {
        enumerable:false,
        writable:false,
        configurable:false
      })

      //Sellando el tcpServer
      Object.defineProperty(modbusTcpServer, 'tcpServer', {
        enumerable:false,
        writable:false,
        configurable:false
      })

      //Sellando la propiedad BuildMBAP
      Object.defineProperty(modbusTcpServer.__proto__, 'BuildMBAP', {
        enumerable : false,
        configurable : false,
        writable : false
      })
    }

    Start(){
      this.tcpServer.Start();
    }

    Stop(){
      this.tcpServer.Stop();
    }

    BuildMBAP(indicationMBAP,responsePDU){
      /**
      *@brief function q genera la cabecera de la respuesta.
      *@param indicationMBAP cabecera de la modbis indication
      *@param responsePDU protocol data unit de la respuesta para calcular el campo length de la cabecera de la respuesta.
      *@return objeto mbap de la respuesta del servidor
      */

      //Creando la cabecera de la respuesta a partir de la cabecera de la indication
      var responseMBAP = new MBAP (indicationMBAP.mbapBuffer);
      responseMBAP.ParseBuffer();

      //modificando el campo length
      responseMBAP.length = responsePDU.pduBuffer.length + 1;
      responseMBAP.MakeBuffer();

      return responseMBAP;
    }


}

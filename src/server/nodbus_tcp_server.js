/**
* A fully functional Modbus Tcp protocol server.
* @module server/mb_tcp_server.
* @author Hector E. Socarras.
* @version 1.0.0
*/

const ModbusTcpServer = require('../protocol/modbus_server_tcp');
const TcpServer = require('./net/tcpserver');
const UdpServer = require('./net/udpserver');

//Default Server's Configuration object
const defaultCfg = {
  inputs : 2048,
  coils : 2048,
  holdingRegisters : 2048,
  inputRegisters : 2048,  
  port : 502,
  maxConnections : 32
}

/**
 * Class representing a modbus tcp server fully functionl.
 * @extends ModbusTcpServer
*/
class NodbusTcpServer extends ModbusTcpServer {
    /**
    * Create a Modbus Tcp Server.
    * @param {number} netType : 0,  //0 - tcp, 1- udp4, 2 - udp6
    * @param {object} config object.
    * 
    */
    constructor(netType = 0, mbTcpServerCfg = defaultCfg){
        super(mbTcpServerCfg);
        let self = this;

        //arguments check        
        if(mbTcpServerCfg.port == undefined){ mbTcpServerCfg.port = defaultCfg.port}
        if(mbTcpServerCfg.maxConnections == undefined){ mbTcpServerCfg.maxConnections = defaultCfg.maxConnections}
      
        /**
        * network layer
        * @type {object}
        */
        this.net = createNetObject(netType, mbTcpServerCfg);     
        
        //Adding listeners to netServer events
        //function to call by net interface when data arrive.
        this.net.onDataHook = (socket, dataFrame) => {
            /**
            * indication event.
            * @event ModbusnetServer#indication
            */
            this.emit('data', socket, dataFrame);
        };

        this.net.onMbAduHook = (sock, adu) =>{

            //Checking PDU Modbus Tcp Implementation Guide Figure 16
            let header = adu.subarray(0, 7);
            if(this.validateMbapHeader(header)){
                let pdu = adu.subarray(7);
                let req = {};

                req.timeStamp = Date.now();
                req.transactionId = header.readUint16BE(0);
                req.unitId = header[6];
                req.functionCode = pdu[0];
                req.data = pdu.subarray(1);

                this.emit('request', sock, req);

                let resAdu = this.getResponseAdu(adu)
                this.net.write(sock, resAdu)
            }
            else return
            
        };

        /**
        * @fires ModbusnetServer#connection
        */
        this.net.onConnectionAcceptedHook = (socket) => {
            /**
           * connection event.
           * Emited when new connecton is sablished
           * @event ModbusnetServer#connection
           * @type {object}
           * @see https://nodejs.org/api/net.html
           */
            this.emit('connection',socket);
        };


        /**
        * Event connection closed
        * Emited when socket closed
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#connection-closed
        */
        this.net.onConnectionCloseHook = (socket) => {
          /**
         * connection-closed event.
         * @event ModbusnetServer#connection-closed
         * @type {object}
         */
            this.emit('connection-closed', socket)
        };

      
        /**
        * Event listening
        * Emited when server is listening
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#listening
        */
        this.net.onListeningHook  = () => {
          /**
         * listening event.
         * @event ModbusNetServer#listening
         * @type {number}
         */
          this.emit('listening',self.port);
        };

        /**
        * Event closed
        * Emited when server is closed
        * @see https://nodejs.org/api/net.html
        * @fires ModbusnetServer#closed
        */
        this.net.onServerCloseHook = () => {
            /**
            * closed event.
            * @event ModbusNetServer#closed
            */
            this.emit('closed');
        };

        /**
        * Event error
        * Emited when error hapen
        * @fires ModbusNetServer#error
        */
        this.net.onErrorHook = (err) =>{
          /**
         * error event.
         * @event ModbusNetServer#error
         */
          this.emit('error', err);
        };

        /**
        * Event response
        * Emited when response is send to master
        * @fires ModbusnetServer#response
        */
        this.net.onWriteHook = (sock, resAdu) => {
          /**
         * response event.
         * @event ModbusnetServer#response
         */
          this.emit('write', sock, resAdu);
        
        };
        
        
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
        return this.net.isListening;
    }

    get maxConnections(){
        return this.net.maxConnections;
    }

    set maxConnections(max){
        this.net.maxConnections = max;
    }
    
    get port(){
        return this.net.port
    }

    set port(newport){
        this.net.port = newport
    }

    get activeConnections(){
        return this.net.activeConnections;
    }

    /**
    * Function to start the server
    */
    start(){
      
      this.net.start();
    }

    /**
    * Function to stop the server
    */
    stop(){
      
      this.net.stop();
    }

        
}

module.exports = NodbusTcpServer;

/**
 * 
 * @param {number} type: type of net object. 0 -tcp, 1-udp4, 2-udp6
 * @param {*} config: Configuration object. {port, maxNumberConection}  Acces control for future version
 * @returns 
 */
function createNetObject(type, config){
    
    switch(type){
      case 0:
          return new TcpServer(config);
          break
      case 1:
          return new UdpServer(config, 'udp4');
          break;
      case 2:
        return new UdpServer(config, 'udp6');
          break;
      default:
          return new TcpServer(config);
    }
}
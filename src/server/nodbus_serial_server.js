/**
* Modbus Serial encapsulated on Tcp server module.
* @module server/m_stcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSerialServer = require('../protocol/modbus_server_serial');
const SerialServer = require('./net/serialserver');


//Default Server's Configuration object
const defaultCfg = {
    transmitionMode : 0, //transmition mode 0-auto, 1-rtu, 2-ascii
    address : 1,
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048,  
    maxConnections : 32,
    udpType : 'udp4',    
}


/**
 * Class representing a modbus serial server fully functional.
 * @extends ModbusSerialServer
*/
class NodbusSerialServer extends ModbusSerialServer {
  /**
    * Create a Modbus Tcp Server.    
    * @param {object} config object.
    * @param {number} netClass: Constructor for network object
    * 
    */
    constructor(mbTcpServerCfg = defaultCfg, netClass = SerialServer){
        super(mbTcpServerCfg);

        var self = this;

        //arguments check        
        mbTcpServerCfg.tcpCoalescingDetection = false;
        if(mbTcpServerCfg.maxConnections == undefined){ mbTcpServerCfg.maxConnections = defaultCfg.maxConnections}      
        if(mbTcpServerCfg.udpType != 'udp4' & mbTcpServerCfg.udpType != 'udp6'){ mbTcpServerCfg.udpType = defaultCfg.udpType}

        /**
         * network layer
         * @type {object}
         */
        try {
            this.net = new netClass(mbTcpServerCfg);
        }
        catch(e){
            this.emit('error', e);
            this.net = new TcpServer(mbTcpServerCfg);
        }

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
          
            let pdu = this.getPdu;
            let req = {};

            req.timeStamp = Date.now();
            req.address = this.getAddress(adu)
            req.checkSum = this.getChecksum(adu);
            req.functionCode = pdu[0];
            req.data = pdu.subarray(1);

            this.emit('request', sock, req);

            let resAdu;
            if(req.address == 0){
                this.executeBroadcastReq(adu);
            }
            else{
                resAdu = this.getResponseAdu(adu);
                let res = {};

                res.timeStamp = Date.now();
                res.transactionId = resAdu.readUint16BE(0);
                req.unitId = resAdu[6];
                req.functionCode = resAdu[7];
                req.data = resAdu.subarray(8);
                this.emit('response',sock, resAdu)
                this.net.write(sock, resAdu)
            }
          
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

      //Function to validate data in net layer
      this.net.validateFrame = (frame)=>{
            //validating length of message
            if(frame.length >= 3){
                //validating crc
                if(this.validateCheckSum(frame)){

                    this.busMessageCount++; //inc message counter

                    if(this.validateAddress(frame)){
                        return true
                    }
                    else{
                        return false
                    }
                }
                else{
                    this.busCommunicationErrorCount++;
                    return false;
                }                
            }
            else{
                this.busCommunicationErrorCount++;
                return false;
            }           
        }
    
        //Sealling net layer object
        Object.defineProperty(self, 'net', {
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

module.exports = NodbusSerialServer;

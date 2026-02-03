/**
* Modbus Serial encapsulated on Tcp server module.
* @module server/m_stcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusSerialServer = require('../protocol/modbus_server_serial');
const SerialServer = require('./net/serialserver');
const TcpServer = require('./net/tcpserver');

//Default Server's Configuration object
const defaultCfg = {
    transmitionMode : 0, //transmition mode 0-auto, 1-rtu, 2-ascii
    address : 1,
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048,      
    udpType : 'udp4',      
    timeBetweenFrame : 20,
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
    constructor(netClass = SerialServer, mbTcpServerCfg = defaultCfg){
        super(mbTcpServerCfg);

        var self = this;

        //arguments check        
        mbTcpServerCfg.tcpCoalescingDetection = false;
        if(mbTcpServerCfg.maxConnections == undefined){ mbTcpServerCfg.maxConnections = defaultCfg.maxConnections}      
        if(mbTcpServerCfg.udpType !== 'udp4' && mbTcpServerCfg.udpType !== 'udp6'){ mbTcpServerCfg.udpType = defaultCfg.udpType}
        
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
            try {
                const pdu = this.getPdu(adu);
                const req = {};

                req.timeStamp = Date.now();
                req.address = this.getAddress(adu);
                req.functionCode = pdu[0];
                req.data = pdu.subarray(1);

                this.emit('request', sock, req);

                if (req.address === 0) {
                    this.executeBroadcastReq(adu);
                } else {
                    const resAdu = this.getResponseAdu(adu);
                    const resPdu = this.getPdu(resAdu);
                    const res = {};

                    res.timeStamp = Date.now();
                    res.address = this.address;
                    res.functionCode = resPdu[0]; // FIX: Use response PDU for function code
                    res.data = resPdu.subarray(1);
                    this.emit('response', sock, res);
                    this.net.write(sock, resAdu);
                }
            } catch (e) {
                // Emit an error event if processing fails, to prevent a server crash.
                this.emit('error', e);
            }
        };

        this.net.onConnectionAcceptedHook = (sock) => {
            this.emit('connection', sock);
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

      

        /**
         * current req 
         * If another req arrive while the current req is not null, exepction 5 should be sended
         * @type {Array}
         */
        this.currentRequest = null;  

        //Function to validate data in net layer
        this.net.validateFrame = (frame)=>{
            const minLength = this.transmitionMode === 1 ? 9 : 4;
            if (frame.length < minLength) {
                this.busCommunicationErrorCount++;
                return false;
            }

            if (!this.validateCheckSum(frame)) {
                this.busCommunicationErrorCount++;
                return false;
            }

            // A frame with a valid checksum is a valid message on the bus.
            this.busMessageCount++;

            // Now, check if the message is addressed to this server.
            // If not, it's a valid frame for another device, so we just ignore it.
            return this.validateAddress(frame);
        };
          
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
      return this.net.isListening;
    }

    get port(){
      return this.net.port
    }

    set port(newport){
      this.net.port = newport
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

module.exports = NodbusSerialServer;

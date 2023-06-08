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
    maxConnections : 32,
    udpType : 'udp4',
    tcpCoalescingDetection: true
    }

/**
 * Class representing a modbus tcp server fully functionl.
 * @extends ModbusTcpServer
*/
class NodbusTcpServer extends ModbusTcpServer {
    /**
    * Create a Modbus Tcp Server.    
    * @param {object} config object.
    * @param {number} netClass: Constructor for network object
    * 
    */
    constructor(mbTcpServerCfg = defaultCfg, netClass = TcpServer){
        super(mbTcpServerCfg);
        let self = this;

        //arguments check        
        if(mbTcpServerCfg.port == undefined){ mbTcpServerCfg.port = defaultCfg.port}
        if(mbTcpServerCfg.maxConnections == undefined){ mbTcpServerCfg.maxConnections = defaultCfg.maxConnections}
        if(mbTcpServerCfg.tcpCoalescingDetection == undefined){ mbTcpServerCfg.tcpCoalescingDetection = defaultCfg.tcpCoalescingDetection}

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
        
        //Function to validate data in net layer
        this.net.validateFrame = (frame)=>{
            return frame.length > 7
        }
        
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

/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const ADU = require('../protocol/tcp_adu');



/**
 * Class representing a modbus tcp client.
 * @extends ModbusMaster
*/
class ModbusTCPClient extends  ModbusMaster {
  /**
  * Create a Modbus Tcp Client.
  */
    constructor(){
        super();

        var self = this;

        var transactionCountValue = 1;

        /**
        * tcp layer
        * @type {object}
        */
        this.netClient = new TcpClient();

        //asociando el evento data del netClient con la funcion ProcessResponse
        this.netClient.onData = this.ProcessResponse.bind(this);

        /**
        * Emit connect and ready events
        * @param {object} target Socket object
        * @fires ModbusTCPClient#connect {object}
        * @fires ModbusTCPClient#ready
        */
        this.netClient.onConnect = self._EmitConnect.bind(this);


        /**
        *Emit disconnect event
        * @param {object} had_error
        * @fires ModbusTCPClient#disconnect {object}
        */
        function EmitDisconnect(had_error){
            this.isConnected = false;

            /**
           * disconnect event.
           * @event ModbusTCPClient#disconnect
           */
            this.emit('disconnect', had_error);
        }
        this.netClient.onClose = EmitDisconnect.bind(this);

        /**
        *Emit error event
        * @param {object} error
        * @fires ModbusTCPClient#error {object}
        */
        function EmitError (err){

          /**
         * error event.
         * @event ModbusTCPClient#error
         * @type {object}
         */
            this.emit('error',err);
        }
        this.netClient.onError = EmitError.bind(this);

        /**
        * Emit timeout event        *
        * @fires ModbusTCPClient#timeout
        */
        this.netClient.onTimeOut = self._EmitTimeout.bind(this);

        /**
        * Emit Indication event        *
        * @fires ModbusTCPClient#indication
        */
        function EmitIndication(data){
          /**
         * indication event.
         * @event ModbusTCPClient#indication
         */
          this.emit('indication', data);
        }
        this.netClient.onWrite = EmitIndication.bind(this);

        /**
        * Slave modbus Device {ip, port, timeout}
        * @type {object}
        */
        Object.defineProperty(self,'slaveDevice',{
            set: function(slave){
                self.netClient.SlaveDevice = slave;

            },
            get: function(){
                return self.netClient.SlaveDevice;
            }
        });

        Object.defineProperty(self,'isConnected',{
            get: function(){
                return self.netClient.isConnected;
            }
        });

        /**
        * number of transaction
        * @type {number}
        */
        Object.defineProperty(self, 'transactionCounter', {
            get: function(){
                return transactionCountValue;
            },
            set: function(value){
                if(value <= 0xFFF0){
                    transactionCountValue = value;
                }
                else{
                    transactionCountValue = 1;
                }
            },
            enumerable: false,
            configurable: false
        } )

    }


    /**
    * function to create a adu
    * @param {object} pdu of request
    * @return {object} adu request
    */
    CreateADU(address, pdu){
      var adu = new ADU();
      adu.address = address;
      adu.pdu = pdu;
      adu.transactionCounter = this.transactionCounter++

      adu.MakeBuffer();
      return adu;
    }

    /**
    * function to pasrse server response
    * @param {Buffer} aduBuffer frame of response
    * @return {object} map Object whit register:value pairs
    * @fires ModbusTCPClient#modbus_exception {object}
    * @fires ModbusTCPClient#error {object}
    */
    ParseResponse(aduBuffer) {

      let resp = new ADU(aduBuffer);
      try{
        resp.ParseBuffer();
        //chekeo el transactionID
        if(resp.mbap.transactionID != this.currentModbusRequest.mbap.transactionID){
          this.emit('modbus_exception', "Wrong Transaction ID");
            return false;
        }
        else if((aduBuffer.length - 6) != resp.mbap.length) {
            this.emit('modbus_exception', "Header ByteCount Mismatch");
            return false;
        }
        else {
            return this.ParseResponsePDU(resp.pdu);
        }
      }
      catch(err){
        throw err;
      }

    }

	  /**
    *Stablish connection to server
    */
	  Start(){
		  this.netClient.Connect();
	  }
    /**
    *disconnect from server
    */
	  Stop(){
		  this.netClient.Disconnet();
	  }
}

module.exports = ModbusTCPClient;

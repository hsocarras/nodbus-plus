/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
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
        * @param {string} id
        * @param {object} had_error
        * @fires ModbusTCPClient#disconnect {object}
        */
        function EmitDisconnect(id, had_error){

          let slave = this.slaveList.get(id);
            
            /**
           * disconnect event.
           * @event ModbusTCPClient#disconnect
           */
            this.emit('disconnect',id, had_error);
            slave.isReady = false;
        }
        this.netClient.onClose = EmitDisconnect.bind(this);

        /**
        *Emit error event
        * @param {object} error
        * @fires ModbusTCPClient#error {object}
        */
        function EmitError (id, err){

          /**
         * error event.
         * @event ModbusTCPClient#error
         * @type {object}
         */
            this.emit('error',id, err);
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
        function EmitIndication(id, data){
          /**
         * indication event.
         * @event ModbusTCPClient#indication
         */
          this.emit('indication',id, data);
        }
        this.netClient.onWrite = EmitIndication.bind(this);
        
        /**
        * number of transaction
        * @type {number}
        */
        Object.defineProperty(self, 'transactionCounter', {
            get: function(){
                return transactionCountValue;
            },
            set: function(value){
                if(value <= 0xFFF0 ){
                  if(value = transactionCountValue + 1){
                    transactionCountValue = value;
                  }                    
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
    CreateADU(id, pdu){
      var adu = new ADU();
      let slave = this.slaveList.get(id);
      
      adu.pdu = pdu;
      adu.address = slave.modbusAddress;
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
    ParseResponse(id, aduBuffer) {

      let resp = new ADU(aduBuffer);
      let slave = this.slaveList.get(id);

      try{
        resp.ParseBuffer();
        //chekeo el transactionID
        if(resp.mbap.transactionID != slave.currentRequest.mbap.transactionID){
          this.emit('modbus_exception', id, "Wrong Transaction ID");
            return false;
        }
        else if((aduBuffer.length - 6) != resp.mbap.length) {
            this.emit('modbus_exception',id,  "Header ByteCount Mismatch");
            return false;
        }
        else {
            return this.ParseResponsePDU(id, resp.pdu);
        }
      }
      catch(err){
        throw err;
      }

    }

	  /**
    *Stablish connection to servers
    */
	  Start(id){
      let self = this;
      let successPromise;

      if(id){
        let slave = self.slaveList.get(id);
        if(slave == undefined){
          return Promise.reject(id);
        }
        else if(slave.isReady){
          return Promise.resolve(id);
        }
        else{
          return self.netClient.Connect(slave);
        }
      }
      else{
        let promiseList = [];
        this.slaveList.forEach(function(slave, key){
          let promise; 
          console.log(slave)         
          promise = self.netClient.Connect(slave);
          promiseList.push(promise);
        })
        successPromise = Promise.all(promiseList);        
        
        return successPromise;
      }
		  
	  }
    /**
    *disconnect from server
    */
	  Stop(id){
		  if(id){
        let slave = this.slaveList.get(id);
        if(slave.isReady){
          return this.netClient.Disconnet(id);          
        }
        else{
          return Promise.resolve(id);
        }        
      }
      else{
        let promiseList = [];
        this.slaveList.forEach(function(slave, key){
          let promise;
          promise = this.netClient.Disconnet(id);
          promiseList.push(promise);
        })
        successPromise = Promise.all(promiseList);
        return successPromise;
      }
	  }
}

module.exports = ModbusTCPClient;

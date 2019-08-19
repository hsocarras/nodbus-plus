/**
** Modbus Serial over Tcp Client  module.
* @module client/modbus_stcp_client
* @author Hector E. Socarras.
* @version 0.6.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const RTU_ADU = require('../protocol/rtu_adu');
const ASCII_ADU = require('../protocol/ascii_adu');
var ADU ;

/**
 * Class representing a modbus master over tcp.
 * @extends ModbusMaster
*/
class ModbusTCPClient extends  ModbusMaster {
  /**
  * Create a Modbus Serial over Tcp Client.
  */
    constructor(mode = 'rtu'){
        super();

        var self = this;

        var serialMode = mode;

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
        this.netClient.onTimeOut =  self._EmitTimeout.bind(this);;

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
        
    }


    /**
    * function to create a adu
    * @param {object} pdu of request
    * @return {object} adu request
    */
    CreateADU(id, pdu){
      let slave = this.slaveList.get(id);
      var ADU;
      
      if(slave.serialMode == 'ascii'){
        ADU = ASCII_ADU;
      }
      else{
        ADU = RTU_ADU;
      }
      let adu = new ADU();
      adu.address = slave.modbusAddress;
      adu.pdu = pdu;

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

      let slave = this.slaveList.get(id);
      var ADU;
      if(slave.serialMode == 'ascii'){
        ADU = ASCII_ADU;
      }
      else{
        ADU = RTU_ADU;
      }

      let resp = new ADU(aduBuffer);
      try{
        resp.ParseBuffer();
        return this.ParseResponsePDU(id, resp.pdu);
      }
      catch(err){
        if(err.description == 'checksum error'){
          this.emit('modbus_exception', id, "CHEKSUM ERROR");
          return false;
        }
        else throw err;
      }

    }


    Start(id){
      let self = this;
      let successPromise;

      if(id){
        let slave = self.slaveList.get(id);
        if(slave.isReady){
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
          return Promise.resolve(id);
        }
        else{
          return this.netClient.Disconnet(id);
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

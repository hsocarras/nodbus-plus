/**
** Modbus Serial over Tcp Client  module.
* @module client/modbus_stcp_client
* @author Hector E. Socarras.
* @version 0.6.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const UdpClient = require('../net/udpclient');
const Request = require('../protocol/request');
const Response = require('../protocol/response');
const Slave = require('../protocol/slave_endpoint');


/**
 * Class representing a modbus master over tcp.
 * @extends ModbusMaster
*/
class ModbusSerialClient extends  ModbusMaster {
  /**
  * Create a Modbus Serial over Tcp Client.
  */
    constructor(tp = 'tcp'){
        super();

        var self = this;

        var transportProtocol
        if(typeof tp == 'string'){
          transportProtocol = tp
        }
        else{
          throw new TypeError('transport protocol should be a string')
        }

        /**
        * tcp layer
        * @type {object}
        */
       switch(transportProtocol){
        case 'udp4':
          this.netClient = new UdpClient('udp4');
          break;
        case 'udp6':
          this.netClient = new UdpClient('udp6');
          break;
        default:
          this.netClient = new TcpClient();
      }

        //asociando el evento data del netClient con la funcion ProcessResponse
        this.netClient.onData = this.ProcessResponse.bind(this);

        /**
        * Emit connect and ready events
        * @param {object} target Socket object
        * @fires ModbusSerialClient#connect {object}
        * @fires ModbusSerialClient#ready
        */
        this.netClient.onConnect = self._EmitConnect.bind(this);


        /**
        *Emit disconnect event
        * @param {object} had_error
        * @fires ModbusSerialClient#disconnect {object}
        */
        function EmitDisconnect(id, had_error){
          let slave = this.slaveList.get(id);

            /**
           * disconnect event.
           * @event ModbusSerialClient#disconnect
           */
          this.emit('disconnect',id, had_error);
          slave.isReady = false;

        }
        this.netClient.onClose = EmitDisconnect.bind(this);

        /**
        *Emit error event
        * @param {object} error
        * @fires ModbusSerialClient#error {object}
        */
        function EmitError (id, err){

          /**
         * error event.
         * @event ModbusSerialClient#error
         * @type {object}
         */
            this.emit('error',id, err);
        }
        this.netClient.onError = EmitError.bind(this);

        /**
        * Emit timeout event on inactive socket      *
        * @fires ModbusSerialClient#inactive
        */
      function EmitInactive (port){
        this.emit('inactive', port)
      }
      this.netClient.onTimeOut = EmitInactive.bind(this);
        
        /**
        * Emit Indication event        *
        * @fires ModbusSerialClient#indication
        */
        function EmitIndication(id, data){
          /**
         * indication event.
         * @event ModbusSerialClient#indication
         */
          this.emit('indication',id, data);
        }
        this.netClient.onWrite = EmitIndication.bind(this);      

        
    }

    /**
     * Function to add a slave object to master's slave list
     * @param {string} id: Slave'id. Should be unique per slave
     * @param {Object} slave: Object {ip, port, timeout, address}
     */
    AddSlave(id, slave){
      let slaveDevice = new Slave();
      slaveDevice.id = id;
      slaveDevice.type = slave.type || 'rtu';
      if(slave.address >= 1 && slave.address <= 247){
        slaveDevice.address = slave.address;
      }
      else{
        slaveDevice.address = 247;
      }
      
      slaveDevice.timeout = slave.timeout || 1000; //timeout in ms      
      slaveDevice.ip = slave.ip || '127.0.0.1';      
      slaveDevice.port = slave.port || 502;     
      slaveDevice.maxRetries = slave.maxRetries || 1;  
      slaveDevice.maxRequests = 1; 

      //Emiting the idle event
      let EmitIdle = function(){
        this.emit('idle', slaveDevice.id)
      }.bind(this)      
      slaveDevice.on('drain', EmitIdle);
      
      this.slaveList.set(id, slaveDevice);
    }

    /**
    * function to create a adu
    * @param {object} pdu of request
    * @return {object} adu request
    */
    CreateRequest(id, pdu){
      let slave = this.slaveList.get(id);
      var req = new Request(slave.type);     
      
      
      req.adu.pdu = pdu;
      req.adu.address = slave.address;
      req.adu.MakeBuffer();
      req.id = this.reqCounter;
      this.reqCounter++;
      req.slaveID = id;
      req.OnTimeout = this._EmitTimeout.bind(this);

      return req;
    }

    /**
    * function to pasrse server response
    * @param {Buffer} aduBuffer frame of response
    * @return {object} map Object whit register:value pairs
    * @fires ModbusSerialClient#modbus_exception {object}
    * @fires ModbusSerialClient#error {object}
    */
    ParseResponse(slave, aduBuffer) {

      let resp = new Response(slave.type);
      resp.adu.aduBuffer = aduBuffer;
      
      
      try{
        resp.adu.ParseBuffer();        
        resp.id = this.resCounter;        
        resp.connectionID = slave.id;
        return resp;
      }
      catch(err){        
        if(typeof e == 'string') {
          this.emit('modbus_exception', slave.id, "CHEKSUM ERROR");
        }
        else{
          this.emit('error', err);
        }        
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

module.exports = ModbusSerialClient;

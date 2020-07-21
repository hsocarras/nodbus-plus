/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const Request = require('../protocol/request');
const Response = require('../protocol/response');
const Slave = require('../protocol/slave_descriptor');


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
            slave.isConnected = false;
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
        * Emit timeout event on inactive socket      *
        * @fires ModbusTCPClient#inactive
        */
       function EmitInactive (socket){
          this.emit('inactive', socket)
       }
       this.netClient.onTimeOut = EmitInactive.bind(this);

        /**
        * Emit Indication event        *
        * @fires ModbusTCPClient#indication
        */
        function EmitIndication(id, req){
          /**
         * indication event.
         * @event ModbusTCPClient#indication
         */
          this.emit('indication',id, req);
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
     * Function to add a slave object to master's slave list
     * @param {string} id: Slave'id. Should be unique per slave
     * @param {Object} slave: Object {ip, port, timeout, address}
     */
    AddSlave(id, slave){
      console.log(Slave)
      let slaveDevice = new Slave();
      slaveDevice.id = id;
      slaveDevice.type = 'tcp';
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
      slaveDevice.maxRequests = 16; 

      //Emiting the idle event
      let EmitIdle = function(){
        this.emit('idle', slaveDevice.id)
      }.bind(this)      
      slaveDevice.on('drain', EmitIdle);
      
      this.slaveList.set(id, slaveDevice);
    }
   

    /**
    * function to create a modbust tcp request
    * @param {number} id id of slave in slave list
    * @param {object} pdu of request
    * @return {object} adu request
    */
    CreateRequest(id, pdu){
      var req = new Request('tcp');
      let slave = this.slaveList.get(id);
      
      req.adu.pdu = pdu;
      req.adu.address = slave.address;
      req.adu.transactionCounter = this.transactionCounter;   
      req.adu.MakeBuffer();   
      req.id = this.transactionCounter;
      this.transactionCounter++;
      req.slaveID = id;
      req.OnTimeout = this._EmitTimeout.bind(this);

      req.adu.MakeBuffer();
      return req;
    }

    /**
    * function to pasrse server response
    * @param {Buffer} aduBuffer frame of response
    * @return {object} map Object whit register:value pairs
    * @fires ModbusTCPClient#modbus_exception {object}
    * @fires ModbusTCPClient#error {object}
    */
    ParseResponse(slave, aduBuffer) {
      
      let resp = new Response('tcp');
      resp.adu.aduBuffer = aduBuffer;
      
      try{
        
        resp.adu.ParseBuffer();
        resp.id = resp.adu.mbap.transactionID;
        resp.connectionID = slave.id;

        //chekeo el transactionID
        if(slave.SearchRequest(resp.id) == undefined){
          this.emit('modbus_exception', slave.id, "Wrong Transaction ID");            
            return null;
        }
        else{ 
          if((aduBuffer.length - 6) != resp.adu.mbap.length) {
            this.emit('modbus_exception',slave.id,  "Header ByteCount Mismatch");
            return null;
          }
          else {
            return resp;
          }
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
        else if(slave.isConnected){
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
        if(slave.isConnected){
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

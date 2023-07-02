/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
*/

const ModbusTcpMaster = require('../protocol/modbus_master_tcp');
const TcpClient = require('./net/tcpclient');
const UdpClient = require('./net/udpclient');




/**
 * Class representing a modbus tcp client ready to use.
 * @extends ModbusTcpMaster
*/
class NodbusTCPClient extends  ModbusTcpMaster {
  /**
  * Create a Modbus Tcp Client.
  * @param {object} netClass. Transport layer. Can be tcp, udp4 or udp6
  */
    constructor(netClass = TcpClient){
        super();

        var self = this; 

        /**
        * network layer
        * @type {object}
        */
        try {
            this.net = new netClass();
        }
        catch(e){
            this.emit('error', e);
            this.net = new TcpServer();
        }
        
        this.slaveList = new Map();
        
        //asociando el evento data del netClient con la funcion ProcessResponse
        this.net.onDataHook = this.ProcessResponse.bind(this);

        /**
        * Emit connect and ready events
        * @param {object} target Socket object
        * @fires ModbusTCPClient#connect {object}
        * @fires ModbusTCPClient#ready
        */
        this.netClient.onConnect = self.EmitConnect.bind(this);


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
       function EmitInactive (id){
          this.emit('inactive', id)
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
          this.emit('indication',id, req.adu.aduBuffer);
          this.emit('request',id, req);
        }
        this.netClient.onWrite = EmitIndication.bind(this);        
               
        this._currentRequest = null;
        
    }

    /**
     * Function to add a slave object to master's slave list
     * @param {string} id: Slave'id. Should be unique per slave
     * @param {Object} slave: Object {ip, port, timeout, address}
     */
    AddSlave(id, slave){
      
      let slaveDevice = new Slave();
      slaveDevice.id = id;
      slaveDevice.type = 'tcp';      
      slaveDevice.address = slave.address || 247;      
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
    * 
    * @param {string} id 
    */
    RemoveSlave(id){
        if(this.slaveList.has(id)){
          this.slaveList.delete(id);      
        }      
    }

    isSlaveReady(id){
        if(this.slaveList.has(id)){
          let slave = this.slaveList.get(id);
          return slave.isConnected;
        }
        else return false;      
    }

    /**
    * function to create a modbust tcp request
    * @param {number} id id of slave in slave list
    * @param {object} pdu of request
    * @return {object} adu request
    */
    CreateRequest(id, adu){
      var req = new Request('tcp');     
      
      req.adu = adu;        
      req.adu.MakeBuffer();   
      req.id = adu.transactionCounter;      
      req.slaveID = id;
      req.OnTimeout = this.EmitTimeout.bind(this);
      
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
        let respADUParsedOk = resp.adu.ParseBuffer();

        if(respADUParsedOk){
          
          resp.id = resp.adu.mbapHeader.transactionID;
          resp.connectionID = slave.id;

          //chekeo el transactionID
          if(slave.SearchRequest(resp.id) == undefined){
            this.emit('modbus_exception', slave.id, "Wrong Transaction ID");            
              return null;
          }
          else{ 
            if((aduBuffer.length - 6) != resp.adu.mbapHeader.length) {
              this.emit('modbus_exception',slave.id,  "Header ByteCount Mismatch");
              return null;
            }
            else {
              return resp;
            }
          }
        } 
        else{
            this.emit('modbus_exception',slave.id,  "Unknow Frame Error");
            return null
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
          successPromise = self.netClient.Connect(slave);
          successPromise.then(function(){
             /**
              * ready event.
              * @event ModbusTCPClient#ready
            */
            self.emit('ready');
          },function(id, err){
            self.emit('error', id, err);
          })
          return successPromise
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
        successPromise.then(function(){
          /**
           * ready event.
           * @event ModbusTCPClient#ready
         */
         self.emit('ready');
       }, function(id, err){
        self.emit('error', id, err);
      })
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

    checkMaxRequest(slave){
        return slave.isMaxRequest;
    }

}



module.exports = NodbusTCPClient;

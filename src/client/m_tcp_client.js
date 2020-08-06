/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const UdpClient = require('../net/udpclient');
const Request = require('../protocol/request');
const Response = require('../protocol/response');
const Slave = require('../protocol/slave_endpoint');


/**
 * Class representing a modbus tcp client.
 * @extends ModbusMaster
*/
class ModbusTCPClient extends  ModbusMaster {
  /**
  * Create a Modbus Tcp Client.
  * @param {string} tp. Transport layer. Can be tcp, udp4 or udp6
  */
    constructor(tp = 'tcp'){
        super();

        var self = this;

        var transactionCountValue = 1;

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
          successPromise = self.netClient.Connect(slave);
          successPromise.then(function(){
             /**
              * ready event.
              * @event ModbusTCPClient#ready
            */
            self.emit('ready');
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
    
    /**
    * function 01 of modbus protocol
    * @param {string} id reference of device.
    * @param {number} startcoil first coil to read, start at 0 coil
    * @param {number} coilQuantity number of coils to read
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
   ReadCoilStatus(id, startCoil = 0, coilQuantity = 1){

    if(this.slaveList.has(id) == false){
      return false
    }

    let slave = this.slaveList.get(id);
    
    //if is enable and there are no active request
     if(slave.isConnected && slave.isMaxRequest == false){            
          let isSuccesfull
          var pdu = this.CreateRequestPDU(1, startCoil, coilQuantity);
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
          return isSuccesfull;
      }
      else{
          return false;
      }
  };

  /**
  * function 02 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startInput first Input to read, start at 0 coil
  * @param {number} InputQuantity number of Inputs to read
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  ReadInputStatus(id, startInput = 0, inputQuantity = 1){
    if(this.slaveList.has(id) == false){
      return false
    }

    let slave = this.slaveList.get(id);

       if(slave.isConnected && slave.isMaxRequest == false){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(2, startInput, inputQuantity);
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }       
          
          return isSuccesfull;
      }
      else{
          return false;
      }
  }


  /**
  * function 03 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister first holding register to read, start at 0 coil
  * @param {number} registerQuantity number of holding register to read
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  ReadHoldingRegisters(id, startRegister = 0, registerQuantity = 1){
    if(this.slaveList.has(id) == false){
      return false
    }

    let slave = this.slaveList.get(id);

       if(slave.isConnected && slave.isMaxRequest == false){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(3, startRegister, registerQuantity);
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
          
          return isSuccesfull;
      }
      else{
          return false;
      }
  }


  /**
  * function 04 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister first input register to read, start at 0 coil
  * @param {number} registerQuantity number of input register to read
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  ReadInputRegisters(id, startRegister = 0, registerQuantity = 1){
    if(this.slaveList.has(id) == false){
      return false
    }

    let slave = this.slaveList.get(id);

       if(slave.isConnected && slave.isMaxRequest == false){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(4, startRegister, registerQuantity);
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
          
          return isSuccesfull;
      }
      else{
          return false;
      }
  }


  /**
  * function 05 of modbus protocol
  * @param {string} id reference of device.
  * @param {bool} value value to force
  * @param {number} startcoil first coil to write, start at 0 coil
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  ForceSingleCoil(id, value, startCoil = 0){

    if(this.slaveList.has(id) == false){
      return false
    }
    
    let bufferValue = Buffer.alloc(2);
    let slave = this.slaveList.get(id);

    if(value){
      bufferValue[0] = 0xFF;
    }
      if(slave.isConnected && slave.isMaxRequest == false){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(5, startCoil, 1, bufferValue);            
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
          
          return isSuccesfull;
      }
      else{
          return false;
      }
  }

  /**
  * function 06 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister register to write.
  * @param {number} value value to force
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  PresetSingleRegister(id, value, startRegister = 0){
    if(this.slaveList.has(id) == false){
      return false
    }

    let val = Buffer.alloc(2);
    let slave = this.slaveList.get(id);

    if(value >= 0){
      val.writeUInt16BE(value);
    }
    else{
      val.writeInt16BE(value);
    }

    if(slave.isConnected && slave.isMaxRequest == false){
        //si estoy conectado
        let isSuccesfull;
        var pdu = this.CreateRequestPDU(6, startRegister, 1, val);
        var req = this.CreateRequest(id, pdu);
        let isRequestStacked = slave.AddRequest(req);            
        if(isRequestStacked){
          isSuccesfull = this.netClient.Write(id, req);
        }
        else{
          isSuccesfull = false;
        }
        
        return isSuccesfull;
    }
    else{
        return false;
    }
  }

  /**
  * function 15 of modbus protocol
  * @param {string} id reference of device.
  * @param {bool[]} forceData array of values to write.
  * @param {number} startCoil first coil to write, start at 0 coil.
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  ForceMultipleCoils(id, forceData, startCoil = 0){
    if(this.slaveList.has(id) == false){
      return false
    }

    let coilQuantity = forceData.length;
    let valueBuffer = Buffer.alloc(Math.floor((coilQuantity - 1)/8)+1);
    let byteTemp = 0x00;
    let offset = 0;
    let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
    let slave = this.slaveList.get(id);

    for(let i =0; i < coilQuantity; i++){
      if(forceData[i] == true){
        valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] | masks[i%8];
      }
      else {
        valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] & (~masks[i%8]);
      }
    }

       if(slave.isConnected && slave.isMaxRequest == false){
          //si estoy conectado
          let isSuccesfull
          var pdu = this.CreateRequestPDU(15, startCoil, coilQuantity, valueBuffer);
          var req = this.CreateRequest(id, pdu);
          let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
          
          return isSuccesfull;
      }
      else{
          return false;
      }
  }

  /**
  * function 16 of modbus protocol
  * @param {string} id reference of device.
  * @param {number[]} forceData array whit the values to write
  * @param {number} startRegister register to write.
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  PresetMultipleRegisters(id, forceData, startRegister = 0){
    if(this.slaveList.has(id) == false){
      return false
    }

    let valueBuffer = Buffer.alloc(0);
    let slave = this.slaveList.get(id);


    forceData.forEach(function(value){
      let tempBufer = null;
      if(Number.isInteger(value)){
        if(value >= 0 && value <= 65535){
          tempBufer = Buffer.alloc(2);
          tempBufer.writeUInt16BE(value);
          valueBuffer = Buffer.concat([valueBuffer, tempBufer], valueBuffer.length + 2)
        }
        else if (value < 0 && value > -32767) {
          tempBufer = Buffer.alloc(2);
          tempBufer.writeInt16BE(value);
          valueBuffer = Buffer.concat([valueBuffer, tempBufer], valueBuffer.length + 2)
        }
        else{
          tempBufer = Buffer.alloc(4);
          tempBufer.writeInt32LE(value);
          valueBuffer = Buffer.concat([valueBuffer, tempBufer.swap16()], valueBuffer.length + 4)
        }
      }
      else{
        tempBufer = Buffer.alloc(4);
        tempBufer.writeFloatLE(value);
        valueBuffer = Buffer.concat([valueBuffer, tempBufer.swap16()], valueBuffer.length + 4);
      }

    })

    let registerQuantity = valueBuffer.length/2;

     if(slave.isConnected && slave.isMaxRequest == false){
        //si estoy conectado
        let isSuccesfull;
        var pdu = this.CreateRequestPDU(16, startRegister, registerQuantity, valueBuffer);
        var req = this.CreateRequest(id, pdu);
        let isRequestStacked = slave.AddRequest(req);            
          if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
          }
          else{
            isSuccesfull = false;
          }
        
        return isSuccesfull;
    }
    else{
        return false;
    }
  }

  /**
  * function 22 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister register to write.    
  * @param {int [16]} value : array with 1 in position that want to be true, 0 on position that
  * want to be false and -1 in position that not to be modified.
  * example register value is [0 1 1 0   1 1 0 0    0 1 1 1   1 0 0 1] 0x9E36
  *         desired value is  [1 0 0 1  -1 0 1 -1  -1 -1 0 0  1 1 -1 0]
  *         result            [1 0 0 1   1 0 1 0    0 1 0 0   1 1 0 0] 0x3259
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
  MaskHoldingRegister(id, value, startRegister = 0){
  if(this.slaveList.has(id) == false){
    return false
  }

  let val = Buffer.alloc(4)
  let slave = this.slaveList.get(id);
  
  let AND_Mask = 0x00;
  let OR_Mask = 0xFFFF;

  let tempMask = 1;

  for (let i = 0; i <value.length; i++){
    
    if(value[i] == 1){
      //AND_MASK = 0;
      //OR_Mask = 1;        
    }
    else if(value[i] == 0){ 
      //AND_MASK = 0;       
      OR_Mask = OR_Mask  & (~tempMask); //OR_MASK = 0
    }
    else{
      AND_Mask = AND_Mask | tempMask;
    }
    
    tempMask = tempMask << 1; 
  }   
  
  val.writeUInt16BE(AND_Mask);
  val.writeUInt16BE(OR_Mask, 2);
  

  if(slave.isConnected && slave.isMaxRequest == false){
      //si estoy conectado
      let isSuccesfull;
      var pdu = this.CreateRequestPDU(22, startRegister, 1, val);
      var req = this.CreateRequest(id, pdu);
      let isRequestStacked = slave.AddRequest(req);            
      if(isRequestStacked){
        isSuccesfull = this.netClient.Write(id, req);
      }
      else{
        isSuccesfull = false;
      }
      
      return isSuccesfull;
  }
  else{
      return false;
  }
  }

}

module.exports = ModbusTCPClient;

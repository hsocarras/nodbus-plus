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
        function EmitIndication(id, req){
          /**
         * indication event.
         * @event ModbusSerialClient#indication
         */
        this.emit('indication',id, req.adu.aduBuffer);
        this.emit('request',id, req);
        }
        this.netClient.onWrite = EmitIndication.bind(this);      

        this._currentRequest = null;
        
    }

    get isIdle(){
      if (this._currentRequest == null){
        return true
      }
      else return false
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
      slaveDevice.address = slave.address || 247;  
      
      slaveDevice.timeout = slave.timeout || 1000; //timeout in ms      
      slaveDevice.ip = slave.ip || '127.0.0.1';      
      slaveDevice.port = slave.port || 502;     
      slaveDevice.maxRetries = slave.maxRetries || 1;  
      slaveDevice.maxRequests = 1; 
      

      //Emiting the idle event
      let EmitIdle = function(){
        this.emit('idle', 'master')
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
     if(slave.isConnected && this._currentRequest == null){            
          let isSuccesfull
          var pdu = this.CreateRequestPDU(1, startCoil, coilQuantity);
          var req = this.CreateRequest(id, pdu);
          slave.AddRequest(req); 
          this._currentRequest = req;           
          
          isSuccesfull = this.netClient.Write(id, req);
          
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

        if(slave.isConnected && this._currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(2, startInput, inputQuantity);
            var req = this.CreateRequest(id, pdu);
            slave.AddRequest(req);       
            this._currentRequest = req     
            
            isSuccesfull = this.netClient.Write(id, req);
                 
            
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

        if(slave.isConnected && this._currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(3, startRegister, registerQuantity);
            var req = this.CreateRequest(id, pdu);
            slave.AddRequest(req);            
            this._currentRequest = null
            isSuccesfull = this.netClient.Write(id, req);
            
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

        if(slave.isConnected && this._currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(4, startRegister, registerQuantity);
            var req = this.CreateRequest(id, pdu);
            let isRequestStacked = slave.AddRequest(req); 
            this._currentRequest = req;           
            
            isSuccesfull = this.netClient.Write(id, req);
                        
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
        if(slave.isConnected && this._currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(5, startCoil, 1, bufferValue);            
            var req = this.CreateRequest(id, pdu);
            slave.AddRequest(req);   
            this._currentRequest = req;         
            
            isSuccesfull = this.netClient.Write(id, req);
           
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

      if(slave.isConnected && this._currentRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(6, startRegister, 1, val);
          var req = this.CreateRequest(id, pdu);
          slave.AddRequest(req);  
          this._currentRequest = req;          
          
          isSuccesfull = this.netClient.Write(id, req);
                    
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

        if(slave.isConnected && this._currentRequest == null){
            //si estoy conectado
            let isSuccesfull
            var pdu = this.CreateRequestPDU(15, startCoil, coilQuantity, valueBuffer);
            var req = this.CreateRequest(id, pdu);
            slave.AddRequest(req);   
            this._currentRequest = req;         
            
            isSuccesfull = this.netClient.Write(id, req);            
            
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

      if(slave.isConnected && this._currentRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(16, startRegister, registerQuantity, valueBuffer);
          var req = this.CreateRequest(id, pdu);
          slave.AddRequest(req);   
          this._currentRequest = req;         
            
          isSuccesfull = this.netClient.Write(id, req);
            
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
      

      if(slave.isConnected && this._currentRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(22, startRegister, 1, val);
          var req = this.CreateRequest(id, pdu);
          slave.AddRequest(req);
          this._currentRequest = req            
          
          isSuccesfull = this.netClient.Write(id, req);
          
          
          return isSuccesfull;
      }
      else{
          return false;
      }
    }

}

module.exports = ModbusSerialClient;

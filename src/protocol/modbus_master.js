/**
** Modbus Master Base Class module.
* @module protocol/modbus-master
* @author Hector E. Socarras.
* @version 0.8.0
*/


const ModbusDevice = require('./modbus_device');


/**
 * Class representing a modbus master.
 * @extends ModbusDevice
*/
class ModbusMaster extends ModbusDevice {
  /**
  * Create a Modbus Master.
  */
    constructor(){
        super();
        var self = this;
        
        /**
        * map with slave's 
        * @type {Map}
        */
        this.slaveList = new Map();
        
    }

    _EmitTimeout(id, req){

      let slave = this.slaveList.get(id);

      if(slave.maxRetries == req._retriesNumber){
        slave.RemoveRequest(req)
        /**
        * timeout event.
        * @event ModbusClient#timeout
        */
        this.emit('timeout', id, req);        
      }
      else{
        this.netClient.Write(id, req);
        req._retriesNumber++;
      }
    }

    _EmitConnect(id){
      let slave = this.slaveList.get(id);
      slave.isConnected = true;

        /**
       * connect event.
       * @event ModbusTCPClient#connect
       * @type {object}
       */
        this.emit('connect',id);

        /**
       * ready event.
       * @event ModbusTCPClient#ready
       */
        this.emit('ready', id);
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
      else return undefined;      
    }

    /**
    * Build a request PDU
    * @param {number} modbusFunction modbus function
    * @param {startAddres} startAddres starting at 0 address
    * @param {pointsQuantity} pointsQuantity
    * @param {number|Buffer} values values to write
    * @return {Object} PDU object
    */
    CreateRequestPDU(modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values) {
        
        var self = this;

        //chequeando el argumento values
        if(typeof(values) == 'number'){

            let valueBuffer = Buffer.alloc(2);
            valueBuffer.writeUInt16BE(values);

            values = valueBuffer;
        }

        //creando la pdu del request
        var request = self.CreatePDU();

        switch(modbusFunction){
          case 1:
              //funcion 01 read coils status
              request.modbus_function = 0x01;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 2:
              //funcion 02 read inputs status
              request.modbus_function = 0x02;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 3:
              //funcion 0x03 leer holdings registers
              request.modbus_function = 0x03;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 4:
               //funcion 0x04 read input registers
              request.modbus_function = 0x04;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 5:
               //funcion 05 write single coil
              request.modbus_function = 0x05;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              if (values.readUInt16BE(0) == 0xFF00 || values.readUInt16BE(0) == 0x00 ) {
                values.copy(request.modbus_data,2);
              }
              else {
                  this.emit('modbus_exception',id, 'Illegal value on query');
              }
              request.MakeBuffer();
              return request;
              break;
          case 6:
              //creando la pdu del request
              var request = this.CreatePDU();
              //funcion 06 PresetSingleRegister
              request.modbus_function = 0x06;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              values.copy(request.modbus_data,2);
              request.MakeBuffer();
              return request;
              break;
          case 15:
              //function 15 force multiples coils
              request.modbus_function = 0x0F;
              //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
              request.modbus_data = Buffer.alloc(5 + values.length);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.modbus_data[4]= values.length;
              values.copy(request.modbus_data,5);
              request.MakeBuffer();
              return request;
              break;
          case 16:
              //function 16 write multiples coils
              request.modbus_function = 0x10;
              //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
              request.modbus_data = Buffer.alloc(5 + pointsQuantity*2);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.modbus_data[4]= values.length;
              values.copy(request.modbus_data,5);
              request.MakeBuffer();
              return request;
              break;
          case 22:
              //function 22 mask holding register
              request.modbus_function = 0x16;              
              request.modbus_data = Buffer.alloc(6);
              request.modbus_data.writeUInt16BE(startAddres,0);              
              values.copy(request.modbus_data,2);              
              request.MakeBuffer();
              return request;
              break;
        }
    }

    CreateRequest(id, pdu){
      //function to be redefined in tcp or serial client
      return pdu
    }

    //function to redefine on childs class
    ParseResponse(slave, respAdu){ }

    

    /**
    * extract data for a slave response
    * @param {string} id reference of device.
    * @param {Buffer} respADU
    * @fires ModbusMaster#raw_data {buffer} response frame
    * @fires ModbusMaster#data {object} map object whit pair register:values
    * @fires ModbusMaster#error {object}
    */
    ProcessResponse(id, respADU){

      let slave = this.slaveList.get(id);
      var self = this;
      
      /**
     * raw_data event.
     * @event ModbusMaster#raw_data
     * @type {object}
     */
      this.emit('raw_data',id, respADU);
      let respStack = self.SplitTCPFrame(respADU)
      
      respStack.forEach(function(element, index, array){
              
        if(slave.requestStack.size > 0){ 
                  
          try{            
            var resp = self.ParseResponse(slave, element); 
            let req = slave.SearchRequest(resp.id);
            
            if(resp){

              resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
              resp.timestamp = Date.now();
              req.StopTimer();

              //in exception case
              if(resp.data.has('exception')){
                switch(resp.data.get('exception')){
                  case 1:
                    this.emit('modbus_exception', resp.deviceID, 'Illegal Function');  
                    break;
                  case 2:
                      this.emit('modbus_exception', resp.deviceID, 'Illegal Data Address');
                      break;
                  case 3:
                      this.emit('modbus_exception', resp.deviceID, 'Illegal Data Value');
                      break;
                  case 4:
                      this.emit('modbus_exception', resp.deviceID, 'Slave Device Failure');
                      break;
                  case 5:
                      this.emit('modbus_exception', resp.deviceID, 'ACKNOWLEDGE');
                      break;
                  case 6:
                      this.emit('modbus_exception', resp.deviceID, 'SLAVE DEVICE BUSY');
                      break;
                  case 7:
                      this.emit('modbus_exception', resp.deviceID, 'NEGATIVE ACKNOWLEDGE');
                      break;
                  case 8:
                      this.emit('modbus_exception', resp.deviceID, 'MEMORY PARITY ERROR');
                      break;
                }
                if(resp.data.get('exception') == 5){
                  //Error code 5 send a retry attemp after 1 second
                  if(req._retriesNumber < slave.maxRetries){            
                    setTimeout(function(){
                      self.netClient.Write(slave.id, req);
                      req._retriesNumber++;
                    }, 1000)
                  }
                  else{
                    //discart request
                    self.emit('response', resp);
                    //elimino la query activa.
                    slave.RemoveRequest(req);
                  }
                }
                else{
                  //discart request
                  self.emit('response', resp);
                  //elimino la query activa.
                  slave.RemoveRequest(req);
                }  
              }
              else{
                /**
                * data event.
                * @event ModbusMaster#data
                * @type {object}
                */
                self.emit('data',id, resp.data);

                /**
                * response event.
                * @event ModbusMaster#data
                * @type {object}
                */
                self.emit('response', resp);
    
                //elimino la query activa.
                slave.RemoveRequest(req);                                     
              }
            }  
          }
          catch (err){                   
            self.emit('error',id, err);
          }
        }
      })  
    }

    /**
    * Make a modbus indication from query object.
    *@param {string} id
    *@param {Object} query    
    *@fires ModbusTCPClient#modbus_exception
    */
    Poll(id, query){
      /*
      let ModbusFunction = 3;

      switch(area){
        case 'holding-registers':
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 'holding':
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 4:
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 'inputs-registers':
            ModbusFunction = 3;
          break;
        case 3:
            ModbusFunction = 3;
          break;
        case 'inputs':
          ModbusFunction = 2;
          break;
        case 1:
          ModbusFunction = 2;
          break;
        case 'coils':
          if(itemsValues == null){
              ModbusFunction = 1;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 5;
            }
            else{
              ModbusFunction = 15;
            }
          }
          break;
        case 0:
          if(itemsValues == null){
              ModbusFunction = 1;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 5;
            }
            else{
              ModbusFunction = 15;
            }
          }
          break;
      }

      switch (ModbusFunction) {
        case 1:
          this.ReadCoilStatus(id, startItem, numberItems);
          break;
        case 2:
          this.ReadInputStatus(id, startItem, numberItems);
          break;
        case 3:
          this.ReadHoldingRegisters(id, startItem, numberItems);
          break;
        case 4:
          this.ReadInputRegisters(id, startItem, numberItems);
          break;
        case 5:
          this.ForceSingleCoil(itemsValues, address, tartItem);
          break;
        case 6:
          this.PresetSingleRegister(itemsValues, address, tartItem);
          break;
        case 15:
          this.ForceMultipleCoils(itemsValues, address, startItem);
          break;
        case 16:
          this.PresetMultipleRegisters(itemsValues, address, startItem);
          break;
        default:
          return false;
          break;

      }
      */
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
        return undefined
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
        return undefined
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
        return undefined
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
        return undefined
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
        return undefined
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
        return undefined
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
      return undefined
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

module.exports = ModbusMaster;

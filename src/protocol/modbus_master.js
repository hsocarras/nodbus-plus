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
        * array with slave's modbus address
        * @type {number[]}
        */
        this.slaveList = new Map();
               
        this._EmitTimeout = function (id){

          let slave = this.slaveList.get(id);

          if(slave.maxRetries == slave._retriesNumber){
            slave.currentRequest = null
            /**
            * timeout event.
            * @event ModbusClient#timeout
            */
            this.emit('timeout', id);
            this.emit('idle', id);
          }
          else{
            this.netClient.Write(id, slave.currentRequest.aduBuffer);
            slave._retriesNumber++;
          }
        }

        this._EmitConnect = function (id){

          let slave = this.slaveList.get(id);
          slave.isReady = true;

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

    }

    /**
     * Function to add a slave object to master's slave list
     * @param {string} id: Slave'id. Should be unique per slave                  *
     * @param {Object} slave: Object {ipaddres, port, timeout, modbus_address}   *  
     */
    AddSlave(id, slave){
      let Slave = {};
      Slave.id = id;
      Slave.modbusAddress = slave.modbusAddress || 247;
      Slave.timeout = slave.timeout || 1000; //timeout in ms
      Slave.serialMode = slave.serialMode || 'rtu';
      Slave.ipAddress = slave.ipAddress || '127.0.0.1';
      Slave.port = slave.port || 502;
      Slave.currentRequest = null;
      Slave.isReady = false;
      Slave.maxRetries = 1;
      Slave._retriesNumber = 0;      
      
      this.slaveList.set(id,Slave);
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

    isReady(id){
      if(this.slaveList.has(id)){
        let slave = this.slaveList.get(id);
        return slave.isReady;
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

    CreateADU(id, pdu){
      //function to be redefined in tcp or serial client
      return pdu
    }

    ParseResponse(id, resp){
      let resp = new PDU(resp);
      try{
        resp.ParseBuffer();
        return this.ParseResponsePDU(id, resp);
      }
      catch(err){
        throw err;
      }
      
    };

    /**
    * extract data for a slave response
    * @param {string} id reference of device.
    * @param {object} responsePDU
    * @return {Object} map Object whit register:value pairs
    * @fires ModbusMaster#modbus_exception {object}
    */
    ParseResponsePDU(id, responsePDU){

        let data = new Map();
        let byteCount = 0;
        let index = 0;
        let offset = 0;
        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        let slave = this.slaveList.get(id);        
        let startItem = slave.currentRequest.pdu.modbus_data.readUInt16BE(0);
        let numberItems = slave.currentRequest.pdu.modbus_data.readUInt16BE(2);
        let key = '';
        let value;
        let timestamp;

        switch(responsePDU.modbus_function){
            case 0x01:
                for(let i = 0; i < numberItems; i++){
                  index = Math.floor(i/8) + 1;
                  offset = i % 8;
                  value = (responsePDU.modbus_data[index] & masks[offset]) ? true : false;
                  key = '0x'.concat((startItem + i).toString());
                  data.set(key, value);
                }
                break;
            case 0x02:
              for(let i = 0; i < numberItems; i++){
                index = Math.floor(i/8) + 1;
                offset = i % 8;
                value = (responsePDU.modbus_data[index] & masks[offset]) ? true : false;
                key = '1x'.concat((startItem + i).toString());
                data.set(key, value);
              }
              break;
            case 0x03:
              for(let i = 0; i < numberItems; i++){
                value = Buffer.alloc(2);
                value[0] = responsePDU.modbus_data[2*i+1];
                value[1] = responsePDU.modbus_data[2*i+2];
                key = '4x'.concat((startItem + i).toString());
                data.set(key, value);
              }
              break;
            case 0x04:
              for(let i = 0; i < numberItems; i++){
                value = Buffer.alloc(2);
                value[0] = responsePDU.modbus_data[2*i+1];
                value[1] = responsePDU.modbus_data[2*i+2];
                key = '3x'.concat((startItem + i).toString());
                data.set(key, value);
              }
              break;
            case 0x05:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              key = '0x'.concat(startItem.toString());

                if(responsePDU.modbus_data[2] == 0xff){
                  value = true;
                }
                else{
                  value = false;
                }
                data.set(key, value);
                break;
            case 0x06:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              key = '4x'.concat(startItem.toString());
              value = Buffer.alloc(2);
              value[0] = responsePDU.modbus_data[2];
              value[1] = responsePDU.modbus_data[3];
              data.set(key, value);
              break;
            case 0x0f:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              numberItems = responsePDU.modbus_data.readUInt16BE(2);
              for(let i = 0; i < numberItems; i++){
                index = Math.floor(i/8);
                offset = i % 8;
                value = (slave.currentRequest.pdu.modbus_data[index + 5] & masks[offset]) ? true : false;
                key = '0x'.concat((startItem + i).toString());
                data.set(key, value);
              }
              break;
            case 0x10:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              numberItems = responsePDU.modbus_data.readUInt16BE(2);
              for(let i = 0; i < numberItems; i++){
                  value = Buffer.alloc(2);
                  value[0] = slave.currentRequest.pdu.modbus_data[2*i+5];
                  value[1] = slave.currentRequest.pdu.modbus_data[2*i+6];
                  key = '4x'.concat((startItem + i).toString());
                  data.set(key, value);
                }
                break;
            case 0x16:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              key = '4x'.concat(startItem.toString());
              let mask = Buffer.alloc(2);
              values = [0, 0];
              mask= responsePDU.modbus_data.readUInt16BE(2);
              values[0] = mask;
              mask= responsePDU.modbus_data.readUInt16BE(4);
              values[1] = mask;
              data.set(key, values);
              break;
            default:
                //modbus exeption
                switch(responsePDU.modbus_data[0]){
                    case 1:
                        this.emit('modbus_exception', id, 'Illegal Function');
                        break;
                    case 2:
                        this.emit('modbus_exception', id, 'Illegal Data Address');
                        break;
                    case 3:
                        this.emit('modbus_exception', id, 'Illegal Data Value');
                        break;
                    case 4:
                        this.emit('modbus_exception', id, 'Slave Device Failure');
                        break;
                    case 5:
                        this.emit('modbus_exception', id, 'Unknow Error');
                        break;
                    case 6:
                        this.emit('modbus_exception', id, 'Unknow Error');
                        break;
                    case 7:
                        this.emit('modbus_exception', id, 'Unknow Error');
                        break;
                    case 8:
                        this.emit('modbus_exception', id, 'Unknow Error');
                        break;
                }
                //devuelvo null
                data = null;
        }
        return data;
    }

    /**
    * extract data for a slave response
    * @param {string} id reference of device.
    * @param {Buffer} resp
    * @fires ModbusMaster#raw_data {buffer} response frame
    * @fires ModbusMaster#data {object} map object whit pair register:values
    * @fires ModbusMaster#error {object}
    */
    ProcessResponse(id, resp){

    let slave = this.slaveList.get(id);

      /**
     * raw_data event.
     * @event ModbusMaster#raw_data
     * @type {object}
     */
      this.emit('raw_data',id, resp);
      
      if(slave.currentRequest){
        try{
          var respData = this.ParseResponse(id, resp);

          if(respData){
            /**
           * data event.
           * @event ModbusMaster#data
           * @type {object}
           */
            this.emit('data',id, respData);

            //elimino la query activa.
            let slave = this.slaveList.get(id);
            slave.currentRequest = null;
            slave._retriesNumber = 0;
            this.emit('idle', id);

          }
          else{
            if(slave.maxRetries > slave._retriesNumber){              
              this.netClient.Write(id, slave.currentRequest.aduBuffer);
              slave._retriesNumber++;
            }
            else{
              //discart request
              slave.currentRequest = null;
              slave._retriesNumber = 0;
              this.emit('error',id, new Error('Unknow Error'));
            }         
          }


        }
        catch (err){
          slave.currentRequest = null;
          
          this.emit('idle', id);
          this.emit('error',id, err);
        }
      }
      
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
        return undefined
      }

      let slave = this.slaveList.get(id);

      //if is enable and there are no active request
       if(slave.isReady && slave.currentRequest == null ){            
            let isSuccesfull
            var pdu = this.CreateRequestPDU(1, startCoil, coilQuantity);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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

         if(slave.isReady && slave.currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(2, startInput, inputQuantity);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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

         if(slave.isReady && slave.currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(3, startRegister, registerQuantity);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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

         if(slave.isReady && slave.currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(4, startRegister, registerQuantity);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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
        if(slave.isReady && slave.currentRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreateRequestPDU(5, startCoil, 1, bufferValue);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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
        return undefined
      }

      let val = Buffer.alloc(2);
      let slave = this.slaveList.get(id);

      if(value >= 0){
        val.writeUInt16BE(value);
      }
      else{
        val.writeInt16BE(value);
      }

      if(slave.isReady && slave.currentRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(6, startRegister, 1, val);
          var adu = this.CreateADU(id, pdu);
          slave.currentRequest = adu;
          slave._retriesNumber = 0;

          isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
          
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

         if(slave.isReady && slave.currentRequest == null){
            //si estoy conectado
            let isSuccesfull
            var pdu = this.CreateRequestPDU(15, startCoil, coilQuantity, valueBuffer);
            var adu = this.CreateADU(id, pdu);
            slave.currentRequest = adu;
            slave._retriesNumber = 0;

            isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
            
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

       if(slave.isReady && slave.currentRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreateRequestPDU(16, startRegister, registerQuantity, valueBuffer);
          var adu = this.CreateADU(id, pdu);
          slave.currentRequest = adu;
          slave._retriesNumber = 0;

          isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
          
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
    

    if(slave.isReady && slave.currentRequest == null){
        //si estoy conectado
        let isSuccesfull;
        var pdu = this.CreateRequestPDU(22, startRegister, 1, val);
        var adu = this.CreateADU(id, pdu);
        slave.currentRequest = adu;
        slave._retriesNumber = 0;

        isSuccesfull = this.netClient.Write(id, adu.aduBuffer);
        
        return isSuccesfull;
    }
    else{
        return false;
    }
  }


}

module.exports = ModbusMaster;

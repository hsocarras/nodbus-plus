/**
** Modbus Master Base Class module.
* @module protocol/modbus-master
* @author Hector E. Socarras.
* @version 0.6.0
*/


const ModbusDevice = require('./modbus_device');
const PDU = require('./pdu');


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
        * conexion status 1 conected, 0 disconnected
        * @type {bool}
        */
        this.isConnected = false;

        /**
        * array with slave's modbus address
        * @type {number[]}
        */
        this.slaveList = [];

        //current modbus request
        this.currentModbusRequest = null;

        this._idleStatus = true;
        Object.defineProperty(self, 'isIddle', {
          get: function(){
            return self._idleStatus
          }
        })

        this._EmitTimeout = function (){

          this.currentModbusRequest = null
          /**
         * timeout event.
         * @event ModbusClient#timeout
         */
          this.emit('timeout');
          this._idleStatus = true;
          this.emit('idle');
        }

        this._EmitConnect = function (target){
            /**
           * connect event.
           * @event ModbusTCPClient#connect
           * @type {object}
           */
            this.emit('connect',target);

            /**
           * ready event.
           * @event ModbusTCPClient#ready
           */
            this.emit('ready');
        }

    }

    /**
    * Build a request PDU
    * @param {number} modbusFunction modbus function
    * @param {startAddres} startAddres starting at 0 address
    * @param {pointsQuantity} pointsQuantity
    * @param {number|Buffer} values values to write
    * @return {Object} PDU object
    */
    CreatePDU(modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values) {

        //chequeando el argumento values
        if(typeof(values) == 'number'){

            let valueBuffer = Buffer.alloc(2);
            valueBuffer.writeUInt16BE(values);

            values = valueBuffer;
        }

        //creando la pdu del request
        var request = new PDU();

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
                  this.emit('modbus_exception','Illegal value on query');
              }
              request.MakeBuffer();
              return request;
              break;
          case 6:
              //creando la pdu del request
              var request = new PDU();
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

    ParseResponse(resp){};

    /**
    * extract data for a slave response
    * @param {object} responsePDU
    * @return {Object} map Object whit register:value pairs
    * @fires ModbusMaster#modbus_exception {object}
    */
    ParseResponsePDU(responsePDU){

        let data = new Map();
        let byteCount = 0;
        let index = 0;
        let offset = 0;
        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        let startItem = this.currentModbusRequest.pdu.modbus_data.readUInt16BE(0);
        let numberItems = this.currentModbusRequest.pdu.modbus_data.readUInt16BE(2);
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
                value = (this.currentModbusRequest.pdu.modbus_data[index + 5] & masks[offset]) ? true : false;
                key = '0x'.concat((startItem + i).toString());
                data.set(key, value);
              }
              break;
            case 0x10:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              numberItems = responsePDU.modbus_data.readUInt16BE(2);
              for(let i = 0; i < numberItems; i++){
                  value = Buffer.alloc(2);
                  value[0] = this.currentModbusRequest.pdu.modbus_data[2*i+5];
                  value[1] = this.currentModbusRequest.pdu.modbus_data[2*i+6];
                  key = '4x'.concat((startItem + i).toString());
                  data.set(key, value);
                }
                break;
            default:
                //modbus exeption
                switch(responsePDU.modbus_data[0]){
                    case 1:
                        this.emit('modbus_exception', 'Illegal Function');
                        break;
                    case 2:
                        this.emit('modbus_exception', 'Illegal Data Address');
                        break;
                    case 3:
                        this.emit('modbus_exception', 'Illegal Data Value');
                        break;
                    case 4:
                        this.emit('modbus_exception', 'Slave Device Failure');
                        break;
                    case 5:
                        this.emit('modbus_exception', 'Unknow Error');
                        break;
                    case 6:
                        this.emit('modbus_exception', 'Unknow Error');
                        break;
                    case 7:
                        this.emit('modbus_exception', 'Unknow Error');
                        break;
                    case 8:
                        this.emit('modbus_exception', 'Unknow Error');
                        break;
                }
                //devuelvo null
                data = null;
        }
        return data;
    }

    /**
    * extract data for a slave response
    * @param {Buffer} resp
    * @fires ModbusMaster#raw_data {buffer} response frame
    * @fires ModbusMaster#data {object} map object whit pair register:values
    * @fires ModbusMaster#error {object}
    */
    ProcessResponse(resp){

      /**
     * raw_data event.
     * @event ModbusMaster#raw_data
     * @type {object}
     */
      this.emit('raw_data',resp);

      if(this.currentModbusRequest){

        try{
          var respData = this.ParseResponse(resp);

          if(respData){
            /**
           * data event.
           * @event ModbusMaster#data
           * @type {object}
           */
            this.emit('data',respData);

            //elimino la query activa.
            this.currentModbusRequest = null;
            this._idleStatus = true;
            this.emit('idle');

          }
          else{
            //implentar retry next version
            this.currentModbusRequest = null;
            this._idleStatus = true;
            this.emit('idle');
          }


        }
        catch (err){
          this.currentModbusRequest = null;
          this._idleStatus = true;
          this.emit('idle');
          this.emit('error', err);
        }
      }
    }

    /**
    * Make a modbus indication from query object
    *@param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;.
    *@param {number} startItem firs address to read or write
    *@param {number} numberItems number of registers to read or write.
    *@param {array|number} itemsValues any of suported force data
    *@fires ModbusTCPClient#modbus_exception
    */
    Poll(address = 1, area = 4, startItem = 0, numberItems = 1, itemsValues = null){
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
          this.ReadCoilStatus(address, startItem, numberItems);
          break;
        case 2:
          this.ReadInputStatus(address, startItem, numberItems);
          break;
        case 3:
          this.ReadHoldingRegisters(address, startItem, numberItems);
          break;
        case 4:
          this.ReadInputRegisters(address, startItem, numberItems);
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
    }

    /**
    * function 01 of modbus protocol
    * @param {number} address modbus address of device.
    * @param {number} startcoil first coil to read, start at 0 coil
    * @param {number} coilQuantity number of coils to read
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ReadCoilStatus(address = 1, startCoil = 0, coilQuantity = 1){

       if(this.isConnected && this.currentModbusRequest == null ){
            //si estoy conectado y no hay query activa
            let isSuccesfull
            var pdu = this.CreatePDU(1, startCoil, coilQuantity);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    };

    /**
    * function 02 of modbus protocol
    * @param {number} address modbus address of device.
    * @param {number} startInput first Input to read, start at 0 coil
    * @param {number} InputQuantity number of Inputs to read
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ReadInputStatus(address = 1, startInput = 0, inputQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreatePDU(2, startInput, inputQuantity);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    }


    /**
    * function 03 of modbus protocol
    * @param {number} address modbus address of device.
    * @param {number} startRegister first holding register to read, start at 0 coil
    * @param {number} registerQuantity number of holding register to read
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ReadHoldingRegisters(address = 1, startRegister = 0, registerQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreatePDU(3, startRegister, registerQuantity);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    }


    /**
    * function 04 of modbus protocol
    * @param {number} address modbus address of device.
    * @param {number} startRegister first input register to read, start at 0 coil
    * @param {number} registerQuantity number of input register to read
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ReadInputRegisters(address = 1, startRegister = 0, registerQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreatePDU(4, startRegister, registerQuantity);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    }


    /**
    * function 05 of modbus protocol
    * @param {number} startcoil first coil to write, start at 0 coil
    * @param {number} address modbus address of device.
    * @param {bool} value value to force
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ForceSingleCoil(value, address = 1, startCoil = 0){
      let bufferValue = Buffer.alloc(2);
      if(value){
        bufferValue[0] = 0xFF;
      }
        if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            let isSuccesfull;
            var pdu = this.CreatePDU(5, startCoil, 1, bufferValue);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    }

    /**
    * function 06 of modbus protocol
    * @param {number} startRegister register to write.
    * @param {number} address modbus address of device.
    * @param {number} value value to force
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    PresetSingleRegister(value, address = 1, startRegister = 0){
      let val = Buffer.alloc(2)
      if(value >= 0){
        val.writeUInt16BE(value);
      }
      else{
        val.writeInt16BE(value);
      }
      if(this.isConnected && this.currentModbusRequest == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreatePDU(6, startRegister, 1, val);
          var adu = this.CreateADU(address, pdu);
          this.currentModbusRequest = adu;

          isSuccesfull = this.netClient.Write(adu.aduBuffer);
          this._idleStatus = false;
          return isSuccesfull;
      }
      else{
          return false;
      }
    }

    /**
    * function 15 of modbus protocol
    * @param {bool[]} forceData array of values to write.
    * @param {number} address modbus address of device.
    * @param {number} startCoil first coil to write, start at 0 coil.
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    ForceMultipleCoils(forceData, address = 1, startCoil = 0){

      let coilQuantity = forceData.length;
      let valueBuffer = Buffer.alloc(Math.floor((coilQuantity - 1)/8)+1);
      let byteTemp = 0x00;
      let offset = 0;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

      for(let i =0; i < coilQuantity; i++){
        if(forceData[i] == true){
          valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] | masks[i%8];
        }
        else {
          valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] & (~masks[i%8]);
        }
      }

         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            let isSuccesfull
            var pdu = this.CreatePDU(15, startCoil, coilQuantity, valueBuffer);
            var adu = this.CreateADU(address, pdu);
            this.currentModbusRequest = adu;

            isSuccesfull = this.netClient.Write(adu.aduBuffer);
            this._idleStatus = false;
            return isSuccesfull;
        }
        else{
            return false;
        }
    }

    /**
    * function 16 of modbus protocol
    * @param {number[]} forceData array whit the values to write
    * @param {number} address modbus address of device.
    * @param {number} startRegister register to write.
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
    PresetMultipleRegisters(forceData, address = 1, startRegister = 0){
      let valueBuffer = Buffer.alloc(0);


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

       if(this.isConnected && this.currentModbusReques == null){
          //si estoy conectado
          let isSuccesfull;
          var pdu = this.CreatePDU(16, startRegister, registerQuantity, valueBuffer);
          var adu = this.CreateADU(address, pdu);
          this.currentModbusRequest = adu;

          isSuccesfull = this.netClient.Write(adu.aduBuffer);
          this._idleStatus = false;
          return isSuccesfull;
      }
      else{
          return false;
      }
    }

    /**
    * function 22 of modbus protocol
    * @param {number} startRegister register to write.
    * @param {number} address modbus address of device.
    * @param {int [16]} value : array with 1 in position that want to be true, 0 on position that
    * want to be false and -1 in position that not to be modified.
    * example register value is [0 1 1 0   1 1 0 0    0 1 1 1   1 0 0 1] 0x9E36
    *         desired value is  [1 0 0 1  -1 0 1 -1  -1 -1 0 0  1 1 -1 0]
    *         result            [1 0 0 1   1 0 1 0    0 1 0 0   1 1 0 0] 0x3259
    * @return {boolean} true if succes, false if not connected, or waiting for response
    */
   MaskHoldingRegister(value, address = 1, startRegister = 0){
    let val = Buffer.alloc(4)
    
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
    
    
    console.log(OR_Mask)
    val.writeUInt16BE(AND_Mask);
    val.writeUInt16BE(OR_Mask, 2);
    

    if(this.isConnected && this.currentModbusRequest == null){
        //si estoy conectado
        let isSuccesfull;
        var pdu = this.CreatePDU(22, startRegister, 1, val);
        var adu = this.CreateADU(address, pdu);
        this.currentModbusRequest = adu;

        isSuccesfull = this.netClient.Write(adu.aduBuffer);
        this._idleStatus = false;
        return isSuccesfull;
    }
    else{
        return false;
    }
  }


}

module.exports = ModbusMaster;

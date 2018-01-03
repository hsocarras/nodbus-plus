/**
** Modbus Master Base Class module.
* @module protocol/modbus-master
* @author Hector E. Socarras.
* @version 0.4.0
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
              request.modbus_data = new Buffer(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 2:
              //funcion 02 read inputs status
              request.modbus_function = 0x02;
              request.modbus_data = new Buffer(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 3:
              //funcion 0x03 leer holdings registers
              request.modbus_function = 0x03;
              request.modbus_data = new Buffer(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 4:
               //funcion 0x04 read input registers
              request.modbus_function = 0x04;
              request.modbus_data = new Buffer(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.MakeBuffer();
              return request;
              break;
          case 5:
               //funcion 05 write single coil
              request.modbus_function = 0x05;
              request.modbus_data = new Buffer(4);
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
              request.modbus_data = new Buffer(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              values.copy(request.modbus_data,2);
              request.MakeBuffer();
              return request;
              break;
          case 15:
              //function 15 force multiples coils
              request.modbus_function = 0x0F;
              //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
              request.modbus_data = new Buffer(5 + values.length);
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
              request.modbus_data = new Buffer(5 + pointsQuantity*2);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.modbus_data[4]= values.length;
              values.copy(request.modbus_data,5);
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

          //elimino la query activa.
          this.currentModbusRequest = null;

          if(respData){
            /**
           * data event.
           * @event ModbusMaster#data
           * @type {object}
           */
            this.emit('data',respData);
          }


        }
        catch (err){
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
          this.emit('modbus-exception' , 'Bad query');
          break;

      }
    }


}

module.exports = ModbusMaster;

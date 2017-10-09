/**
** Modbus Master Base Class module.
* @module protocol/modbus-master.
* @author Hector E. Socarras.
* @version 0.4.0
*/


const ModbusDevice = require('./modbus_device');
const PDU = require('./pdu');
const ExtractDigitalValue = require('./functions/tools').ExtractDigitalValue;

/**
 * Class representing a modbus master.
 * @extends ModbusDevice
*/
module.exports = class ModbusMaster extends ModbusDevice {
  /**
  * Create a Modbus Master.
  */
    constructor(){
        super();

        //conexion status 1 conected, 0 disconnected
        this.isConnected = false;

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
              //request.modbus_data.writeUInt16BE(values,2);
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
    * @param {Buffer} responsePDU
    * @return {Object} map Object whit register:value pairs
    */
    ParseResponsePDU(responsePDU){

        var responsePDU =new PDU(responsePDU);
        responsePDU.ParseBuffer();

        let data = new Map();
        let byteCount = 0;
        let index = 0;
        let offset = 0
        let startItem = this.currentModbusRequest.pdu.modbus_data.readUInt16BE(0);
        let numberItems = this.currentModbusRequest.pdu.modbus_data.readUInt16BE(2);
        let key = '';
        let value;
        let quality;
        let timestamp;

        switch(responsePDU.modbus_function){
            case 0x01:
                for(let i = 0; i < numberItems; i++){
                  index = Math.floor(i/8) + 1;
                  offset = i % 8;
                  value = ExtractDigitalValue(responsePDU.modbus_data[index], offset);
                  quality = 'good';
                  timestamp = Date.now();
                  key = '0x'.concat((startItem + i).toString());
                  data.set(key, {value:value, quality:quality, timestamp:timestamp});
                }
                break;
            case 0x02:
              for(let i = 0; i < numberItems; i++){
                index = Math.floor(i/8) + 1;
                offset = i % 8;
                value = ExtractDigitalValue(responsePDU.modbus_data[index], offset);
                quality = 'good';
                timestamp = Date.now();
                key = '1x'.concat((startItem + i).toString());
                data.set(key, {value:value, quality:quality, timestamp:timestamp});
              }
              break;
            case 0x03:
              for(let i = 0; i < numberItems; i++){
                value = Buffer.alloc(2);
                value[0] = responsePDU.modbus_data[2*i+1];
                value[1] = responsePDU.modbus_data[2*i+2];
                quality = 'good';
                timestamp = Date.now();
                key = '4x'.concat((startItem + i).toString());
                data.set(key, {value:value, quality:quality, timestamp:timestamp});
              }
              break;
            case 0x04:
              for(let i = 0; i < numberItems; i++){
                value = Buffer.alloc(2);
                value[0] = responsePDU.modbus_data[2*i+1];
                value[1] = responsePDU.modbus_data[2*i+2];
                quality = 'good';
                timestamp = Date.now();
                key = '3x'.concat((startItem + i).toString());
                data.set(key, {value:value, quality:quality, timestamp:timestamp});
              }
              break;
            case 0x05:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              key = '0x'.concat(startItem.toString());
              console.log(responsePDU.modbus_data)
                if(responsePDU.modbus_data[2] == 0xff){
                  value = true;
                }
                else{
                  value = false;
                }
                quality = 'good';
                timestamp = Date.now();
                data.set(key, {value:value, quality:quality, timestamp:timestamp});
                break;
            case 0x06:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              key = '4x'.concat(startItem.toString());
              value = Buffer.alloc(2);
              value[0] = responsePDU.modbus_data[2];
              value[1] = responsePDU.modbus_data[3];
              quality = 'good';
              timestamp = Date.now();
              data.set(key, {value:value, quality:quality, timestamp:timestamp});
              break;
            case 0x0f:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              numberItems = responsePDU.modbus_data.readUInt16BE(2);
              for(let i = 0; i < numberItems; i++){
                index = Math.floor(i/8);
                offset = i % 8;
                value = ExtractDigitalValue(this.currentModbusRequest.pdu.modbus_data[index + 5], offset);
                quality = 'good';
                timestamp = Date.now();
                key = '0x'.concat((startItem + i).toString());
                data.set(key, {value:value, quality:quality, timestamp:timestamp});
              }
              break;
            case 0x10:
              startItem = responsePDU.modbus_data.readUInt16BE(0);
              numberItems = responsePDU.modbus_data.readUInt16BE(2);
              for(let i = 0; i < numberItems; i++){
                  value = Buffer.alloc(2);
                  value[0] = this.currentModbusRequest.pdu.modbus_data[2*i+5];
                  value[1] = this.currentModbusRequest.pdu.modbus_data[2*i+6];
                  quality = 'good';
                  timestamp = Date.now();
                  key = '4x'.concat((startItem + i).toString());
                  data.set(key, {value:value, quality:quality, timestamp:timestamp});
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
    */
    ProcessResponse(resp){

      if(this.currentModbusRequest){
        var respData = this.ParseResponse(resp);
        //elimino la queri activa.
        this.currentModbusRequest = null;
        this.emit('raw_data',resp);

        if(respData){
          //Si todo ok emito data
           this.emit('data',respData);
        }
      }
    }

}

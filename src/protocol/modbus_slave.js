/**
** Modbus Slave Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.4.0
*/


const ModbusDevice = require('./modbus_device');
const PDU = require('./pdu');
const Tools = require('./functions/tools');

/**
 * Class representing a modbus slave.
 * @extends ModbusDevice
*/
class ModbusSlave extends ModbusDevice {
  /**
  * Create a Modbus Slave.
  */
    constructor(){
        super();

        var self = this;

        /**
        *Suported functions
        * @type {number[]}
        */
        this.supportedModbusFunctions = [0x01,0x02,0x03,0x04,0x05,0x06,0x0F,0x10];

        //Sellando esta propiedad
        Object.defineProperty(self, 'supportedModbusFunctions',{
          enumerable:true,
          writable:false,
          configurable:false
        });

        /**
        * Registro inputs. En el primer byte se encuentran 0-7 en el segundo 8-14 etc;
        * denttro del mismo byte el bit menos significatico es 0 y el mas significativo es el 7
        * @type {Buffer}
        * @public
        */
        this.inputs =  Buffer.alloc(128);

        /**
        * Registro coils. En el primer byte se encuentran 0-7 en el segundo 8-14 etc;
        * denttro del mismo byte el bit menos significatico es 0 y el mas significativo es el 7
        * @type {Buffer}
        * @public
        */
        this.coils = Buffer.alloc(128);


        /**
        * Registro holdings. Ocupan 2 Bytes. Se transmiten B y B+1 en ese orden
        * @type {Buffer}
        * @public
        */
        this.holdingRegisters =  new Buffer.alloc(2048);

        /**
        * Registro inputs. Ocupan 2 Bytes. Se transmiten B y B+1 en ese orden
        * @type {Buffer}
        * @public
        */
        this.inputRegisters = new Buffer.alloc(2048);


    }

    Start(){

    }

    Stop(){

    }

    /**
    * Build a response PDU
    * @param {Object} PDU protocol data unit
    * @return {Object} PDU protocol data unit
    */
    BuildResponse(pdu) {

        let respPDU = new PDU();

        /** Valid PDU*/
        if(this.AnalizePDU(pdu) == 0){

            switch( pdu.modbus_function ){
                case 0x01:
                    respPDU = this.ReadCoilStatus(pdu);
                break;
                case 0x02:
                    respPDU = this.ReadInputStatus(pdu);
                break;
                case 0x03:
                    respPDU = this.ReadHoldingRegisters(pdu);
                break;
                case 0x04:
                    respPDU = this.ReadInputRegisters(pdu);
                break;
                case 0x05:
                    respPDU = this.ForceSingleCoil(pdu);
                break;
                case 0x06:
                    respPDU = this.PresetSingleRegister(pdu);
                break;
                case 0x0F:
                    respPDU = this.ForceMultipleCoils(pdu);
                break;
                case 0x10:
                    respPDU = this.PresetMultipleRegisters(pdu);
                break;
            }

            respPDU.MakeBuffer();
            return respPDU;
        }
        /** Exception */
        else if(this.AnalizePDU(pdu) == 1){
            respPDU.modbus_function = pdu.modbus_function | 0x80;
            respPDU.modbus_data[0] = 0x01;

            respPDU.MakeBuffer();
            return respPDU;
        }
        /** Bad PDU*/
        else{
          return null
        }

    }

    /**
    * Chech PDU
    * @param {Object} PDU protocol data unit
    * @return {number} Error code. 0-no error, 1-modbus exception, 2-error
    * @fires ModbusSlave#modbus_exeption
    */
    AnalizePDU(pdu){

        var tempPDU = new PDU();

        /**Checks for supported functions*/
        if(this.supportedModbusFunctions.indexOf(pdu.modbus_function) == -1){
          /**
         * modbus_exeption event.
         * @event ModbusSlave#modbus_exeption
         * @type {String}
         */
            this.emit('modbus_exeption',"Illegal Function");

            return 1;
        }
        else {

            if(pdu.modbus_data.length < 4){
              return 2;
            }
            else if (pdu.modbus_function == 15 || pdu.modbus_function == 16) {
              let byteCount = pdu.modbus_data.readUInt8(4);
              if(pdu.modbus_data.length-5 === byteCount){
                return 0;
              }
              else{
                return 2;
              }
            }
            /** Valid PDU. */
            else{
              return 0;
            }
        }

    }

    /**
    * Write Data on slave memory
    * @param {number} value value to be write
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32,  int,  int32,  float,  floatR.
    * @throws {String} description of error
    * @example
    * SetData(25.2, 'float', 'holding-register', 10)
    * // Is the same to use Buffer.writeFloatBE(25.2,10)
    * ModbusSlave.holding-registers.writeFloatBE(25.2,10);
    * @see {@link https://nodejs.org/api/buffer.html}
    */
    SetData(value, area = 'holding-register', offset = 0, dataType = 'uint'){

      if(value == null || value == undefined){
        throw 'Error SetData value argument must be define'
        return
      }

      let memoryArea = null;

      switch(area){
        case 'holding-registers':
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'holding':
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 4:
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'inputs-registers':
          memoryArea = this.inputRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 3:
          memoryArea = this.inputRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'inputs':
          memoryArea = this.inputs;
          if(dataType != 'bool'){
            dataType = 'bool';
            value > 0 ? value = true : value = false;
          }
          break;
        case 1:
          memoryArea = this.inputs;
          if(dataType != 'bool'){
            dataType = 'bool';
            value > 0 ? value = true : value = false;
          }
          break;
        case 'coils':
          memoryArea = this.coils;
          if(dataType != 'bool'){
            dataType = 'bool';
            value > 0 ? value = true : value = false;
          }
          break;
        case 0:
          memoryArea = this.coils;
          if(dataType != 'bool'){
            dataType = 'bool';
            value > 0 ? value = true : value = false;
          }
          break;
          default:
            throw 'invalid address'
            break;
      }

      if(typeof(value) == 'number'|| typeof(value) == 'boolean'){
        switch(dataType){
          case 'bool':
            memoryArea[Math.floor(offset/8)] =Tools.WriteDigitalValue(memoryArea[Math.floor(offset/8)], offset%8, value);
            break;
          case 'uint':
            memoryArea.writeUInt16BE(value,2*offset);
            break;
          case 'uint32':
            memoryArea.writeUInt32BE(value,2*offset);
            Tools.SwapRegister(memoryArea, offset);
            break;
          case 'int':
            memoryArea.writeInt16BE(value,2*offset);
            break;
          case 'int32':
            memoryArea.writeInt32BE(value,2*offset);
            Tools.SwapRegister(memoryArea, offset);
            break;
          case 'float':
            memoryArea.writeFloatBE(value,2*offset);
            Tools.SwapRegister(memoryArea, offset);
            break;
          case 'floatR':
            memoryArea.writeFloatBE(value,2*offset);
            break;
            default:
              throw 'invalid dataType'+ dataType;
              break
        }
      }
      else{
        throw 'value not suported'
      }

    }

    /**
    * Read Data on slave memory    *
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32,  int,  int32,  float,  double.
    * @example
    * //return 25.2
    * ReadData('4', 10, 'float');
    * // Is the same to use Buffer.readloatBE(10)
    * ModbusSlave.holding-registers.readFloatBE(10);
    * @see {@link https://nodejs.org/api/buffer.html}
    */
    ReadData(area = 'holding-register', offset = 0, dataType = 'uint'){
      /*
      *@param {number or array} value values to write in server memory for use app
      */

      let memoryArea = null;
      let value = null;
      let tempBuffer = Buffer.alloc(4);

      switch(area){
        case 'holding-registers':
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'holding':
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 4:
          memoryArea = this.holdingRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'inputs-registers':
          memoryArea = this.inputRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 3:
          memoryArea = this.inputRegisters;
          if(dataType == 'bool'){
            dataType = 'uint8';
          }
          break;
        case 'inputs':
          memoryArea = this.inputs;
          if(dataType != 'bool'){
            dataType = 'bool';
          }
          break;
        case 1:
          memoryArea = this.inputs;
          if(dataType != 'bool'){
            dataType = 'bool';
          }
          break;
        case 'coils':
          memoryArea = this.coils;
          if(dataType != 'bool'){
            dataType = 'bool';
          }
          break;
        case 0:
          memoryArea = this.coils;
          if(dataType != 'bool'){
            dataType = 'bool';
          }
          break;
      }

      switch(dataType){
          case 'bool':
            value = Tools.ExtractDigitalValue(memoryArea[Math.floor(offset/8)], offset%8);
            break;
          case 'uint':
            value = memoryArea.readUInt16BE(2*offset);
            break;
          case 'uint32':
            memoryArea.copy(tempBuffer, 0, 2*offset, 2*offset + 4);
            Tools.SwapRegister(tempBuffer);
            value = tempBuffer.readUInt32BE();
            break;
          case 'int':
            value = memoryArea.readInt16BE(2*offset);
            break;
          case 'int32':
            memoryArea.copy(tempBuffer, 0, 2*offset, 2*offset + 4);
            Tools.SwapRegister(tempBuffer);
            value = tempBuffer.readInt32BE();
            break;
          case 'float':
            memoryArea.copy(tempBuffer, 0, 2*offset, 2*offset + 4);
            Tools.SwapRegister(tempBuffer);
            value = tempBuffer.readFloatBE();
            break;
          case 'floatR':
            value = memoryArea.readFloatBE(2*offset);
            break;
          default:
            throw 'invalid dataType'+ dataType;
            break

        }

        return value;

    }
}

/**
* Procesesing modbus function 01 indication.
* @private
*/
ModbusSlave.prototype.ReadCoilStatus = require('./functions/Read_Coil_Status');

/**
* Procesesing modbus function 02 indication.
* @private
*/
ModbusSlave.prototype.ReadInputStatus = require('./functions/Read_Input_Status');

/**
* Procesesing modbus function 03 indication.
* @private
*/
ModbusSlave.prototype.ReadHoldingRegisters = require('./functions/Read_Holding_Registers');

/**
* Procesesing modbus function 04 indication.
* @private
*/
ModbusSlave.prototype.ReadInputRegisters = require('./functions/Read_Input_Registers');

/**
* Procesesing modbus function 05 indication.
* @private
*/
ModbusSlave.prototype.ForceSingleCoil = require('./functions/Force_Single_Coil');

/**
* Procesesing modbus function 06 indication.
* @private
*/
ModbusSlave.prototype.PresetSingleRegister = require('./functions/Preset_Single_Register');

/**
* Procesesing modbus function 15 indication.
* @private
*/
ModbusSlave.prototype.ForceMultipleCoils = require('./functions/Force_Multiple_Coils');

/**
* Procesesing modbus function 16 indication.
* @private
*/
ModbusSlave.prototype.PresetMultipleRegisters = require('./functions/Preset_Multiple_Registers');


module.exports = ModbusSlave;

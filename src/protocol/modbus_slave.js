/**
** Modbus Slave Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.4.0
*/


const ModbusDevice = require('./modbus_device');
const BooleanRegister = require('./boolean_register');
const WordRegister = require('./word_register');


/**
 * Class representing a modbus slave.
 * @extends ModbusDevice
*/
class ModbusSlave extends ModbusDevice {
  /**
  * Create a Modbus Slave.
  */
    constructor(modbusAddress = 1){
        super();

        var self = this;

        /**
        *Suported functions
        * @type {number[]}
        */
        this.supportedModbusFunctions = [0x01,0x02,0x03,0x04,0x05,0x06,0x0F,0x10, 0x16];

        //Sellando esta propiedad
        Object.defineProperty(self, 'supportedModbusFunctions',{
          enumerable:true,
          writable:false,
          configurable:false
        });

        /**
        * modbus address. Value between 1 and 247
        * @type {number}
        ** @throws {RangeError}
        */
        this.mAddress = modbusAddress;
        Object.defineProperty(self, 'modbusAddress',{
          get: function(){
            return self.mAddress;
          },
          set: function(address){
            if(address >= 1 && address <= 247){
              self.mAddress = address
            }
            else{
              throw new RangeError('Address must be a value fron 1 to 247', 'modbus_slave.js', '55');
            }
          }
        })

        /**
        * Inputs. Reference 1x;
        * @type {Object}
        * @public
        */
        this.inputs =  new BooleanRegister();

        /**
        * Registro coils. En el primer byte se encuentran 0-7 en el segundo 8-14 etc;
        * denttro del mismo byte el bit menos significatico es 0 y el mas significativo es el 7
        * @type {Object}
        * @public
        */
        this.coils = new BooleanRegister();


        /**
        * Registro holdings.
        * @type {Object}
        * @public
        */
        this.holdingRegisters =  new WordRegister();

        /**
        * Registro inputs. Ocupan 2 Bytes. Se transmiten B y B+1 en ese orden
        * @type {Buffer}
        * @public
        */
        this.inputRegisters = new WordRegister();


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
      
        let respPDU = this.CreatePDU();

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
                case 0x16:
                    respPDU = this.MaskHoldingRegister(pdu);
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

        var tempPDU = this.CreatePDU();

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
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32, int,  int32, float,  double.
    * @throws {String} description of error
    * @example
    * SetData(25.2, 'float', 'holding-register', 10);
    */
    SetData(value, area = 'holding-register', dataAddress = 0, dataType = 'uint'){
      
      if(value == null || value == undefined){
        throw 'Error SetData value argument must be define'
        return
      }

      let memoryArea = null;

      let buff32 = Buffer.alloc(4);
      let buff64 = Buffer.alloc(8);

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
        let val = Buffer.alloc(2);
        switch(dataType){
          case 'bool':            
            val[0] = value ? 1 : 0;
            if(memoryArea. WriteData != 'undefined'){
              memoryArea. WriteData(value, dataAddress);
            }
            else{
              memoryArea.SetRegister(val, dataAddress);
            }            
            break;
          case 'uint':                   
            val.writeUInt16LE(value)
            memoryArea.SetRegister(val, dataAddress);
            break;
          case 'uint32':
            buff32.writeUInt32LE(value);
            memoryArea.SetRegister(buff32.slice(0,2), dataAddress);
            memoryArea.SetRegister(buff32.slice(2), dataAddress + 1);
            break;
          case 'int':            
            val.writeInt16LE(value)
            memoryArea.SetRegister(val, dataAddress);
            break;
          case 'int32':
          buff32.writeInt32LE(value);
          memoryArea.SetRegister(buff32.slice(0,2), dataAddress);
          memoryArea.SetRegister(buff32.slice(2), dataAddress + 1);
            break;
          case 'float':
          buff32.writeFloatLE(value);
          memoryArea.SetRegister(buff32.slice(0,2), dataAddress);
          memoryArea.SetRegister(buff32.slice(2), dataAddress + 1);
            break;
          case 'double':
          buff64.writeDoubleLE(value);
          memoryArea.SetRegister(buff64.slice(0,2), dataAddress);
          memoryArea.SetRegister(buff64.slice(2, 4), dataAddress + 1);
          memoryArea.SetRegister(buff64.slice(4, 6), dataAddress + 2);
          memoryArea.SetRegister(buff64.slice(6), dataAddress + 3);
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
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32, int,  int32, float,  double.
    * @example
    * //return 25.2
    * GetData('4', 10, 'float');
    */
    GetData(area = 'holding-register', dataAddress = 0, dataType = 'uint'){
      /*
      *@param {number or array} value values to write in server memory for use app
      */

      let memoryArea = null;
      let value = null;

      let buff32 = Buffer.alloc(4);
      let buff64 = Buffer.alloc(8);

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
            if(memoryArea.ReadData != 'undefined'){
              value = memoryArea.ReadData(dataAddress)
            }
            else{
              value = memoryArea.GetRegister(dataAddress).readUInt16LE > 0 ? true : false;
            }            
            break;
          case 'uint':
            value = memoryArea.GetRegister(dataAddress).readUInt16LE();
            break;
          case 'uint32':
            memoryArea.GetRegister(dataAddress).copy(buff32, 0);
            memoryArea.GetRegister(dataAddress + 1).copy(buff32, 2);
            value = buff32.readUInt32LE();
            break;
          case 'int':
            value = memoryArea.GetRegister(dataAddress).readInt16LE();;
            break;
          case 'int32':
            memoryArea.GetRegister(dataAddress).copy(buff32, 0);
            memoryArea.GetRegister(dataAddress + 1).copy(buff32, 2);
            value = buff32.readInt32LE();
            break;
          case 'float':
            memoryArea.GetRegister(dataAddress).copy(buff32, 0);
            memoryArea.GetRegister(dataAddress + 1).copy(buff32, 2);
            value = buff32.readFloatLE();
            break;
          case 'double':
            memoryArea.GetRegister(dataAddress).copy(buff64, 0);
            memoryArea.GetRegister(dataAddress + 1).copy(buff64, 2);
            memoryArea.GetRegister(dataAddress + 2).copy(buff64, 4);
            memoryArea.GetRegister(dataAddress + 3).copy(buff64, 6);
            value = buff64.readDoubleLE();
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

/**
* Procesesing modbus function 22 indication.
* @private
*/
ModbusSlave.prototype.MaskHoldingRegister = require('./functions/Mask_Holding_Register');


module.exports = ModbusSlave;

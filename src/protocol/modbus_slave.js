/**
** Modbus Slave Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.4.0
*/


const EventEmitter = require('events');
const PDU = require('./pdu');
const BooleanRegister = require('./server_utils/boolean_register');
const WordRegister = require('./server_utils/word_register');
const TcpADU = require('./tcp_adu');
const SerialADU = require('./serial_adu');
const Utils = require('./server_utils/util');
const SlaveFunctions = require('./server_utils/slave_functions');

/**
 * Class representing a modbus slave.
 * @extends ModbusDevice
*/
class ModbusSlave extends EventEmitter {
  /**
  * Create a Modbus Slave.
  */
    constructor(mode = 'rtu', mb_server_cfg){
        super();

        var self = this;

        const _TransmitionMode = mode;
        Object.defineProperty(self, 'transmitionMode',{
            get: function(){
              return  _TransmitionMode;
            }
        })

        /**
        * server's modbus functions code supported 
        * @type {set object}
        *
        */
        const internalFunctionCode = SlaveFunctions.GetSuportedMBFunctionscode(_TransmitionMode);
        Object.defineProperty(self, 'supportedFunctionsCode',{
            get: function(){
              return internalFunctionCode;
            }
        })
        
        /**
        * server's local functions code 
        * @type {set object}
        *
        */
        this.localProcessingService = internalFunctionCode;

        /**
        * server's extrenal functions code 
        * @type {set object}
        *
        */
        this.externalProcessingService = mb_server_cfg.externalProcessingService;

        let _endianness 
        Object.defineProperty(self, 'endianness',{
          get: function(){
            return _endianness;
          },
          set: function(endianness){
            if(endianness == 'BE'){
             _endianness = 'BE';             
            }
            else{
              _endianness = 'LE';              
            }
          }
        })
        this.endianness = mb_server_cfg.endianness || "LE";

        /**
        * Inputs. Reference 1x;
        * @type {Object}
        * @public
        */
        this.inputs =  new BooleanRegister(1);

        /**
        * Registro coils. En el primer byte se encuentran 0-7 en el segundo 8-14 etc;
        * denttro del mismo byte el bit menos significatico es 0 y el mas significativo es el 7
        * @type {Object}
        * @public
        */
        this.coils = new BooleanRegister(0);


        /**
        * Registro holdings.
        * @type {Object}
        * @public
        */
        this.holdingRegisters =  new WordRegister(4, 2048);

        /**
        * Registro inputs. Ocupan 2 Bytes. Se transmiten B y B+1 en ese orden
        * @type {Buffer}
        * @public
        */
        this.inputRegisters = new WordRegister(3, 2048);          
        

    }  
    
    /**
     * Function to check if modbus function code is supported
     * @param {object} mb_req_pdu 
     * @param {bool} local local processing, default true
     * @return true if does otherwise false
     */
    ValidateRequestPDU(mb_req_pdu, local = true){

      //Validating Max length of pdu
      if(mb_req_pdu.pduBuffer.length <= PDU.MaxLength){
          //Validating restricted function code
          if(mb_req_pdu.modbus_function > 0 && mb_req_pdu.modbus_function <= 127){
              //validating function code
              if(local){
                  if(this.localProcessingService.has(mb_req_pdu.modbus_function)){
                    return true
                  }
                  else{                                  
                    return false;
                }
              }
              else{
                  if(this.externalProcessingService.has(mb_req_pdu.modbus_function)){
                    return true
                  }              
                  else{                                  
                      return false;
                  }
              }              
          }
          else{
              return false;
          }
      }
      else {
        return false;
      }
    }

    /**
    * Implement activity diagram service processing 
    * See Modbus Message implementation Guide v1.0b InterfaceIndicationMsg Fig 17
    * @param {Object PDU} mb_req_pdu protocol data unit    
    * @return {Promise}  that resolve with PDU response
    */
    MBServiceProcessing(mb_req_pdu){
        var self = this;

        let respPDU

        if(this.localProcessingService.has(mb_req_pdu.modbus_function)){
            //local processing
            respPDU = self.BuildResponsePDULocal(mb_req_pdu);
            
        }
        else{
            //external processing
            respPDU = self.BuildResponsePDUExternal(mb_req_pdu);            
        }

        return respPDU;
    }

    /**
    * Build a response PDU with local processing
    * @param {Object PDU} mb_req_pdu protocol data unit
    * @fires  ModbusSlave#mb_exception
    * @fires  ModbusSlave#mb_register_writed
    * @return {Object} PDU protocol data unit
    */
    BuildResponsePDULocal(mb_req_pdu) {

        let self = this;
        let respPDU = new PDU();
            
        if(this.ValidateRequestPDU(mb_req_pdu)){
            switch( mb_req_pdu.modbus_function ){
              case 0x01:
                  respPDU = SlaveFunctions.ReadCoilStatus.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x02:
                  respPDU = SlaveFunctions.ReadInputStatus.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x03:
                  respPDU = SlaveFunctions.ReadHoldingRegisters.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x04:
                  respPDU = SlaveFunctions.ReadInputRegisters.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x05:
                  respPDU = SlaveFunctions.ForceSingleCoil.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x06:
                  respPDU = SlaveFunctions.PresetSingleRegister.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x0F:
                  respPDU = SlaveFunctions.ForceMultipleCoils.call(self, mb_req_pdu.modbus_data);
              break;
              case 0x10:                    
                  respPDU = SlaveFunctions.PresetMultipleRegisters.call(self, mb_req_pdu.modbus_data);
                  break;
              case 0x16:                    
                  respPDU = SlaveFunctions.MaskHoldingRegister.call(self, mb_req_pdu.modbus_data);
              break;
              default:
                  respPDU = this.BuildModbusException(mb_req_pdu.modbus_function, 1); 
                  respPDU.MakeBuffer(); 
                  return rspPDU;                                                              
                
            }

            respPDU.MakeBuffer(); 
            return respPDU;
        }
        //reply modbus exception 1
        else{ 
            respPDU = this.BuildModbusException(mb_req_pdu.modbus_function, 1); 
            respPDU.MakeBuffer(); 
            return respPDU;
        }

    }

    /**
    * Build a response PDU with remote processing
    * @param {Object PDU} mb_req_pdu protocol data unit
    * @fires  ModbusSlave#mb_exception
    * @fires  ModbusSlave#mb_register_writed
    * @return {Object} PDU protocol data unit
    */
    async BuildResponsePDUExternal(mb_req_pdu) {

        let self = this;

        if(this.ValidateRequestPDU(mb_req_pdu, false)){

            let respPDU = new PDU();
            let computedHookFunctionName = "mbFunctionCode" + mb_req_pdu.modbus_function.toString() + "Hook";    

            if(this[computedHookFunctionName] !== undefined && this[computedHookFunctionName] instanceof Function){

              let startingAddress = mb_req_pdu.modbus_data.readUInt16BE(0);
              let numberOfCoils =   mb_req_pdu.modbus_data.readUInt16BE(2);

              //return promise that resolve with object {error: 0, data: buffer}
              let respUserApp =  await this.readCoilsHook(startingAddress, numberOfCoils);

              if(respUserApp.error == 0){
                  respPDU.modbus_function =  mb_req_pdu.modbus_function;
                  respPDU.modbus_data = respUserApp.data;
              }
              else{
                respPDU = this.BuildModbusException(mb_req_pdu.modbus_function, respUserApp.data[0]);
              }
            }
            else{
              respPDU = this.BuildModbusException(mb_req_pdu.modbus_function, 1);
            } 
        }
        //reply modbus exception 1
        else{ 
            respPDU = this.BuildModbusException(mb_req_pdu.modbus_function, 1); 
            respPDU.MakeBuffer(); 
            return respPDU;
        }

    }
    
    /**
    * Build a modbus exception response PDU
    * @param {number} modbus_function modbus function code
    * @param {number} exception_code code of modbus exception
    * @fires  ModbusSlave#mb_exception
    * @return {Object} PDU protocol data unit
    */
    BuildModbusException(modbus_function, exception_code){
      return SlaveFunctions.MakeModbusException.call(this, modbus_function, exception_code);
    }

    

    /**
    * Write Data on slave memory from user app
    * @param {number | string} value value to be write
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;    
    * @return {bool} true if success
    * @example
    * SetRegisterValue(25.2, 'holding-register', 10);
    */
    SetRegisterValue(value, area = 'holding-register', dataAddress = 0){
      
      
      let memoryArea = null;
      let registerValue;

      switch(area){
        case 'holding-registers':
          memoryArea = this.holdingRegisters;          
          break;
        case 'holding':
          memoryArea = this.holdingRegisters;          
          break;
        case 4:
          memoryArea = this.holdingRegisters;          
          break;
        case 'inputs-registers':
          memoryArea = this.inputRegisters;          
          break;
        case 3:
          memoryArea = this.inputRegisters;          
          break;
        case 'inputs':
          memoryArea = this.inputs;          
          break;
        case 1:
          memoryArea = this.inputs;          
          break;
        case 'coils':
          memoryArea = this.coils;          
          break;
        case 0:
          memoryArea = this.coils;          
          break;
          default:
            return false;
            break;
      }

      registerValue = Utils.GetBufferFromValue(value, this.endianness);
      
      if(registerValue){
          return memoryArea.SetValue(registerValue, dataAddress);
      }
      else {
          return false;
      }
      
     

    }

    /**
    * Read Data on slave memory    *
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32, uint64, int,  int32, int64, float,  double and string.
    * @example
    * //return 25.2
    * GetRegisterValue('4', 10, 'float');
    */
    GetRegisterValue(area = 'holding-register', dataAddress = 0, dataType = 'uint16', strLength = 10){
      /*
      *@param {number or array} value values to write in server memory for use app
      */

      let memoryArea = null;
      let buffValue = null;
      
            
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
        case 'int32':
            buffValue = memoryArea.GetValue(dataAddress, 2);
            break; 
        case 'uint32':
            buffValue = memoryArea.GetValue(dataAddress, 2); 
            break;
        case 'int64':
            buffValue = memoryArea.GetValue(dataAddress, 4); 
            break;
        case 'uint64':
            buffValue = memoryArea.GetValue(dataAddress, 4);
            break;         
        case 'float':
            buffValue = memoryArea.GetValue(dataAddress, 2);
            break;
        case 'double':
            buffValue = memoryArea.GetValue(dataAddress, 4);
            break;
      case 'string':
            let registerCount = Math.ceil(strLength/2); 
            buffValue = memoryArea.GetValue(dataAddress, registerCount);
            buffValue = buffValue.slice(0,strLength);
            break;
      default:
          buffValue = memoryArea.GetValue(dataAddress, 1);              
      }

      return Utils.GetValueFromBuffer(buffValue, dataType, this.endianness);

    }
    
}

ModbusSlave.prototype.MakeModbusException = SlaveFunctions.MakeModbusException;

module.exports = ModbusSlave;

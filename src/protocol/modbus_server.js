/**
* Modbus Slave Base Class module. Can only deal with modbus PDU.
* Implement the base class for a modbus server stack.
* @module protocol/modbus-server
* @author Hector E. Socarras.
* @version 1.0.0
*/


const EventEmitter = require('events');
const PDU = require('./pdu');
const BooleanRegister = require('./server_utils/boolean_register');
const WordRegister = require('./server_utils/word_register');
const Utils = require('./server_utils/util');
const SlaveFunctions = require('./server_utils/slave_functions');

/**
 * Class representing a modbus slave.
 * @extends EventEmitter
*/
class ModbusSlave extends EventEmitter {
    /**
    * Create a Modbus Basic server.
    * @param {object} mb_server_cfg - Configuration object, must have the following properties:
    * {
    *   endianness : {string} - endianess used for data representation. Acepted values 'BE', 'big', 'big-endian' for big endian or 'LE', 'little', 'little-endian' for little endian representation.
    *   inputs : {buffer} buffer to store inputs with 8 inputs per byte
    *   coils : {buffer} buffer to store coils with 8 coils per byte
    *   holdingRegisters : {buffer} buffer to store holding registers with 2 bytes per register
    *   inputRegisters : {buffer} buffer to store input registers with 2 bytes per register
    * }
    */
    constructor(mb_server_cfg){
        super();

        var self = this;
        
        /**
        * Get server's modbus functions code supported 
        * @return {set object} a set objects with funcion codes suported for the server
        *
        */
        this._internalFunctionCode = new Map();
        this._internalFunctionCode.set(1, this.MBFunctionCode01)
        Object.defineProperty(self, 'supportedFunctionsCode',{
            get: function(){
              return this._internalFunctionCode.keys();
            }
        })
        

        
        /**
         * Endiannes format for data representation on server's internal registers
         * @type {string}
         */
        let _endianness 
        Object.defineProperty(self, 'endianness',{
          get: function(){
            return _endianness;
          },
          set: function(endianness){
              switch (endianness){
                  case 'BE':
                      _endianness = 'BE';
                      break;
                  case 'big':
                      _endianness = 'BE';
                      break;
                  case 'big-endian':
                      _endianness = 'BE';
                      break;
                  case 'LE':
                      _endianness = 'LE'; 
                      break;
                  case 'little':  
                      _endianness = 'LE'; 
                      break;
                  case 'little-endian':
                      _endianness = 'LE'; 
                      break;
                  default:
                      _endianness = 'LE'; 
                      break;
              }
          }
        })
        this.endianness = mb_server_cfg.endianness || "LE";

        /**
        * Inputs. Reference 1x.
        * @type {Buffer}
        * @public
        */
        this.inputs =  mb_server_cfg.inputs || Buffer.alloc(256);

        /**
        * Coils. Reference 0x        
        * @type {buffer}
        * @public
        */
        this.coils = mb_server_cfg.coils || Buffer.alloc(256);


        /**
        * Holding Registers.
        * @type {Object}
        * @public
        */
        this.holdingRegisters =   mb_server_cfg.holdingRegisters || Buffer.alloc(4096);

        /**
        * Input Registers.
        * @type {Buffer}
        * @public
        */
        this.inputRegisters = mb_server_cfg.inputRegisters || Buffer.alloc(4096);         
        

    }  

     /**
    * Main frontend server function. Entry point for client request. Process request pdu, execute de service and return a response pdu.
    * @param {Buffer} mb_req_pdu_buffer buffer containing a protocol data unit
    * @fires  ModbusSlave#mb_exception
    * @fires  ModbusSlave#mb_register_writed
    * @return {Buffer} buffer containing a protocol data unit
    */
     ProcessReqPdu(req_pdu_buffer) {

      let self = this;
      let function_code = req_pdu_buffer[0];      
      
      //Check for function code
      if(this._internalFunctionCode.has(function_code)){

          //gets pdu data
          let req_pdu_data = Buffer.alloc(req_pdu_buffer.length - 1);
          req_pdu_buffer.copy(req_pdu_data,0,1);

          ServExecFunction = this._internalFunctionCode.get(function_code);      //get de function code prossesing function
          let res_pdu_data = ServExecFunction(req_pdu_data);                     //execute service procesing

          var res_pdu_buffer = Buffer.alloc(res_pdu_data.length + 1);           //creating response pdu buffer
          res_pdu_buffer[0] = function_code;
          res_pdu_data.copy(req_pdu_buffer, 1);     
         
          return res_pdu_buffer;
      }        
      else{ 
          //reply modbus exception 1
          res_pdu_buffer = this.BuildExceptionResPdu(function_code, 1);           
          return res_pdu_buffer;
      }

  }    
    
    
    /**
    * Build a modbus exception response PDU
    * @param {number} mb_function_code modbus function code
    * @param {number} exception_code code of modbus exception
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} Exception response pdu
    */
    BuildExceptionResPdu(modbus_function, exception_code){
      
        //setting modbus function to exception
        let excep_function_code = mb_function_code | 0x80;
        //setting exeption code
        let excep_res_buffer = Buffer.alloc(2);
        excep_res_buffer[0] = excep_function_code;
        excep_res_buffer[1] = exception_code;
    
        switch(exception_code){
            case 1:            
                this.emit('mb_exception', modbus_function, 'ILLEGAL FUNCTION');  
            break;
            case 2:
                this.emit('mb_exception', modbus_function, 'ILLEGAL DATA ADDRESS');
                break;
            case 3:
                this.emit('mb_exception', modbus_function, 'ILLEGAL DATA VALUE');
                break;
            case 4:
                this.emit('mb_exception', modbus_function, 'SLAVE DEVICE FAILURE');
                break;
            case 5:
                this.emit('mb_exception', modbus_function, 'ACKNOWLEDGE');
                break;
            case 6:
                this.emit('mb_exception', modbus_function, 'SLAVE DEVICE BUSY');
                break;            
            case 8:
                this.emit('mb_exception', modbus_function, 'MEMORY PARITY ERROR');
                break;
            case 0x0A:
                this.emit('mb_exception', modbus_function, 'GATEWAY PATH UNAVAILABLE');
                break;
            case 0x0B:
                this.emit('mb_exception', modbus_function, 'GATEWAY TARGET DEVICE FAILED TO RESPOND');
                break;
        }

        return excep_res_buffer;
    }

    /**
    * Function to implement Read Coil stauts service on server.
    * @param {buffer}  pdu_req_data buffer containing only data from a requet pdu    
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} Exception response pdu
    */
    MBFunctionCode01(pdu_req_data){

      //registers to read
      let numberOfRegister =   pdu_req_data.readUInt16BE(2);

      //Validating Data Value. Max number of coils to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
      if(numberOfRegister >=1 && numberOfRegister <= 2000 && pdu_req_data.length == 4){        
          //initial register. Example coil 20 addressing as 0x13 (19)
          let startingAddress = pdu_req_data.readUInt16BE(0);      
          
          //Validating data address
          if(startingAddress + numberOfRegister < this.coils.size ){           
              let execPduStatus = ReadBoolRegister(rspPDU, this.coils, startingAddress, numberOfRegister);
              if(execPduStatus){
                  return rspPDU;
              }
              else{
                  return MakeModbusException.call(this, FUNCTION_CODE, 4);
              }
          }
          //Making modbus exeption 2
          else{
              return MakeModbusException.call(this, FUNCTION_CODE, 2);
          }
      }
      //Making modbus exeption 3
      else{
          return MakeModbusException.call(this, FUNCTION_CODE, 3);
      }

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

/**
* Modbus Slave Base Class module. Can only deal with modbus PDU.
* Implement the base class for a modbus server stack.
* @module protocol/modbus-server
* @author Hector E. Socarras.
* @version 1.0.0
*/


import EventEmitter from 'events';

//define max number of coil, inputs or register
const MAX_ITEM_NUMBER = 65535;
const MAX_BOOLEAN_ADDRESS_SIZE = 8192;
const MAX_WORD_ADDRESS_SISE = 131070;

/**
 * Class representing a modbus slave.
 * @extends EventEmitter
*/
class ModbusSlave extends EventEmitter {
    /**
    * Create a Modbus Basic server.
    * @param {object} mbServerCfg - Configuration object, must have the following properties:
    * {
    *   endianness : {string} - endianess used for data representation. Acepted values 'BE', 'big', 'big-endian' for big endian or 'LE', 'little', 'little-endian' for little endian representation.
    *   inputs : {int} buffer zise to store inputs with 8 inputs per byte, 0 means that imputs uses same buffer thar input registers.
    *   coils : {int} buffer zise to store coils with 8 coils per byte, 0 means that coils uses same buffer thar coils registers.
    *   holdingRegisters : {int} buffer size to store holding registers with 2 bytes per register
    *   inputRegisters : {int} buffer size to store input registers with 2 bytes per register
    * }
    */
    constructor(mbServerCfg){
        super();

        var self = this;
        
        /**
        * Get server's modbus functions code supported 
        * @return {set object} a set objects with funcion codes suported for the server
        *
        */
        this._internalFunctionCode = new Map();
        this._internalFunctionCode.set(1, this.readCoilStatusService);
        this._internalFunctionCode.set(2, this.readInputStatusService);
        this._internalFunctionCode.set(3, this.readHoldingRegistersService);
        Object.defineProperty(self, 'supportedFunctionCode',{
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
        this.endianness = mbServerCfg.endianness || "LE";

        /**
        * Inputs. Reference 1x.
        * @type {Buffer}
        * @public
        */
        if(mbServerCfg.inputs <= MAX_BOOLEAN_ADDRESS_SIZE & mbServerCfg.inputs > 0){
            this.inputs =  Buffer.alloc(mbServerCfg.inputs);
        }
        else if(mbServerCfg.inputs >= MAX_BOOLEAN_ADDRESS_SIZE){
            this.inputs =  Buffer.alloc(MAX_BOOLEAN_ADDRESS_SIZE);
        }
        else if (mbServerCfg.inputs <= 0){
            this.inputs =  this.inputRegisters;
        }
        else{
            this.inputs =  Buffer.alloc(256);
        }


        /**
        * Coils. Reference 0x        
        * @type {buffer}
        * @public
        */
        if(mbServerCfg.coils <= MAX_BOOLEAN_ADDRESS_SIZE & mbServerCfg.coils > 0){
            this.coils =  Buffer.alloc(mbServerCfg.coils);
        }
        else if(mbServerCfg.coils >= MAX_BOOLEAN_ADDRESS_SIZE){
            this.coils =  Buffer.alloc(MAX_BOOLEAN_ADDRESS_SIZE);
        }
        else if (mbServerCfg.coils <= 0){
            this.coils =  this.holdingRegisters;
        }
        else{
            this.coils =  Buffer.alloc(256);
        }

        /**
        * Holding Registers.
        * @type {Object}
        * @public
        */
        if(mbServerCfg.holdingRegisters <= MAX_WORD_ADDRESS_SISE & mbServerCfg.holdingRegisters > 0){
          this.holdingRegisters =  Buffer.alloc(mbServerCfg.holdingRegisters);
        }
        else if(mbServerCfg.holdingRegisters >= MAX_WORD_ADDRESS_SISE){
            this.holdingRegisters =  Buffer.alloc(MAX_WORD_ADDRESS_SISE);
        }       
        else{
            this.holdingRegisters =  Buffer.alloc(4096);
        }

        /**
        * Input Registers.
        * @type {Buffer}
        * @public
        */
        if(mbServerCfg.inputRegisters <= MAX_WORD_ADDRESS_SISE & mbServerCfg.inputRegisters > 0){
          this.inputRegisters =  Buffer.alloc(mbServerCfg.inputRegisters);
        }
        else if(mbServerCfg.inputRegisters >= MAX_WORD_ADDRESS_SISE){
            this.inputRegisters =  Buffer.alloc(MAX_WORD_ADDRESS_SISE);
        }       
        else{
            this.inputRegisters =  Buffer.alloc(4096);
        }         
        

    }  

     /**
    * Main frontend server function. Entry point for client request. Process request pdu, execute de service and return a response pdu.
    * @param {Buffer} reqPduBuffe buffer containing a protocol data unit
    * @fires  ModbusSlave#mb_exception
    * @fires  ModbusSlave#mb_register_writed
    * @return {Buffer} buffer containing a protocol data unit
    */
     processReqPdu(reqPduBuffer) {

      let self = this;
      let functionCode = reqPduBuffer[0];      
      
      //Check for function code
      if(this._internalFunctionCode.has(functionCode)){

          //gets pdu data
          let reqPduData = Buffer.alloc(reqPduBuffer.length - 1);
          reqPduBuffer.copy(reqPduData,0,1);

          let servExecFunction = this._internalFunctionCode.get(functionCode);      //get de function code prossesing function
          var resPduBuffer = servExecFunction(reqPduData);                          //execute service procesing
         
          return resPduBuffer;
      }        
      else{ 
          //reply modbus exception 1
          resPduBuffer = this.makeExceptionResPdu(functionCode, 1);           
          return resPduBuffer;
      }

  }    
    
    
    /**
    * Build a modbus exception response PDU
    * @param {number} mbFunctionCode modbus function code
    * @param {number} exceptionCode code of modbus exception
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} Exception response pdu
    */
    makeExceptionResPdu(mbFunctionCode,  exceptionCode){
      
        //setting modbus function to exception
        let excepFunctionCode = mbFunctionCode | 0x80;
        //setting exeption code
        let excepResBuffer = Buffer.alloc(2);
        excepResBuffer[0] = excepFunctionCode;
        excepResBuffer[1] = exceptionCode;
    
        switch(exception_code){
            case 1:            
                this.emit('mb_exception', mbFunctionCode, 'ILLEGAL FUNCTION');  
            break;
            case 2:
                this.emit('mb_exception', mbFunctionCode, 'ILLEGAL DATA ADDRESS');
                break;
            case 3:
                this.emit('mb_exception', mbFunctionCode, 'ILLEGAL DATA VALUE');
                break;
            case 4:
                this.emit('mb_exception', mbFunctionCode, 'SLAVE DEVICE FAILURE');
                break;
            case 5:
                this.emit('mb_exception', mbFunctionCode, 'ACKNOWLEDGE');
                break;
            case 6:
                this.emit('mb_exception', mbFunctionCode, 'SLAVE DEVICE BUSY');
                break;            
            case 8:
                this.emit('mb_exception', mbFunctionCode, 'MEMORY PARITY ERROR');
                break;
            case 0x0A:
                this.emit('mb_exception', mbFunctionCode, 'GATEWAY PATH UNAVAILABLE');
                break;
            case 0x0B:
                this.emit('mb_exception', mbFunctionCode, 'GATEWAY TARGET DEVICE FAILED TO RESPOND');
                break;
        }

        return excepResBuffer;
    }

    /**
    * Function to implement Read Coil stauts service on server. Function code 01.
    * @param {buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readCoilStatusService(pduReqData){

      //Defining function code for this service
      const FUNCTION_CODE = 1;

      let resPduBuffer;

      //registers to read
      let registersToRead =  pduReqData.readUInt16BE(2);

      //Validating Data Value. Max number of coils to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
      if(registersToRead >=1 && registersToRead <= 2000 && pduReqData.length == 4){        
          //initial register. Example coil 20 addressing as 0x13 (19)
          let startAddress = pduReqData.readUInt16BE(0);      
          
          //Validating data address
          if(startAddress + registersToRead < this.coils.length * 8  & startAddress + registersToRead <= MAX_ITEM_NUMBER){     

              //Calculando cantidad de bytes de la respuesta 12%8=1
              //ejemplo 12 coils necesitan 2 bytes
              let byteCount = registersToRead % 8 ? Math.ceil(registersToRead/8) : (registersToRead/8);   
              let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
              let values = Buffer.alloc(byteCount);
              resPduBuffer = Buffer.alloc(byteCount + 2);  
              resPduBuffer[0] = FUNCTION_CODE;            
              resPduBuffer[1] = byteCount;

              for(let i = 0; i < registersToRead; i++){                   
                if(this.getBoolFromBuffer(this.coils, startAddress + i)){ 
                  values[Math.floor(i/8)] = values[Math.floor(i/8)] | masks[i%8];            
                }          
              }

              values.copy(resPduBuffer, 2);
          }
          //Making modbus exeption 2
          else{
              //reply modbus exception 2
              resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
          }
      }
      //Making modbus exeption 3
      else{
          //reply modbus exception 2
          resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
      }
      return resPduBuffer;
    }

    /**
    * Function to implement Read Input status service on server. Function code 02.
    * @param {buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readInputStatusService(pduReqData){

      //Defining function code for this service
      const FUNCTION_CODE = 2;

      let resPduBuffer;

      //registers to read
      let registersToRead =  pduReqData.readUInt16BE(2);

      //Validating Data Value. Max number of inputss to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
      if(registersToRead >=1 && registersToRead <= 2000 && pduReqData.length == 4){        
          //initial register. Example coil 20 addressing as 0x13 (19)
          let startAddress = pduReqData.readUInt16BE(0);      
          
          //Validating data address
          if(startAddress + registersToRead < this.inputs.length * 8  & startAddress + registersToRead <= MAX_ITEM_NUMBER){     

              //Calculando cantidad de bytes de la respuesta 12%8=1
              //example 12 inputss needs 2 bytes
              let byteCount = registersToRead % 8 ? Math.ceil(registersToRead/8) : (registersToRead/8);   
              let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
              let values = Buffer.alloc(byteCount);
              resPduBuffer = Buffer.alloc(byteCount + 2);  
              resPduBuffer[0] = FUNCTION_CODE;            
              resPduBuffer[1] = byteCount;

              for(let i = 0; i < registersToRead; i++){                   
                if(this.getBoolFromBuffer(this.inputs, startAddress + i)){ 
                  values[Math.floor(i/8)] = values[Math.floor(i/8)] | masks[i%8];            
                }          
              }

              values.copy(resPduBuffer, 2);
          }
          //Making modbus exeption 2
          else{
              //reply modbus exception 2
              resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
          }
      }
      //Making modbus exeption 3
      else{
          //reply modbus exception 3
          resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
      }
      return resPduBuffer;
    }

    /**
    * Function to implement Read Holdings registers service on server. Function code 03.
    * @param {buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusSlave#mb_exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readHoldingRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 3;

        let resPduBuffer;

        //registers to read
        let registersToRead =  pduReqData.readUInt16BE(2);

        //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
        if(registersToRead >=1 && registersToRead <=  0x007D && pduReqData.length == 4){        
          //initial register.
          let startAddress = pduReqData.readUInt16BE(0);   
          
          //Validating data address
          if(startAddress + registersToRead < this.holdingRegisters.length / 2 ){ 

              //Calculando cantidad de bytes de la respuesta
              //example 12 registers needs 2 bytes
              let byteCount = registersToRead * 2;
              let values = Buffer.alloc(byteCount);
              resPduBuffer = Buffer.alloc(byteCount + 2);  
              resPduBuffer[0] = FUNCTION_CODE;            
              resPduBuffer[1] = byteCount;
              
              for(let i = 0; i < registersToRead; i++){
                  let word = this.getWordFromBuffer(this.holdingRegisters, startAddress + i);     
                  word.copy(values, i * 2) ;
              }

              values.copy(resPduBuffer, 2);

          }
          //Making modbus exeption 2
          else{
              //reply modbus exception 3
              resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2);  
          }
        }
        //Making modbus exeption 3
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
        }
        return resPduBuffer;
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

    /**
    * Low level api function to get a boolean value from buffer.
    * @param {buffer} targetBuffer buffer object to read
    * @param {number} offset integer value with bit address.
    * @return {boolean} bit value
    * @throws {RangeError} if offset is out of buffer's bound.
    */
    getBoolFromBuffer(targetBuffer, offset = 0){

        if(offset >= targetBuffer.length * 8){

          let targetByte = this.targetBuffer[Math.floor(dataAddress/8)];
          let byteOffset = offset % 8;
          let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

          let value = (targetByte & masks[offset]) > 0;

          return value;

        }
        else{
          throw new RangeError("offset is out of buffer bounds");
        }
    }

    /**
    * Low level api function to get a 2 bytes  word value from buffer.
    * @param {buffer} targetBuffer buffer object to read
    * @param {number} offset integer value with bit address.
    * @return {Buffer} 2 bytes length buffer
    * @throws {RangeError} if offset is out of buffer's bound.
    */
    getWordFromBuffer(targetBuffer, offset = 0){

        if(offset >= targetBuffer.length / 2){
          
          let value = Buffer.alloc(2);
          value[0] = targetBuffer[offset * 2];
          value[1] = targetBuffer[offset*2 + 1];

          return value;

        }
        else{
          throw new RangeError("offset is out of buffer bounds");
        }
    }
    
}


export default ModbusSlave;

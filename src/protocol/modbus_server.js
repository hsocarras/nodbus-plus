/**
* Modbus Server Base Class module. Can only deal with modbus PDU.
* Implement the base class for a modbus server stack.
* @module protocol/modbus-server
* @author Hector E. Socarras.
* @version 1.0.0
*/


const EventEmitter = require('node:events');
const { Buffer } = require('node:buffer');
const utils = require('./utils');

//define max number of coil, inputs or register
const MAX_ITEM_NUMBER = 65535;

//Default Server's Configuration object
const defaultCfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048
}

/**
 * Class representing a modbus slave.
 * @extends EventEmitter
*/
class ModbusServer extends EventEmitter {
    /**
    * Create a Modbus Basic server.
    * @param {object} mbServerCfg - Configuration object, must have the following properties:
    * {    
    *   inputs : {int} cuantity of inputs, 0 means that imputs uses same buffer thar input registers.
    *   coils : {int} cuantity of coils, 0 means that coils uses same buffer thar coils registers.
    *   holdingRegisters : {int} cuantity of holding registers with 2 bytes per register
    *   inputRegisters : {int} cuantity of input registers with 2 bytes per register
    * }
    */
    constructor(mbServerCfg = defaultCfg){
        super();

        var self = this;

        //arguments check
        if(mbServerCfg.inputs == undefined){mbServerCfg.inputs = defaultCfg.inputs;}
        if(mbServerCfg.coils == undefined){ mbServerCfg.coils = defaultCfg.coils;}        
        if(mbServerCfg.holdingRegisters == undefined){mbServerCfg.holdingRegisters = defaultCfg.holdingRegisters;}
        if(mbServerCfg.inputRegisters == undefined){mbServerCfg.inputRegisters = defaultCfg.inputRegisters;}        
        
        /**
        * Get server's modbus functions code supported 
        * @return {set object} a set objects with funcion codes suported for the server
        *
        */
        this._internalFunctionCode = new Map();
        this._internalFunctionCode.set(1, 'readCoilsService');
        this._internalFunctionCode.set(2, 'readDiscreteInputsService');
        this._internalFunctionCode.set(3, 'readHoldingRegistersService');
        this._internalFunctionCode.set(4, 'readInputRegistersService');
        this._internalFunctionCode.set(5, 'writeSingleCoilService');
        this._internalFunctionCode.set(6, 'writeSingleRegisterService');
        this._internalFunctionCode.set(15, 'writeMultipleCoilsService');
        this._internalFunctionCode.set(16, 'writeMultipleRegistersService');
        this._internalFunctionCode.set(22, 'maskWriteRegisterService');
        this._internalFunctionCode.set(23, 'readWriteMultipleRegistersService');
        Object.defineProperty(self, 'supportedFunctionCode',{
            get: function(){
              return this._internalFunctionCode.keys();
            }
        }) 
        
        
        /**
        * Holding Registers.
        * @type {Object}
        * @public
        */
        if(mbServerCfg.holdingRegisters <= MAX_ITEM_NUMBER & mbServerCfg.holdingRegisters > 0){
          this.holdingRegisters =  Buffer.alloc(mbServerCfg.holdingRegisters*2);
        }
        else if(mbServerCfg.holdingRegisters >= MAX_ITEM_NUMBER){
            this.holdingRegisters =  Buffer.alloc(MAX_ITEM_NUMBER*2);
        }       
        else{
            this.holdingRegisters =  Buffer.alloc(defaultCfg.holdingRegisters*2);
        }

        /**
        * Input Registers.
        * @type {Buffer}
        * @public
        */
        if(mbServerCfg.inputRegisters <= MAX_ITEM_NUMBER & mbServerCfg.inputRegisters > 0){
          this.inputRegisters =  Buffer.alloc(mbServerCfg.inputRegisters * 2);
        }
        else if(mbServerCfg.inputRegisters >= MAX_ITEM_NUMBER){
            this.inputRegisters =  Buffer.alloc(MAX_ITEM_NUMBER*2);
        }       
        else{
            this.inputRegisters =  Buffer.alloc(defaultCfg.inputRegisters*2);
        }  
        
        /**
        * Inputs. Reference 1x.
        * @type {Buffer}
        * @public
        */        
        if(mbServerCfg.inputs <= MAX_ITEM_NUMBER & mbServerCfg.inputs > 0){
            this.inputs =  Buffer.alloc(Math.ceil(mbServerCfg.inputs/8));
        }
        else if(mbServerCfg.inputs >= MAX_ITEM_NUMBER){
            this.inputs =  Buffer.alloc(Math.ceil(MAX_ITEM_NUMBER/8));
        }
        else if (mbServerCfg.inputs <= 0){
            this.inputs =  this.inputRegisters;
        }
        else{
            this.inputs =  Buffer.alloc(Math.ceil(defaultCfg.inputs/8));
        }


        /**
        * Coils. Reference 0x        
        * @type {buffer}
        * @public
        */
        if(mbServerCfg.coils <= MAX_ITEM_NUMBER & mbServerCfg.coils > 0){
            this.coils =  Buffer.alloc(Math.ceil(mbServerCfg.coils/8));
        }
        else if(mbServerCfg.coils >= MAX_ITEM_NUMBER){
            this.coils =  Buffer.alloc(Math.ceil(MAX_ITEM_NUMBER/8));
        }
        else if (mbServerCfg.coils <= 0){
            this.coils =  this.holdingRegisters;
        }
        else{
            this.coils =  Buffer.alloc(Math.ceil(defaultCfg.coils / 8));
        }

        

    }  

    /**
    * @brief Main server function. Entry point for client request. Process request pdu, execute de service and return a response pdu.
    * @param {Buffer} reqPduBuffe buffer containing a protocol data unit
    * @fires ModbusServer#exception
    * @fires ModbusServer#write
    * @fires ModbusServer#error
    * @return {Buffer} buffer containing a protocol data unit
    */
     processReqPdu(reqPduBuffer) {

      let self = this;
      let functionCode = reqPduBuffer[0];      
      
      //Check for function code
      if(this._internalFunctionCode.has(functionCode)){

          try {
              //gets pdu data
              let reqPduData = Buffer.alloc(reqPduBuffer.length - 1);
              reqPduBuffer.copy(reqPduData,0,1);

              let serviceName = this._internalFunctionCode.get(functionCode);      //get de function code prossesing function
              var resPduBuffer = this[serviceName](reqPduData);                          //execute service procesing
            
              return resPduBuffer;
          }
          catch(e){
              //reply modbus exception 4
              resPduBuffer = this.makeExceptionResPdu(functionCode, 4);    //Slave failure exception response
              this.emit('error', e);      
              return resPduBuffer;
          }
      }        
      else{ 
          //reply modbus exception 1
          resPduBuffer = this.makeExceptionResPdu(functionCode, 1);           
          return resPduBuffer;
      }

    }    
    
    
    /**
    * @brief Build a modbus exception response PDU
    * @param {number} mbFunctionCode modbus function code
    * @param {number} exceptionCode code of modbus exception
    * @fires  ModbusServer#mb_exception
    * @return {Buffer} Exception response pdu
    */
    makeExceptionResPdu(mbFunctionCode,  exceptionCode){
      
        //setting modbus function to exception
        let excepFunctionCode = mbFunctionCode | 0x80;
        //setting exeption code
        let excepResBuffer = Buffer.alloc(2);
        excepResBuffer[0] = excepFunctionCode;
        excepResBuffer[1] = exceptionCode;
    
        switch(exceptionCode){
            case 1:            
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL FUNCTION');  
            break;
            case 2:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL DATA ADDRESS');
                break;
            case 3:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ILLEGAL DATA VALUE');
                break;
            case 4:
                this.emit('exception', mbFunctionCode, exceptionCode, 'SLAVE DEVICE FAILURE');
                break;
            case 5:
                this.emit('exception', mbFunctionCode, exceptionCode, 'ACKNOWLEDGE');
                break;
            case 6:
                this.emit('exception', mbFunctionCode, exceptionCode, 'SLAVE DEVICE BUSY');
                break;            
            case 8:
                this.emit('exception', mbFunctionCode, exceptionCode, 'MEMORY PARITY ERROR');
                break;                
            case 0x0A:
                this.emit('exception', mbFunctionCode, exceptionCode, 'GATEWAY PATH UNAVAILABLE');
                break;
            case 0x0B:
                this.emit('exception', mbFunctionCode, exceptionCode, 'GATEWAY TARGET DEVICE FAILED TO RESPOND');
                break;
                
        }

        return excepResBuffer;
    }

    /**
    * @brief Function to implement Read Coil stauts service on server. Function code 01.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readCoilsService(pduReqData){
        
        //Defining function code for this service
        const FUNCTION_CODE = 1;

        let resPduBuffer;

        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of coils to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >=1 && registersToRead <= 2000){        
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
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    }

    /**
    * @brief Function to implement Read Input status service on server. Function code 02.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readDiscreteInputsService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 2;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of inputss to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >=1 && registersToRead <= 2000){        
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
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);         
        }
      return resPduBuffer;
    }

    /**
    * @brief Function to implement Read Holdings registers service on server. Function code 03.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readHoldingRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 3;

        let resPduBuffer;

        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >=1 && registersToRead <=  0x007D){        
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
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
        }
        return resPduBuffer;
    }

    /**
    * @brief Function to implement Read Input registers service on server. Function code 04.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readInputRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 4;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //registers to read
            let registersToRead =  pduReqData.readUInt16BE(2);

            //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
            if(registersToRead >=1 && registersToRead <=  0x007D){        
                //initial register.
                let startAddress = pduReqData.readUInt16BE(0);   
                
                //Validating data address
                if(startAddress + registersToRead < this.inputRegisters.length / 2 ){ 

                    //Calculando cantidad de bytes de la respuesta
                    //example 12 registers needs 2 bytes
                    let byteCount = registersToRead * 2;
                    let values = Buffer.alloc(byteCount);
                    resPduBuffer = Buffer.alloc(byteCount + 2);  
                    resPduBuffer[0] = FUNCTION_CODE;            
                    resPduBuffer[1] = byteCount;
                    
                    for(let i = 0; i < registersToRead; i++){
                        let word = this.getWordFromBuffer(this.inputRegisters, startAddress + i);     
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
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);  
        }
      return resPduBuffer;
    }

    /**
    * @brief Function to implement force single Coil service on server. Function code 05.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write-coils
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    writeSingleCoilService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 5;

        let resPduBuffer;
        if(pduReqData.length == 4){
            //value to write
            let value =  pduReqData.readUInt16BE(2);

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(value == 0x00 || value == 0xFF00){   

                //coil to write
                let targetCoil = pduReqData.readUInt16BE(0);     
                
                //Validating data address
                if(targetCoil  < this.coils.length * 8 & targetCoil <= MAX_ITEM_NUMBER){     
                    
                    resPduBuffer = Buffer.alloc(5);
                    resPduBuffer[0] = FUNCTION_CODE;
                        
                    //writing values on register                  
                    this.setBoolToBuffer(value, this.coils, targetCoil);
                    pduReqData.copy(resPduBuffer, 1);
                        
                    //creating object of values writed
                    //let values = new Map();
                    //let coilValue = this.getBoolFromBuffer(this.coils, targetCoil);
                    //values.set(targetCoil, coilValue);
                    //telling user app that some coils was writed
                    this.emit('write-coils', targetCoil, 1);
                
                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 3
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

          return resPduBuffer;
    }

    /**
    * @brief Function to implement write single Register service on server. Function code 06.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write-registers
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    writeSingleRegisterService(pduReqData){

      //Defining function code for this service
      const FUNCTION_CODE = 6;

      let resPduBuffer;

     
      //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
      if(pduReqData.length == 4){   

            //registers to write
            let value =  Buffer.alloc(2);
            value[0] = pduReqData[2];
            value[1] = pduReqData[3];

            //register to write
            let targetRegister = pduReqData.readUInt16BE(0);     
            
          //Validating data address
            if(targetRegister  < this.holdingRegisters.length / 2){     
                
                resPduBuffer = Buffer.alloc(5);
                resPduBuffer[0] = FUNCTION_CODE;
                    
                    //writing values on register                  
                    this.setWordToBuffer(value, this.holdingRegisters, targetRegister);
                    pduReqData.copy(resPduBuffer, 1);
                    
                    //creating object of values writed
                    //let values = new Map();
                    //let registerValue = this.getWordFromBuffer(this.holdingRegisters, targetRegister);
                    //values.set(targetRegister, registerValue);
                    //telling user app that some coils was writed
                    this.emit('write-registers', targetRegister, 1);
                
            }           
            else{
                //reply modbus exception 2
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
            }
        }       
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

    /**
    * @brief Function to implement write multiple Coils service on server. Function code 15.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write-coils
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    writeMultipleCoilsService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 15;

        let resPduBuffer;
        if(pduReqData.length >=6){
            //amount coils to write
            let cuantityOfOutputs =   pduReqData.readUInt16BE(2);
            //byte count
            let byteCount = pduReqData[4];
            //values to force
            let outputValues = pduReqData.subarray(5);   

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityOfOutputs >= 1 && cuantityOfOutputs <= 0x07B0 && byteCount == Math.ceil(cuantityOfOutputs/8) && byteCount == outputValues.length){   

                    //start
                    let startingAddress = pduReqData.readUInt16BE(0); 
                                
                    //Validating data address
                    if(startingAddress + cuantityOfOutputs  < this.coils.length * 8 & (startingAddress + cuantityOfOutputs) <= MAX_ITEM_NUMBER){     
                    
                        resPduBuffer = Buffer.alloc(5);
                        resPduBuffer[0] = FUNCTION_CODE;
                        
                        //writing values on register  
                        for(let i=0; i < cuantityOfOutputs; i++){
                        let value = this.getBoolFromBuffer(outputValues, i);       
                        this.setBoolToBuffer(value, this.coils, startingAddress + i);
                        }
                        pduReqData.copy(resPduBuffer, 1);

                        //creating object of values writed
                        /*let values = new Map();
                        for(let i = 0; i < cuantityOfOutputs; i++){                  
                        let coilValue = this.getBoolFromBuffer(this.coils, startingAddress + i);                  
                        values.set(startingAddress + i, coilValue);
                        }  */               
                        //telling user app that some coils was writed
                        this.emit('write-coils', startingAddress, cuantityOfOutputs);
                    
                    }
                    //Making modbus exeption 2
                    else{
                        //reply modbus exception 3
                        resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                    }
            }
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }
        return resPduBuffer;
    }

    /**
    * @brief Function to implement write multiple registers service on server. Function code 16.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    writeMultipleRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 16;

        let resPduBuffer;

        if(pduReqData.length >=6){
            //amount  to write
            let cuantityOfRegisters = pduReqData.readUInt16BE(2);
            //byte count
            let byteCount = pduReqData[4];;
            //values to force
            let registerValues = pduReqData.subarray(5);    

            //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityOfRegisters >= 1 && cuantityOfRegisters <= 0x07B0 && byteCount == cuantityOfRegisters*2 & byteCount == registerValues.length){   

                //start
                let startingAddress = pduReqData.readUInt16BE(0); 
                            
                //Validating data address
                if(startingAddress + cuantityOfRegisters  < this.holdingRegisters.length / 2 ){     
                    
                    resPduBuffer = Buffer.alloc(5);
                    resPduBuffer[0] = FUNCTION_CODE;
                        
                    //writing values on register  
                    for(let i=0; i < cuantityOfRegisters; i++){
                        let value = this.getWordFromBuffer(registerValues, i);       
                        this.setWordToBuffer(value, this.holdingRegisters, startingAddress + i);
                    }
                    pduReqData.copy(resPduBuffer, 1);

                    //creating object of values writed
                    /*let values = new Map();
                    for(let i = 0; i < cuantityOfRegisters; i++){                  
                        let registerValue = this.getWordFromBuffer(this.holdingRegisters, startingAddress + i);                  
                        values.set(startingAddress + i, registerValue);
                    }   */              
                    //telling user app that some coils was writed
                    this.emit('write-registers', startingAddress, cuantityOfRegisters);
                
                }
                //Making modbus exeption 2
                else{
                    //reply modbus exception 3
                    resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

    /**
    * @brief Function to implement mask holding register service on server. Function code 22.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write-registers
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    maskWriteRegisterService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 22;

        let resPduBuffer;

        //Validating data address 
        if(pduReqData.length == 6 ){

            //register to mask
            let referenceAddress =   pduReqData.readUInt16BE(0);

            if(referenceAddress < this.holdingRegisters.length / 2){  

                //masks
                let andMask = pduReqData.readUInt16BE(2);     
                let orMask =  pduReqData.readUInt16BE(4); 
                
                resPduBuffer = Buffer.alloc(7);
                resPduBuffer[0] = FUNCTION_CODE;
                    
                  //writing values on register  
                  let actualValue = this.getWordFromBuffer(this.holdingRegisters, referenceAddress);               
                  let maskValue = Buffer.alloc(2);
                  maskValue.writeUint16BE((actualValue.readUint16BE() & andMask) | (orMask & ~andMask));
                  this.setWordToBuffer(maskValue, this.holdingRegisters, referenceAddress)
                  
                  pduReqData.copy(resPduBuffer, 1);
                  
                  //creating object of values writed
                  //let values = new Map();
                  //let registerValue = this.getWordFromBuffer(this.holdingRegisters, referenceAddress);
                  //values.set(referenceAddress, registerValue);
                  //telling user app that some coils was writed
                  this.emit('write-registers', referenceAddress, 1);  
              
            }            
            else{
                //reply modbus exception 2
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
            }
        }        
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

        return resPduBuffer;
    }

    /**
    * Function to implement read and write multiple registers service on server. Function code 23.
    * @param {Buffer}  pduReqData buffer containing only data from a request pdu    
    * @fires  ModbusServer#exception
    * @fires ModbusServer#write-registers
    * @return {Buffer} resPduBuffer. Response pdu.
    */
    readWriteMultipleRegistersService(pduReqData){

        //Defining function code for this service
        const FUNCTION_CODE = 23;

        let resPduBuffer;

        if(pduReqData.length >= 11){

            //values to read and write
            let cuantityToRead =   pduReqData.readUInt16BE(2);
            let cuantityToWrite =   pduReqData.readUInt16BE(6);
            //byte count
            let byteCount = pduReqData[8];
            //values to force
            let writeRegisterValues = pduReqData.subarray(9);    

            //Validating Data Value. See Modbus Aplication Protocol V1.1b3 2006    
            if(cuantityToRead > 0 && cuantityToRead <= 0x7D && cuantityToWrite > 0  && cuantityToWrite <= 0x79 && byteCount == cuantityToWrite*2 & byteCount == writeRegisterValues.length){   

                    //starting addresses
                    let readStartingAddress = pduReqData.readUInt16BE(0); 
                    let writeStartingAddress = pduReqData.readUInt16BE(4); 
                                
                    //Validating data address
                    if(readStartingAddress + cuantityToRead  < this.holdingRegisters.length / 2 && writeStartingAddress + cuantityToWrite  < this.holdingRegisters.length / 2){   

                        //Calculando cantidad de bytes de la respuesta
                        //example 12 registers needs 2 bytes
                        let byteCount = cuantityToRead * 2;
                        let readValues = Buffer.alloc(byteCount);
                        resPduBuffer = Buffer.alloc(byteCount + 2);  
                        resPduBuffer[0] = FUNCTION_CODE;            
                        resPduBuffer[1] = byteCount;
                        
                        for(let i = 0; i < cuantityToRead; i++){
                            let word = this.getWordFromBuffer(this.holdingRegisters, readStartingAddress + i);                             
                            word.copy(readValues, i * 2) ;
                        }

                        readValues.copy(resPduBuffer, 2);
                        
                        //writing values on register  
                        for(let i=0; i < cuantityToWrite; i++){
                        let value = this.getWordFromBuffer(writeRegisterValues, i);       
                        this.setWordToBuffer(value, this.holdingRegisters, writeStartingAddress + i);
                        }

                        //creating object of values writed
                        /*let values = new Map();
                        for(let i = 0; i < cuantityToWrite; i++){                  
                        let registerValue = this.getWordFromBuffer(this.holdingRegisters, writeStartingAddress + i);                  
                        values.set(writeStartingAddress + i, registerValue);
                        }   */              
                        //telling user app that some coils was writed
                        this.emit('write-registers', writeStartingAddress, cuantityToWrite);
                    
                    }
                    //Making modbus exeption 2
                    else{
                        //reply modbus exception 3
                        resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 2); 
                    }
            }            
            else{
                //reply modbus exception 3
                resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
            }
        }   
        else{
            //reply modbus exception 3
            resPduBuffer = this.makeExceptionResPdu(FUNCTION_CODE, 3);          
        }

      return resPduBuffer;
    }    

    /**
    * Low level api function to get a boolean value from buffer.
    * @param {Buffer} targetBuffer buffer object to read
    * @param {number} offset integer value with bit address.
    * @return {boolean} bit value
    * @throws {RangeError} if offset is out of buffer's bound.
    */
    getBoolFromBuffer(targetBuffer, offset = 0){
        
        if(offset < targetBuffer.length * 8){

          let targetByte = targetBuffer[Math.floor(offset/8)];         //Byte where  the bit is place inside the buffer
          let byteOffset = offset % 8;                                      //offset of bit inside the byte
          let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

          let value = (targetByte & masks[byteOffset]) > 0;

          return value;

        }
        else{
          throw new RangeError("offset is out of buffer bounds");
        }
    }

    /**
    * Low level api function to set a boolean value into a buffer.
    * @param {bool} value boolean value to write
    * @param {Buffer} targetBuffer buffer object to read
    * @param {number} offset integer value with bit address.    
    * @throws {RangeError} if offset is out of buffer's bound.
    */
    setBoolToBuffer(value, targetBuffer, offset = 0){

      if(offset < targetBuffer.length * 8){

          let targetOffset = Math.floor(offset / 8);           //byte inside the buffer where the bit is placed
          let byteOffset = offset % 8;                            //offset inside the byte
          let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

          let previousValue = targetBuffer[targetOffset];

          if(value){
              targetBuffer[targetOffset] = previousValue | masks[byteOffset];
          }
          else{
            targetBuffer[targetOffset] = previousValue & (~masks[byteOffset]);
          }

      }
      else{
        throw new RangeError("offset is out of buffer bounds");
      }
    }
        
}

ModbusServer.prototype.getWordFromBuffer = utils.getWordFromBuffer;

ModbusServer.prototype.setWordToBuffer = utils.setWordToBuffer;


module.exports = ModbusServer;

/**
** Modbus Slave Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.4.0
*/


const ModbusDevice = require('./modbus_device');
const BooleanRegister = require('./boolean_register');
const WordRegister = require('./word_register');
const TcpADU = require('../protocol/tcp_adu');
const SerialADU = require('../protocol/serial_adu');
const SlaveFunctions = require('./slave_functions/slave_functions');

/**
 * Class representing a modbus slave.
 * @extends ModbusDevice
*/
class ModbusSlave extends ModbusDevice {
  /**
  * Create a Modbus Slave.
  */
    constructor(address = 1, endianess = "LE"){
        super();

        var self = this;

        /**
        *Suported functions
        * @type {number[]}
        */       
        const supportedFunctions = SlaveFunctions.SuportedFunctions;        
        Object.defineProperty(self, 'supportedModbusFunctions',{
          get: function(){
            return supportedFunctions;
          }
        });

        /**
        * modbus address. Value between 1 and 247
        * @type {number}
        ** @throws {RangeError}
        */
        let mAddress = address;
        Object.defineProperty(self, 'address',{
          get: function(){
            return mAddress;
          },
          set: function(address){
            if(address >= 1 && address <= 247){
              mAddress = address
            }
            else{
              throw new RangeError('Address must be a value fron 1 to 247', 'modbus_slave.js', '55');
            }
          }
        })

        let _endianess = endianess;
        Object.defineProperty(self, 'endianess',{
          get: function(){
            return _endianess;
          },
          set: function(endianess){
            if(endianess == 'BE'){
             _endianess = 'BE';
             self.inputRegisters.endianess = _endianess;
             self.holdingRegisters.endianess = _endianess;
            }
            else{
              _endianess = 'LE';
              self.inputRegisters.endianess = _endianess;
              self.holdingRegisters.endianess = _endianess;
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
        this.holdingRegisters =  new WordRegister(2048, _endianess);

        /**
        * Registro inputs. Ocupan 2 Bytes. Se transmiten B y B+1 en ese orden
        * @type {Buffer}
        * @public
        */
        this.inputRegisters = new WordRegister(2048, _endianess);


    }    

    /**
    * Build a response PDU
    * @param {Object} PDU protocol data unit
    * @return {Object} PDU protocol data unit
    */
    ExecRequestPDU(pdu) {
      
        let respPDU = this.CreatePDU();

        let pduErrorCheck = this.AnalizePDU(pdu)

        /** Valid PDU*/
        if(pduErrorCheck == 0){
          
            switch( pdu.modbus_function ){
                case 0x01:
                    respPDU = SlaveFunctions.ReadCoilStatus.call(self, pdu);
                break;
                case 0x02:
                    respPDU = SlaveFunctions.ReadInputStatus.call(self, pdu);
                break;
                case 0x03:
                    respPDU = SlaveFunctions.ReadHoldingRegisters.call(self, pdu);
                break;
                case 0x04:
                    respPDU = SlaveFunctions.ReadInputRegisters.call(self, pdu);
                break;
                case 0x05:
                    respPDU = SlaveFunctions.ForceSingleCoil.call(self, pdu);
                break;
                case 0x06:
                    respPDU = SlaveFunctions.PresetSingleRegister.call(self, pdu);
                break;
                case 0x0F:
                    respPDU = SlaveFunctions.ForceMultipleCoils.call(self, pdu);
                break;
                case 0x10:                    
                    respPDU = SlaveFunctions.PresetMultipleRegisters.call(self, pdu);
                    break;
                case 0x16:                    
                    respPDU = this.MaskHoldingRegister(pdu);
                break;
                default:
                    //Exception ILLEGAL FUNCTION code 0x01
                    respPDU = SlaveFunctions.MakeModbusException(0x01);                    
                  break
            }   
        }        
        /** Error in PDU*/
        if (pduErrorCheck == 1){
            //Exception ILLEGAL FUNCTION code 0x01
            respPDU = SlaveFunctions.MakeModbusException(0x03); 
        }

        respPDU.MakeBuffer(); 
        return respPDU;

    }

    /**
    * Chech PDU
    * @param {Object} PDU protocol data unit
    * @return {number} Error code. 0-no error, 1-modbus exception, 2-error
    * @fires ModbusSlave#modbus_exeption
    */
    AnalizePDU(pdu){
       
        if(pdu.modbus_data.length < 4){
          return 1;
        }
        else if (pdu.modbus_function == 15 || pdu.modbus_function == 16) {
          let byteCount = pdu.modbus_data.readUInt8(4);
          if(pdu.modbus_data.length-5 === byteCount){
            return 0;
          }
          else{
            return 1;
          }
        }
        else if (pdu.modbus_function == 1 || pdu.modbus_function == 2) {
          let numberPoints = pdu.modbus_data.readUInt16BE(2);
          if(numberPoints < 2040 ){
            return 0
          }
          else{
            //can't send more digital value than 2040 because it will need more than 255 bytes and only 
            //have 1 byte for the bytecount
            return 1
          }
        }
        else if (pdu.modbus_function == 3 || pdu.modbus_function == 4) {
          let numberPoints = pdu.modbus_data.readUInt16BE(2);
          if(numberPoints < 128 ){
            return 0
          }
          else{
            //can't send more registers than 127 because it will need more than 255 bytes and only 
            //have 1 byte for the bytecount
            return 1
          }
        }
        /** Valid PDU. */
        else{
          return 0;
        }
        

    }

    /**
    * Create a response adu on for modbus serial protocol
    * @param {object} reqADU the request SerialADU object.
    * @return {object} a SerialADU object with server response if was succesfull created otherwise reutrn null;    
    */
    CreateRespSerialADU(reqADU){

        if(reqADU.transmision_mode == 'ascii'){
            var respADU = new SerialADU('ascii');
        }
        else{
            respADU = new SerialADU('rtu');
        }
        
        respADU.address = this.address;

        let reqADUParsedOk = reqADU.ParseBuffer();
        if(reqADUParsedOk){
            if(this.AnalizeSerialADU(reqADU) == 0){
                respADU.pdu = self.ExecRequestPDU(reqADU.pdu); 
                //broadcast address require no response
                if(reqADU.address != 0){
                    respADU.MakeBuffer();
                    return respADU;
                }
                else{
                    return null;
                }
            }
            else{

            }            
        }
        else{
          return null;
        }
          
        
    }

    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusnetServer#error {object}
    */
    AnalizeSerialADU(adu){
        
      var calcErrorCheck = 0;

        if(adu.transmision_mode == 'ascii'){
            calcErrorCheck = adu.GetLRC();
        }
        else{
            calcErrorCheck = adu.GetCRC();
        }

        if (adu.address == this.address || adu.address == 0 ){            
            //cheking checsum
            if(calcErrorCheck == adu.errorCheck){
                return 0;
            }
            else{
              this.emit('modbus_exeption',"CHEKSUM ERROR");
              return 1;
            }
        }
        else{
          //address mistmatch
          return 1;
        }
    
    }

    /**
    * Create a response adu on for modbus tco protocol
    * @param {object} reqADU the request TcpADU object.
    * @return {object} a TcpADU object with server response if was succesfull created otherwise reutrn null;    
    */
    CreateRespTcpADU(reqADU){
      
        var respADU = new TcpADU('tcp');    
        respADU.address = this.address;

        let reqADUParsedOk = reqADU.ParseBuffer();
        if(reqADUParsedOk){
          if(this.AnalizeTCPADU == 0){
              respADU.pdu = self.ExecRequestPDU(reqADU.pdu); 
              respADU.transactionCounter = reqADU.mbap.transactionID;
              //broadcast address require no response
              if(reqADU.address != 0){
                  respADU.MakeBuffer();
                  return respADU;
              }
              else{
                  return null;
              }
          }
          else{
              return null;
          } 
        }
        else{
          return null;
        }
    }

    /**
    * Make the response modbus tcp header
    * @param {buffer} adu frame off modbus indication
    * @return {number} error code. 1- error, 0-no errror
    * @fires ModbusnetServer#error {object}
    */
    AnalizeTCPADU(adu){
                
        if (adu.mbap.protocolID != 0){
            //si el protocolo no es modbus standard
            this.emit('modbus_exeption','Protocol not Suported. Check MBAP Header');
            return 1;
        }
        else if (adu.mbap.length != adu.aduBuffer.length-6){
            //Verificando el campo length
            this.emit('modbus_exeption','ByteCount error');
            return 1;
        }
        else{
          return 0;
        }
    
    }

    /**
    * Write Data on slave memory from user app
    * @param {number} value value to be write
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32, int,  int32, float,  double.
    * @throws {String} description of error
    * @example
    * SetRegisterValue(25.2, 'float', 'holding-register', 10);
    */
    SetRegisterValue(value, area = 'holding-register', dataAddress = 0, dataType = 'uint16'){
      
      if(typeof value != 'number' && typeof value != 'boolean' ){
        throw new TypeError('Error  value argument must be a number');        
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

      try{
        memoryArea.SetValue(value, dataAddress, dataType);
      }
      catch(e){
        this.emit('error', e)
      }

    }

    /**
    * Read Data on slave memory    *
    * @param {string|number} area modbus registers. Suppoting values: holding-register, holding, 4, inputs-registers, 3, inputs, 1, coils, 0;
    * @param {number} offset number of register;
    * @param {string} dataType value format. Suppoting format: bool, uint,  uint32, int,  int32, float,  double.
    * @example
    * //return 25.2
    * GetRegisterValue('4', 10, 'float');
    */
    GetRegisterValue(area = 'holding-register', dataAddress = 0, dataType = 'uint16'){
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

      value = memoryArea.GetValue(dataAddress, dataType)

      return value;

    }
}

ModbusSlave.prototype.MakeModbusException = SlaveFunctions.MakeModbusException;

module.exports = ModbusSlave;

/**
** Modbus Serial Server Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.12.0
*/




const SerialADU = require('../protocol/serial_adu');
const PDU = require('./pdu');
const ModbusSlave = require('./modbus_slave');
const SlaveFunctions = require('./server_utils/slave_functions');

/**
 * Class representing a modbus serial server.
 * @extends ModbusDevice
*/
class ModbusServerSerial extends ModbusSlave {
  /**
  * Create a Modbus Slave.
  */
    constructor(address = 1, transmition_mode = 'rtu'){
        super();

        var self = this;

        /**
        * modbus address. Value between 1 and 247 for serial server
        * @type {number}
        ** @throws {RangeError}
        */
       let _Address;
       Object.defineProperty(self, 'address',{
         get: function(){
           return _Address;
         },
         set: function(address){           
            if(address >= 1 && address <= 247){
                _Address = address
            }
            else{
                throw new RangeError('Address must be a value fron 1 to 247', 'modbus_server_serial.js', 44);
            }        
         }
       })
       this.address = address;

        let _TransmitionMode ;
        Object.defineProperty(self, 'transmitionMode',{
            get: function(){
              return  _TransmitionMode;
            },
            set: function(transmition_mode){
                if(transmition_mode == 'ascii'){
                    _TransmitionMode = 'ascii';
                }
                else{
                    _TransmitionMode = 'rtu';
                }
            }
        })
        this.transmitionMode = transmition_mode;

        /**
        * server's modbusfunctions code supported 
        * @type {set object}
        *
        */
        this.supportedFunctionsCode = SlaveFunctions.SuportedMBSerialFunctionscode;
        
        //states
        this.Idle = true;   //idle state acording to modbus Message Implementation Guide       

        //diagnostic counters
        this.BusMessageCount = 0;
        this.BusCommunicationErrorCount;    //this counter is managed by network layer, this propety takes a pointer to the counter.
        this.SlaveExceptionErrorCount = 0;
        this.SlaveMessageCount = 0;
        this.SlaveNoResponseCount = 0;
        this.SlaveNAKCount = 0;
        this.SlaveBusyCount = 0;
        this.BusCharacterOverrunCount;      //this counter is managed by network layer, this propety takes a pointer to the counter.

    }  


    /**
    * this function implement the Counters Management Diagram.    
    * See MODBUS over serial line specification and implementation guide V1.02
    * @param {buffer} message_frame modbus indication's frame
    * @return {object} Adu  if success, otherwise null
    * 
    */
    ServerReceivingMessage(message_frame){

        var self = this;
        //checking if no more transactiona are procesing
        if(this.Idle){
            this.Idle = false;
            //checking frame with errorcheck field
            let mbRequestAdu = new SerialADU(this.transmitionMode, message_frame);
            if(mbRequestAdu.ParseBuffer()){
                //check CRC or LRC
                let calculatedErrorCheckField;
                if(this.transmitionMode == 'ascii'){
                    calculatedErrorCheckField = this.CalculateLRC();
                }
                else{
                    calculatedErrorCheckField = this.CalculateCRC();
                }
                if(calculatedErrorCheckField == mbRequestAdu.errorCheck){
                    this.BusMessageCount++
                    //checking message address
                    if(this.address == mbRequestAdu.address || mbRequestAdu.address == 0){
                        this.SlaveMessageCount++;
                        //is Broadcast
                        if(mbRequestAdu.address == 0){
                            const BroadcastFunctionCode = new Set([5, 6, 15, 16, 22]);

                            if(~BroadcastFunctionCode.has(mbRequestAdu.pdu.modbus_function)){
                                this.SlaveExceptionErrorCount++;
                                return null;
                            }
                            
                        }
                        
                        if(this.ValidateRequestPDU(mbRequestAdu.pdu)){   

                            if(this.acceptedCallback != undefined && (this.acceptedCallback instanceof Function)){
                                this.acceptedCallback(mbRequestADU);
                            }

                            //Se activity diagram Figure 15 from Modbus Message implementation Guide v1.0b
                            let rspPDU = this.BuildResponsePDULocal(mbRequestADU.pdu, (modbus_function, exc_code)=>{
                                self.SlaveExceptionErrorCount++;
                                if(self.exceptionCallback != undefined && (self.exceptionCallback instanceof Function)){
                                    self.exceptionCallback(modbus_function, exc_code);
                                }
                                else{
                                    return
                                }
                            }, this.writRegisterCallback);
                            
                            if(mbRequestAdu.address == 0){
                                return null
                            }
                            else{
                                mbResponseADU.pdu = rspPDU;
                                mbResponseADU.MakeBuffer();
                                this.Idle = true;
                                return mbResponseADU;
                            }
                            
                        }
                        else{
                            let excPDU = this.MakeModbusException.call(this,mbRequestAdu.pdu.modbus_function, 1, (modbus_function, exc_code)=>{
                                self.SlaveExceptionErrorCount++;
                                if(self.exceptionCallback != undefined && (self.exceptionCallback instanceof Function)){
                                    self.exceptionCallback(modbus_function, exc_code);
                                }
                                else{
                                    return;
                                }

                            });
                            
                            if(mbRequestAdu.address == 0){
                                return null
                            }
                            else{
                                mbResponseADU.pdu = rspPDU;
                                mbResponseADU.MakeBuffer();
                                this.Idle = true;
                                return mbResponseADU;
                            }
                        }
                        
                    }
                    else{
                        this.Idle = true;                        
                        return null;
                    }
                }
                else{
                    this.Idle = true;
                    this.BusCommunicationErrorCount++;
                    return null;
                }
            }
            else{
                this.Idle = true;
                this.BusCommunicationErrorCount++;
                return null;
            }
        }
        else{
            return null;
        }

        
    }  

    /**
    * Calculate the crc from a modbus rtu's frame.
    * @param {Buffer} frame The complete modbus rtu frame.
    * @return {number} The CRC.
    */
    CalculateCRC(frame){
  
        var crc_hi = 0xFF;
        var crc_lo = 0xFF;
        var index;

        var auxcrc_hi = [0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
             0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
             0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01,
             0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
             0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81,
             0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
             0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01,
             0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
             0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
             0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
             0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01,
             0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
             0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
             0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
             0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01,
             0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
             0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
                        0x40];

        var auxcrc_lo = [0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06, 0x07, 0xC7, 0x05, 0xC5, 0xC4,
             0x04, 0xCC, 0x0C, 0x0D, 0xCD, 0x0F, 0xCF, 0xCE, 0x0E, 0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09,
             0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9, 0x1B, 0xDB, 0xDA, 0x1A, 0x1E, 0xDE, 0xDF, 0x1F, 0xDD,
             0x1D, 0x1C, 0xDC, 0x14, 0xD4, 0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
             0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3, 0xF2, 0x32, 0x36, 0xF6, 0xF7,
             0x37, 0xF5, 0x35, 0x34, 0xF4, 0x3C, 0xFC, 0xFD, 0x3D, 0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A,
             0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38, 0x28, 0xE8, 0xE9, 0x29, 0xEB, 0x2B, 0x2A, 0xEA, 0xEE,
             0x2E, 0x2F, 0xEF, 0x2D, 0xED, 0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
             0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60, 0x61, 0xA1, 0x63, 0xA3, 0xA2,
             0x62, 0x66, 0xA6, 0xA7, 0x67, 0xA5, 0x65, 0x64, 0xA4, 0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F,
             0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB, 0x69, 0xA9, 0xA8, 0x68, 0x78, 0xB8, 0xB9, 0x79, 0xBB,
             0x7B, 0x7A, 0xBA, 0xBE, 0x7E, 0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
             0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71, 0x70, 0xB0, 0x50, 0x90, 0x91,
             0x51, 0x93, 0x53, 0x52, 0x92, 0x96, 0x56, 0x57, 0x97, 0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C,
             0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E, 0x5A, 0x9A, 0x9B, 0x5B, 0x99, 0x59, 0x58, 0x98, 0x88,
             0x48, 0x49, 0x89, 0x4B, 0x8B, 0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
             0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42, 0x43, 0x83, 0x41, 0x81, 0x80,
                        0x40];

        for(var i = 0; i< frame.length-2; i++) {
            index = crc_hi ^ frame[i];
            crc_hi = crc_lo ^ auxcrc_hi[index];
            crc_lo = auxcrc_lo[index];
        }
        return (crc_hi << 8 | crc_lo);

    }

    /**
    * Calculate de LRC from a modbus ascii's frame.
    * @param {Buffer} frame The complete modbus ascii frame.
    * @return {number} The LRC.
    */
    CalculateLRC(frame){

        var bufferBytes = Buffer.alloc(Math.floor((frame-5)/2));
        var  byteLRC = Buffer.alloc(1);

        for(var i = 0; i < bufferBytes.length; i++){
            bufferBytes[i]=Number('0x'+ frame.toString('ascii',2*i+1 ,2*i+3));
        }

        for(var i = 0; i < bufferBytes.length;i++){
            byteLRC[0] = byteLRC[0] + bufferBytes[i];
        }

        var lrc_temp = Buffer.alloc(1);
        lrc_temp[0] = -byteLRC[0];
        var lrc = lrc_temp.readUInt8(0)
        return lrc;

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
   
}



module.exports = ModbusServerTcp;


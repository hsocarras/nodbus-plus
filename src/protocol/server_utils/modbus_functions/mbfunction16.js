/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 16 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de los registros solicitados.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');

const FUNCTION_CODE = 16; 

var PresetMultipleRegister = function (pdu_req_data) {

     var rspPDU = new PDU();

    //registers to read
    let numberOfRegister =   pdu_req_data.readUInt16BE(2);

    //number of byte with forced values
    var byteCount = pdu_req_data.readUInt8(5);

    //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
    if(numberOfRegister >=1 && numberOfRegister <= 0x007B && byteCount == numberOfRegister * 2 && pdu_req_data.length < PDU.MaxLength){        
        //initial register. Example coil 20 addressing as 0x13 (19)
        let startingAddress = pdu_req_data.readUInt16BE(0);        
        
        //Validating data address
        if(startingAddress + numberOfRegister < this.holdingRegisters.size ){     
           try{
                rspPDU.modbus_function = FUNCTION_CODE;
                rspPDU.modbus_data = Buffer.alloc(4);
                pdu_req_data.copy(rspPDU.modbus_data, 0, 0, 4)
                
                //writing values on register
                this.holdingRegisters.DecodeRegister(pdu_req_data.slice(5), startAddress);
                
                
                //creating object of values writed
                let values = new Map();
                for(var i= 0; i < numberOfRegisters; i++){                  
                let val = this.holdingRegisters.GetValue(startAddress+i)                
                values.set(startAddress+i, val.readUInt16BE());
                }
                
                //telling user app that some coils was writed
                this.emit('mb_register_writed', '4x', values);
                
                
                return rspPDU;
           }
           catch(e){
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

module.exports = PresetMultipleRegister;

/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 06 del protocolo de modbus.
*Debuelve un objeto pdu con el valor del registro solicitado.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');

const FUNCTION_CODE = 6;

var PresetSingleRegister = function (pdu_req_data){

    var rspPDU = new PDU();

    //valor a forzar
    let registerValue = pdu_req_data.readUInt16BE(2);

    //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
    if((registerValue >= 0x00 && registerValueValue <= 0xFFFF) && pdu_req_data.length == 4){        
        //initial register. Example coil 20 addressing as 0x13 (19)
        let targetRegister = pdu_req_data.readUInt16BE(0);      
        
        //Validating data address
        if(targetRegister  < this.holdingRegisters.size ){     
           try{
                rspPDU.modbus_function = FUNCTION_CODE;
                rspPDU.modbus_data = pdu_req_data;

                //writing values on register
                this.holdingRegisters.DecodeRegister(pdu_req_data.slice(2), targetRegister);
                
                
                //creating object of values writed
                let values = new Map();
                values.set(targetRegister, this.holdingRegisters.GetValue(targetRegister).readUInt16BE());
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

module.exports = PresetSingleRegister;

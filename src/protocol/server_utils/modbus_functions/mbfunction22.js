/** 
* @author Hector E. Socarras
* @brief
* Se implementa la funcion 22 del protocolo de modbus.
* Debuelve un objeto pdu con el valor del registro solicitado.
*
* @param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');

const FUNCTION_CODE = 22; 

var MaskHoldingRegister = function (pdu_req_data){

    var respPDU = new PDU();

    //initial register. Example coil 20 addressing as 0x13 (19)
    let targetRegister = pdu_req_data.readUInt16BE(0); 

    //Validating data address see Modbus Aplication Protocol V1.1b3 2006    
    if(targetRegister  < this.holdingRegisters.size){        
        let AND_MASK = pdu_req_data.readUInt16BE(2);
        let OR_MASK = pdu_req_data.readUInt16BE(4);
        
        //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006
        if(AND_MASK <= 0xFFFF && OR_MASK  <= 0xFFFF && pdu_req_data.length == 6){     
           try{
                rspPDU.modbus_function = FUNCTION_CODE;
                rspPDU.modbus_data = pdu_req_data;

                //writing values on register 
                let currentValue = this.holdingRegisters.GetValue(targetRegister).readUInt16BE();               
                let maskValue = (currentValue & AND_MASK) | (OR_MASK & ~AND_MASK );
                currentValue.writeUInt16BE(maskValue);
                this.holdingRegisters.SetValue(currentValue, targetRegister);
                
                
                //creating object of values writed
                let values = new Map();
                values.set(targetRegister, this.holdingRegisters.GetValue(targetRegister).readUInt16BE());

                //telling user app that some coils was writed
                this.emit('mb_register_writed','4x', values);
                
                
                return rspPDU;
           }
           catch(e){
            return MakeModbusException.call(this, FUNCTION_CODE, 4);
           }
        }
        //Making modbus exeption 3
        else{
            return MakeModbusException.call(this, FUNCTION_CODE, 3);
        }
    }
    //Making modbus exeption 2
    else{
        return MakeModbusException.call(this, FUNCTION_CODE, 2);
    }
}

module.exports = MaskHoldingRegister;

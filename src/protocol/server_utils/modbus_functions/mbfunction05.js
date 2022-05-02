/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 05 del protocolo de modbus.
*Debuelve un objeto pdu con el echo del request.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');

const FUNCTION_CODE = 5; 

var ForceSingleCoil = function (pdu_req_data){

    var rspPDU = new PDU();

    //valor a forzar
    let outputValue = pdu_req_data.readUInt16BE(2);

    //Validating Data Value. output value must be 0x00 or 0xFF00 see Modbus Aplication Protocol V1.1b3 2006    
    if((outputValue == 0x00 || outputValue == 0xFF00) && pdu_req_data.length == 4){        
        //initial register. Example coil 20 addressing as 0x13 (19)
        let targetCoil = pdu_req_data.readUInt16BE(0);      
        
        //Validating data address
        if(targetCoil  < this.coils.size ){     
           try{
                rspPDU.modbus_function = FUNCTION_CODE;
                rspPDU.modbus_data = pdu_req_data;
                //writing values on register
                let valBuffer = Buffer.alloc(1);
                (pdu_req_data.readUInt16BE(2) == 0xFF00) ? valBuffer[0] = 1 : valBuffer[0] = 0;
                this.coils.SetValue(valBuffer, targetCoil);

                
                //creating object of values writed
                let values = new Map();
                let val = this.coils.GetValue(targetCoil)
                values.set(targetCoil, (val[0] > 0));
                //telling user app that some coils was writed
                this.emit('mb_register_writed', '0x', values);
                
                
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

module.exports = ForceSingleCoil;

/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x04 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de los registros solicitados.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');
const ReadWordRegister = require('./Read_Word_Register');

const FUNCTION_CODE = 4;   

var ReadInputRegister = function (pdu_req_data) {

    var rspPDU = new PDU();    

    //registers to read
    let numberOfRegister =   pdu_req_data.readUInt16BE(2);

    //Validating Data Value. Max number of registers to read is 125 acording to Modbus Aplication Protocol V1.1b3 2006    
    if(numberOfRegister >=1 && numberOfRegister <=  0x007D && pdu_req_data.length == 4){        
        //initial register. Example register 20 addressing as 0x13 (19)
        let startingAddress = pdu_req_data.readUInt16BE(0);      
        
        //Validating data address
        if(startingAddress + numberOfRegister < this.inputRegisters.size ){           
            let execPduStatus = ReadWordRegister(rspPDU, this.inputRegisters, startingAddress, numberOfRegister);
            if(execPduStatus){
                return rspPDU;
            }
            else{
                return MakeModbusException.call(this, FUNCTION_CODE, 4);
            }
        }
        //Making modbus exeption 3
        else{
            return MakeModbusException.call(this, FUNCTION_CODE, 2);
        }
    }
    //Making modbus exeption 2
    else{
        return MakeModbusException.call(this, FUNCTION_CODE, 3);
    }


}

module.exports = ReadInputRegister;

/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 0x02 del protocolo de modbus.
*Debuelve un objeto pdu con el valor de las inputs solicitadas.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');
const ReadBoolRegister = require('./Read_Boolean_Register');

const FUNCTION_CODE = 2; 

var ReadInputStatus = function (pdu_req_data) {   

    var rspPDU = new PDU();    

    //registers to read
    let numberOfRegister =   pdu_req_data.readUInt16BE(2);

    //Validating Data Value. Max number of inputs to read is 2000 acording to Modbus Aplication Protocol V1.1b3 2006    
    if(numberOfRegister >=1 && numberOfRegister <= 2000 && pdu_req_data.length == 4){        
        //initial register. Example input 20 addressing as 0x13 (19)
        let startingAddress = pdu_req_data.readUInt16BE(0);      
        
        //Validating data address
        if(startingAddress + numberOfRegister < this.inputs.size ){           
            let execPduStatus = ReadBoolRegister(rspPDU, this.inputs, startingAddress, numberOfRegister);
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

module.exports = ReadInputStatus;

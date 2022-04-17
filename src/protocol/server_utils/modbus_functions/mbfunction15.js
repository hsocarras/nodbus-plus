/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion 15 del protocolo de modbus.
*Debuelve un objeto pdu con el echo del request.
*
*@param objeto pdu
*/

const PDU = require('../../pdu');
const MakeModbusException = require('./Make_modbus_exception');

const FUNCTION_CODE = 15; 

var ForceMultipleCoils = function (pdu_req_data){

    var rspPDU = new PDU();

    //registers to read
    let numberOfRegister =   pdu_req_data.readUInt16BE(2);

    //number of byte with forced values
    var byteCount = pdu_req_data.readUInt8(5);

    //Validating Data Value. see Modbus Aplication Protocol V1.1b3 2006    
    if(numberOfRegister >=1 && numberOfRegister <= 0x07B0 && byteCount == Math.ceil(numberOfRegister/8) && pdu_req_data.length < PDU.MaxLength){        
        //initial register. Example coil 20 addressing as 0x13 (19)
        let startingAddress = pdu_req_data.readUInt16BE(0);      
        
        //Validating data address
        if(startingAddress + numberOfRegister < this.coils.size ){     
           try{
                //values to force
                let forceData = pdu_req_data.slice(5);

                rspPDU.modbus_function = FUNCTION_CODE;
                rspPDU.modbus_data = Buffer.alloc(4);                
                pdu_req_data.copy(rspPDU.modbus_data, 0, 0, 4)

                //writing values on register
                this.coils.DecodeRegister(forceData, startingAddress, numberOfRegister);

                
                //creating object of values writed
                let values = new Map();
                for(var i = 0; i < number_points; i++){                  
                let val = this.coils.GetValue(startingAddress + i);                  
                values.set(startingAddress + i, (val[0] > 0));
                }               
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

module.exports = ForceMultipleCoils;

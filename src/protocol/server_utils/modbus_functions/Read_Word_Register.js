


var ReadWordRegister = function (mb_rsp_pdu, word_register, starting_address, number_of_register) {

    if(word_register.reference == 4){
        //if register reference is 4 (holdings) function code is set to 3 else is set to 4
        mb_rsp_pdu.modbus_function = 0x03;
    }
    else{
        mb_rsp_pdu.modbus_function = 0x04;
    }

    ////Calculando cantidad de bytes de la respuesta
    let byte_count = 2 * number_of_register;

    mb_rsp_pdu.modbus_data = Buffer.alloc(byte_count+1);        
    mb_rsp_pdu.modbus_data[0]=byte_count;

    try{
        
        word_register.EncodeRegister(starting_address, number_of_register).copy(mb_rsp_pdu.modbus_data, 1);        
        return true;
        
    }
    catch(e){        
        console.log(e)
        return false
    }
}

module.exports = ReadWordRegister;

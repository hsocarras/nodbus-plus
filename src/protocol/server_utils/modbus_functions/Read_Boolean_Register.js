/*
*@author Hector E. Socarras
*@brief
*Se implementa la funcion que lee de los registros booleanos del esclavo.

*/



var ReadBoolRegisterStatus = function (mb_rsp_pdu, boolean_register, starting_address, number_of_register) {

    if(boolean_register.reference == 0){
        //if register reference is 0 (coils) function code is set to 1 else is set to 2
        mb_rsp_pdu.mb_rsp_pdu.modbus_function = 0x01;
    }
    else{
        mb_rsp_pdu.mb_rsp_pdu.modbus_function = 0x02;
    }

    //Calculando cantidad de bytes de la respuesta 12%8=1
    //ejemplo 12 coils necesitan 2 bytes
    let byte_count= numberOfRegister % 8 ? Math.ceil(numberOfRegister/8):(numberOfRegister/8);

    
    mb_rsp_pdu.modbus_data = Buffer.alloc(byte_count+1);
    mb_rsp_pdu.modbus_data[0]=byte_count;

    //buffer temporal con tamano suficiente para copiar el segmento del registro con las coils solicitadas
    //var coil_segment =  Buffer.alloc(byte_count);
    try{
        let segment = boolean_register.EncodeRegister(starting_address, number_of_register); 
        //copiando las cois al campo de data de la PDU
        segment.copy(mb_rsp_pdu.modbus_data,1);
        return true;
    }
    catch(e){
        return false
    }
    
}

module.exports = ReadBoolRegisterStatus;

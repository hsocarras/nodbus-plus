/**
*@brief Clase de Protocol Data Unit
*Objeto recibido por la funcion BuildResponse del modbus server
*@author Hector E. Socarras.
*date 9/4/2016
*/

module.exports = class PDU {
  constructor(pduRaw = Buffer.alloc(1)){

    //buffer con la pdu en bruto
    this.pduBuffer = pduRaw;

    //number funcion modbus
    this.modbus_function = 0;

    //buffer con el cuerpo de la pdu
    this.modbus_data = Buffer.alloc(1);

  }

  MakeBuffer(){
      /**
      *@brief function para convertir el los campos function y data en un buffer para enviarlo por un socket
      */

      var buff = Buffer.alloc(this.modbus_data.length + 1);
      buff[0] = this.modbus_function;
      this.modbus_data.copy(buff,1);
      this.pduBuffer = buff;

  }

  ParseBuffer(){
      /**
      *@brief function que parsea el buffer raw y obtiene los atributos function y data
      */

      this.modbus_function = this.pduBuffer[0];

      //creando el buffer de datos
      this.modbus_data = Buffer.alloc(this.pduBuffer.length-1);
      this.pduBuffer.copy(this.modbus_data,0,1);
  }

}

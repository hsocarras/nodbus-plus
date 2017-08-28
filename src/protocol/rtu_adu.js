/**
*@brief Clase de Aplication Data Unit RTU
*
*@author Hector E. Socarras.
*date 19/5/2016
*/

const SerialADU = require('./serial_adu');


module.exports = class RtuADU  extends SerialADU {
  constructor(aduRaw = Buffer.alloc(1)){
    super(aduRaw)
  }

  MakeBuffer(){
      /**
      *@brief function para convertir el los campos en un buffer para enviarlo por un socket
      */

      //actualizando el valor del buffer
      this.aduBuffer = this.CalcPreBuffer();

      var l = this.aduBuffer.length;
      this.aduBuffer.writeUInt16BE(this.errorCheck,l-2);

  }

  ParseBuffer(){
      /**
      *@brief function que parsea un buffer y para obtiener los atributos de la adu
      */

      this.address = this.aduBuffer.readUInt8(0);

      this.pdu.pduBuffer = this.aduBufferBuffer.slice(1,-2);
      this.pdu.ParseBuffer();
      this.errorCheck = this.aduBuffer.readUInt16BE(this.aduBuffer.length - 2);

  }

  CalcPreBuffer(){
      /**
      *@brief function q calcula  un buffer con el campo de error check no valido
      */

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //actualizando el valor del buffer
      var tempBuffer = Buffer.alloc(this.pdu.pduBuffer.length + 3);

       if(this.address <= 247){
           temp[0] = this.address;
      }
      else{
          throw Error('address error');
          return;
      }

      this.pdu.pduBuffer.copy(tempBuffer,1);

      return tempBuffer;
  }

}

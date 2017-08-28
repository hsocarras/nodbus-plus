/**
*@brief Clase de Aplication Data Unit sobre tcp
*
*@author Hector E. Socarras.
*date 9/5/2016
*/

const ADU = require('./adu');
const MBAP = require('./mbap');

module.exports = class TcpADU extends ADU {
  constructor(aduRaw = Buffer.alloc(1)){
    //propiedad mbap
    this.mbap = new MBAP();
  }

  MakeBuffer(){
      /**
      *@brief function para convertir el los campos en un buffer para enviarlo por un socket
      */

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //creando en buffer del mbap
      this.mbap.MakeBuffer();

      var buff = Buffer.alloc(this.pdu.pduBuffer.length+this.mbap.mbapBuffer.length);

      this.mbap.mbapBuffer.copy(buff);
      this.pdu.pduBuffer.copy(buff,7);

      this.aduBuffer = buff;
  }

  ParseBuffer() {
      /**
      *@brief function que parsea un buffer y para obtiener los atributos de la adu
      */
      if(this.aduBuffer.length > 7) {

          this.mbap.mbapBuffer = this.aduBuffer.slice(0,7);
          this.mbap.ParseBuffer();

          this.pdu.pduBuffer = this.aduBuffer.slice(7);
          this.pdu.ParseBuffer();
      }
      else {
          throw Error('adu buffer not contain a valid frame');
      }

  }

}

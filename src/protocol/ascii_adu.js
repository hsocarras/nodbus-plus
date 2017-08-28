/**
*@brief Clase de Aplication Data Unit Ascii
*
*@author Hector E. Socarras.
*date 19/5/2016
*/

const SerialADU = require('./serial_adu');


module.exports = class AsciiADU extends SerialADU {
  constructor(aduRaw = Buffer.alloc(1)){
    super(aduRaw);

  }

  MakeBuffer(){
      /**
      *@brief function para convertir el los campos en un buffer para enviarlo por un socket
      */

      //buffer temporal para el calculo de los caracteres
      var charBuffer = Buffer.alloc(2);

      //size of aduBuffer = 1 start char + 2 address char + 2*pduBuffer + 2 char lrc + 2 char end
      this.aduBuffer = this.CalcPreBuffer();

      var size = this.aduBuffer.length;

      //valores de chekeo de errores
      this.aduBuffer[size-4] = this.errorCheck[0];
      this.aduBuffer[size-3] = this.errorCheck[1];

      //caracter ascii de fin 'CRLF'
      this.aduBuffer[size-2] = 0x0D;
      this.aduBuffer[size-1] = 0x0A;

  }

  ParseBuffer() {
      /**
      *@brief function que parsea un buffer y para obtiener los atributos de la adu
      */

      var l= this.aduBuffer.length;

      this.address = Number('0x'+this.aduBuffer.toString('ascii',1,3));

      //pdu normal en rtu entendible por el serial server
      this.pdu.pduBuffer = Buffer.alloc((this.aduBuffer.length - 7)/2);
      for(var i = 0;i < this.pdu.pduBuffer.length;i++){
          this.pdu.pduBuffer[i]=Number('0x'+this.aduBuffer.toString('ascii',2*i+3,2*i+5));
      }
      this.pdu.ParseBuffer();


      this.errorCheck = Number('0x'+this.aduBuffer.toString('ascii',l-4,l-2));

  }

  CalcPreBuffer(){
       /**
      *@brief function q calcula  un buffer con el campo de error check no valido
      */

      function Byte2Chars (byte){
          /*
          *@brief function to convert un valor contenido en en buffer(1) en su string eqivalente
          *@param byte  number;
          *@param return Buffer(2)
          */

          var temp = Buffer.alloc('00','ascii');

          if(byte > 0x0F){
              //convierto el numero en su sttring equivalente en hexadecimal y lo escrbo en el buffer temp
              temp.write(byte.toString(16).toUpperCase(),0,2,'ascii');
          }
          else {
              temp.write(byte.toString(16).toUpperCase(),1,2,'ascii');
          }

          return temp;
      }

      //buffer temporal para el calculo de los caracteres
      var charBuffer = Buffer.alloc(2);

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //size of aduBuffer = 1 start char + 2 address char + 2*pduBuffer + 2 char lrc + 2 char end
      var tempBuffer = Buffer.alloc(2*this.pdu.pduBuffer.length + 7);

      //caracter ascii de inicio ':'
      tempBuffer[0] = 0x3A;

       if(this.address <= 247){
           charBuffer = Byte2Chars(this.address);
           charBuffer.copy(tempBuffer,1)
      }
      else{
          throw Error('address error');
          return;
      }

      for(var i = 0;i < this.pdu.pduBuffer.length;i++){
          charBuffer = Byte2Chars(this.pdu.pduBuffer[i])
          charBuffer.copy(tempBuffer,2*i+3)
      }

      return tempBuffer;
  }

}

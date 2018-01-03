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
    *function to convert a value in 2 chars lenght buffer
    *@param byte  number;
    *@return {Buffer}
    */
    function Byte2Chars (byte){

        var temp = Buffer.alloc(2);

        if(byte > 0x0F){
            //convierto el numero en su sttring equivalente en hexadecimal y lo escrbo en el buffer temp
            temp.write((byte & 0x0F).toString(16).toUpperCase(), 1);
            temp.write((byte >> 4).toString(16).toUpperCase());
        }
        else {

            temp.write(0x00.toString(16).toUpperCase());
            temp.write(byte.toString(16).toUpperCase(),1);
        }

        return temp;
    }

      //buffer temporal para el calculo de los caracteres
      var charBuffer = Buffer.alloc(2);

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //size of aduBuffer = 1 start char + 2 address char + 2*pduBuffer + 2 char lrc + 2 char end
      var tempBuffer = Buffer.alloc(2*this.pdu.pduBuffer.length + 7);
      var l = tempBuffer.length;

      let rtuBuffer = Buffer.alloc(this.pdu.pduBuffer.length + 1)
      rtuBuffer.writeUInt8(this.address);
      this.pdu.pduBuffer.copy(rtuBuffer, 1);

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

      this.errorCheck = this.GetLRC(rtuBuffer);


      tempBuffer.write(this.errorCheck.toString(16).toUpperCase(), l-4, 2,'ascii');

      //caracter ascii de fin 'CRLF'
      tempBuffer[l-2] = 0x0D;
      tempBuffer[l-1] = 0x0A;

      this.aduBuffer = tempBuffer;

  }

  ParseBuffer() {
      /**
      *@brief function que parsea un buffer y para obtiener los atributos de la adu
      */

      var l= this.aduBuffer.length;
      var rtuBuffer;

      this.address = Number('0x'+this.aduBuffer.toString('ascii',1,3));

      //pdu normal en rtu entendible por el serial server
      this.pdu.pduBuffer = Buffer.alloc(Math.floor((l - 7)/2));

      for(var i = 0; i < this.pdu.pduBuffer.length; i++){
          this.pdu.pduBuffer[i]=Number('0x'+this.aduBuffer.toString('ascii',2*i+3 ,2*i+5));
      }

      rtuBuffer = Buffer.alloc(this.pdu.pduBuffer.length + 1)
      rtuBuffer.writeUInt8(this.address);
      this.pdu.pduBuffer.copy(rtuBuffer, 1);

      this.errorCheck = Number('0x'+this.aduBuffer.toString('ascii',l-4,l-2));


      if(this.errorCheck == this.GetLRC(rtuBuffer)){
        try{
          this.pdu.ParseBuffer();
        }
        catch(e){
          throw err;
        }
      }
      else{

        throw 'checksum error';
      }
  }


  GetLRC(frame){

    var  byteLRC = Buffer.alloc(1);

    for(var i = 0; i < frame.length;i++){
      byteLRC[0] = byteLRC[0] + frame[i];
    }

    var lrc_temp = Buffer.alloc(1);
    lrc_temp[0] = -byteLRC[0];
    var lrc = lrc_temp.readUInt8(0)
    return lrc;

  }

}

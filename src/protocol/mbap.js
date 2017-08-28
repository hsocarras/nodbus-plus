/**
*@brief Clase de MBAP Header
*/

module.exports = class MBAP {
  constructor(mbapRaw = Buffer.alloc(7)){

    //buffer with raw header
    this.mbapBuffer = mbapRaw;

    this.transactionID =0x0;
    this.protocolID = 0x0;
    this.length = 0x0;
    this.unitID = 0x0;
  }

  MakeBuffer(){
      /**
      *@brief function para convertir los atributos del mbap en un buffer para enviarlo por un socket
      */
      var buff = Buffer.alloc(7);
      buff.writeUInt16BE(this.transactionID,0);
      buff.writeUInt16BE(this.protocolID,2);
      buff.writeUInt16BE(this.length,4);
      buff.writeUInt8(this.unitID,6);

      this.mbapBuffer = buff;

  }

  ParseBuffer(){
      /**
      *@brief function que parsea un buffer y obtiene los atributos de la cabecera mbap
      */

      this.transactionID = this.mbapBuffer.readUInt16BE(0);
      this.protocolID = this.mbapBuffer.readUInt16BE(2);
      this.length = this.mbapBuffer.readUInt16BE(4);
      this.unitID = this.mbapBuffer.readUInt8(6);

  }

}

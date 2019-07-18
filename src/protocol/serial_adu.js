/**
** Modbus TCP Aplication Data Unit base class.
* @module protocol/serial_adu
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ADU = require('./adu');


module.exports = class SerialADU extends ADU {
    constructor(aduRaw =Buffer.alloc(1)){
      super(aduRaw)

      /**
      *modbus address
      *@type {number}
      */
     this.address = 1;

      //propiedad error cheking
      this.errorCheck = 0;
    }

    static isAsciiAdu(aduBuffer){
      let firstByte = aduBuffer[0];
      let lastByte = aduBuffer[aduBuffer.length - 1];
      let preLastByte = aduBuffer[aduBuffer.length - 2];

      if(firstByte == 0x3A & preLastByte == 0x0D & lastByte == 0x0A){
        return true;
      }
      else return false
    }
}

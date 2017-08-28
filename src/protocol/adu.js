/**
*@brief
*
*@author Hector E. Socarras.
*date 9/5/2016
*/

const PDU = require('./pdu');

module.exports = class ADU {
    constructor(aduRaw = Buffer.alloc(1)){
      //frame completo del mensaje
      this.aduBuffer = aduRaw;

      //toda adu contiene una pdu
      this.pdu = new PDU();
    }

}

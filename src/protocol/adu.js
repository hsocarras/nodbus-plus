/**
** Modbus Aplication Data Unit base class.
* @module protocol/adu.js.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const PDU = require('./pdu');

/**
 * Class representing a modbus aplication data unit.
*/
 class ADU {
   /**
   * Create a ADU.
   * @param {Buffer} aduRaw Frame modbus.
   */
    constructor(trans_mode = "tcp", aduRaw = Buffer.alloc(1)){
      var self = this;

      /**
      *Frame
      *@type {Buffer}
      */
      this.aduBuffer = aduRaw;
     

      /**
      *Protocol data unit object
      *@type {object}
      */
      this.pdu = new PDU();
    }

}

module.exports = ADU;

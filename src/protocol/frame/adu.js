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
    constructor(aduRaw = Buffer.alloc(1)){
      /**
      *Frame
      *@type {Buffer}
      */
      this.aduBuffer = aduRaw;

      /**
      *modbus address
      *@type {number}
      */
      this.address = 247;

      /**
      *Protocol data unit object
      *@type {object}
      */
      this.pdu = new PDU();
    }

}

module.exports = ADU;

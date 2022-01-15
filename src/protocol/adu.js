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
      * modbus transmision mode
      * @type {string}
      */
      this.transmision_mode = trans_mode;

      /**
      *modbus address
      *@type {number}
      */
      /**
        * modbus address. Value between 1 and 247
        * @type {number}
        ** @throws {RangeError}
        */
       let mAddress = 247;
       Object.defineProperty(self, 'address',{
         get: function(){
           return mAddress;
         },
         set: function(address){
           if(address >= 0 && address <= 255){
             mAddress = address
           }
           else{
             throw new RangeError('Address must be a value fron 1 to 247', 'modbus_slave.js', '55');
           }
         }
       })

      /**
      *Protocol data unit object
      *@type {object}
      */
      this.pdu = new PDU();
    }

}

module.exports = ADU;

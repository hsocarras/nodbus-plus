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

      //propiedad address
      this.address = 1;

      //propiedad error cheking
      this.errorCheck = Buffer.alloc(2);
    }
}

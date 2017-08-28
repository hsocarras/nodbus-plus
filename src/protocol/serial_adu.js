/**
*
*@author Hector E. Socarras.
*date 19/5/2016
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

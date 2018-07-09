/**
** bolean datatype memory.
* @module protocol/bolean_register
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a boolean memory area.
*/
class BoleanRegister {
  /**
  * Create a bolean register.
  * @param {number} size total amount of references (inputs or coils).
  */
  constructor(size = 1024){

    /**
    *core.
    *@type {Buffer}
    */
    this.registerBuffer = Buffer.alloc((size > 8) ? size/8 : 1);

    /**
    *@type {number}
    */
    this.size = size;


  }

  ReadData(dataAddress = 0){
    if(dataAddress <= this.size){

      let Byte = this.registerBuffer[Math.floor(dataAddress/8)];
      let offset = dataAddress%8;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

      return ((Byte & masks[offset]) > 0 ) ? true : false;

    }
    else{
      return undefined;
    }
  }

  WriteData(value, dataAddress = 0){
    if(dataAddress <= this.size){
      let newByte = 0x00;
      let Byte = this.registerBuffer[Math.floor(dataAddress/8)];
      let offset = dataAddress%8;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
      if(value == true || value > 0){
        newByte = Byte | masks[offset];
      }
      else {
        newByte = Byte & (~masks[offset]);
      }

      this.registerBuffer[Math.floor(dataAddress/8)] = newByte;
      return true;
    }
    else{
      return false;
    }
  }

}

module.exports = BoleanRegister;

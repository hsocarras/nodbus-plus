/**
** Word datatype memory.
* @module protocol/word_register
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a word memory area.
*/
class WordRegister {
  /**
  * Create a word register.
  * @param {number} size total amount of references (inputs or holdings registers).
  */
  constructor(size = 1024){

    /**
    *core. using litle endian encoding
    *@type {Buffer}
    */
    this.registerBuffer = Buffer.alloc(size * 2);

    /**
    *@type {number}
    */
    this.size = size;


  }

  ReadData(dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;

      return this.registerBuffer.readInt16LE(offset);
    }
    else{
      throw 'invalid address';
    }
  }

  WriteData(value, dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;
      if (typeof value == 'number') {
        this.registerBuffer.writeInt16LE(value, offset);
      }
      else{
        throw 'Invalid argument. Value must be a number'
      }

    }
    else{
      throw 'invalid address';
    }
  }

/**
*function to encode a register to send through a stream.
*@param {number} dataAddress address of register
*@return {buffer}
*/
  EncodeRegister(dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;

      let buffRegister = Buffer.alloc(2);
      buffRegister[0] = this.registerBuffer[offset + 1];
      buffRegister[1] = this.registerBuffer[offset];
      return buffRegister;
    }
    else{
      throw 'invalid address';
    }
  }

  /**
  *function to decode a register receive through a stream.
  *@param {buffer} value
  *@param {number} dataAddress address of register
  */
  DecodeRegister(value, dataAddress = 0){
      if(dataAddress <= this.size){
        let offset = dataAddress * 2;

        this.registerBuffer[offset] = value[1];
        this.registerBuffer[offset + 1] = value[0];


      }
      else{
        throw 'invalid address';
      }
    }

  SetRegister(value, dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;
      if (value instanceof Buffer && value.length == 2) {
        value.copy(this.registerBuffer, offset)
      }
      else{
        throw 'Invalid argument. Value must be a size 2 Buffer'
      }

    }
    else{
      throw 'invalid address';
    }
  }

  GetRegister(dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;

      return this.registerBuffer.slice(offset, offset + 2);
    }
    else{
      throw 'invalid address';
    }
  }
}

module.exports = WordRegister;

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

  

/**
*function to encode a register to send through a stream.
* protocol send in BE; register are store in LE
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
      return false;
    }
  }

  /**
  *function to decode a register receive through a stream.
  * protocol send in BE; register are store in LE
  *@param {buffer} value
  *@param {number} dataAddress address of register
  */
  DecodeRegister(value, dataAddress = 0){
      if(dataAddress <= this.size){
        let offset = dataAddress * 2;

        this.registerBuffer[offset] = value[1];
        this.registerBuffer[offset + 1] = value[0];
        return true;

      }
      else{
        return false;
      }
    }

/**
* function to set the register
* @param {Buffer} value a Buffer with value encode  in litleendian
* @param {number} dataAddress address of register
* @return {boolean} true if success
*/
  SetRegister(value, dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;
      if (value instanceof Buffer && value.length == 2) {
        value.copy(this.registerBuffer, offset)
        return true;
      }
      else{
        throw new typeError('Value must be a size 2 Buffer');
      }

    }
    else{
      return false;
    }
  }

/**
* function to get the register
* @param {number} dataAddress address of register
* @return {buffer}
*/
  GetRegister(dataAddress = 0){
    if(dataAddress <= this.size){
      let offset = dataAddress * 2;

      return this.registerBuffer.slice(offset, offset + 2);
    }
    else{
      return false;
    }
  }

  /**
   * function to rezise the buffer of register
   * @param {number} newSise
   */
  ReSize(newSize){
    this.registerBuffer = Buffer.alloc(newSize * 2);
  }
}

module.exports = WordRegister;

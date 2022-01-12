/**
** bolean datatype memory.
* @module protocol/bolean_register
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a boolean memory area.
*/
class BooleanRegister {
  /**
  * Create a bolean register.
  * @param {number} size total amount of references (inputs or coils).
  */
  constructor(size = 1024){

    /**
    *Implementation of modbus register
    *@type {Buffer}
    */
    let buffer_size = 1;
    if(size > 8){
      (size % 8) ? buffer_size = size/8 + 1: buffer_size = size/8;
    }
    this.registerBuffer = Buffer.alloc(buffer_size);

    /**
    *@type {number}
    */
    this.size = size;


  }

  /**
  *function to encode a register to send through a stream.
  * protocol send in BE; register are store in LE
  *@param {number} dataAddress address of register
  *@param {number} number_of_point number of registers to encode
  *@return {buffer}
  */
  EncodeRegister(dataAddress = 0, number_of_points = 1){
    if(typeof dataAddress == 'number' && typeof number_of_points == 'number'){
      if(dataAddress + number_of_points <= this.size){

        let byte_count= number_of_points % 8 ? Math.floor(number_of_points/8+1):(number_of_points/8);
        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        
        let buffRegister = Buffer.alloc(byte_count);

        for(let i = 0; i < number_of_points; i++){          
          if(this.GetValue(dataAddress + i)){            
            buffRegister[Math.floor(i/8)] = buffRegister[Math.floor(i/8)] | masks[i%8];
          }          
        }

        return buffRegister;
      }
      else{
        throw new RangeError('invalid register address or out of limit');
      }
    }
    else{
      throw new TypeError('dataAddress and number of register must be a Number')
    }
  }

  /**
  *function to decode a register receive through a stream.
  * protocol send 
  *@param {buffer} frame
  *@param {number} number_of_points amount to points encode on buffer, It's necesary because last
  *values can be 0 filled acording to modbus spec
  *@param {number} dataAddress address of register
  */
  DecodeRegister(frame, number_of_points, dataAddress = 0){
    if(frame instanceof Buffer && typeof number_of_points == 'number' && typeof dataAddress == 'number'){
      if(dataAddress + number_of_points <= this.size){

        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

        for(let i=0; i< number_of_points; i++){
          let value = frame[Math.floor(i/8)] & masks[i%8];          
          this.SetValue(value, dataAddress + i);
        }

        return true;

      }
      else{
        throw new RangeError('invalid register address or out of limit'); 
      }
    }
    else{
      throw new TypeError('dataAddress must be a Buffer and dataAddress must be a Number')
    }
  }

  /**
* function to get the register value from user app.
* The register are encoding usin litle endian
* @param {number} dataAddress address of register
* @return {boolean}
*/
  GetValue(dataAddress = 0, dataType = 'bool'){
    if(dataAddress <= this.size){

      let Byte = this.registerBuffer[Math.floor(dataAddress/8)];
      let offset = dataAddress%8;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

      return ((Byte & masks[offset]) > 0 ) ? true : false;

    }
    else{
      throw new RangeError('Invalid register. Consider Resize de register');
    }
  }

  /**
* function to write the register from user app
* @param {number or boolean} value value to write
* @param {number} dataAddress address of register
* @return {boolean} true if success
*/
  SetValue(value, dataAddress = 0, dataType = 'bool'){

    if(dataAddress <= this.size){
      if(typeof value == 'number' || typeof value == 'boolean'){

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
    else{
      return false;
    }
  }

  /**
   * function to rezise the buffer of register
   * @param {number} newSise
   * @return {number} the actual size of register
   */
  ReSize(newSize){
    if(typeof newSize == 'number'){      
      if(newSize > this.size){
        let expandBuffer = Buffer.alloc(newSize - this.size);
        this.registerBuffer = Buffer.concat([this.registerBuffer, expandBuffer], newSize)
        this.size = newSize        
      } 
    }
    return this.size
  }

}

module.exports = BooleanRegister;

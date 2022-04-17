/**
** bolean datatype memory.
* @module protocol/bolean_register
* @author Hector E. Socarras.
* @version 0.4.0
*/

const MAX_ITEM_NUMBER = 65535;

/**
 * Class representing a boolean memory area.
*/
class BooleanRegister {
  /**
  * Create a bolean register.
  * @param {number} primary_table 1 for coils 2 for inpusts.
  * @param {number} size total amount of references (inputs or coils).
  */
  constructor(primary_table, size = MAX_ITEM_NUMBER){

    /**
    *Implementation of modbus register
    *@type {Buffer}
    */
    let buffer_size = 1;
    if(size < MAX_ITEM_NUMBER){
      (size % 8) ? buffer_size = Math.ceil(size/8) : buffer_size = size/8;
      this.size = size;
    }
    else{
      buffer_size = 8192;
      this.size = MAX_ITEM_NUMBER;
    } 

    this.registerBuffer = Buffer.alloc(buffer_size);

    if(primary_table == 0){
        this.reference = 0; //reference for coils
    }
    else{
      this.reference = 1; //  //reference for inputs
    }
    

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
  DecodeRegister(frame,  dataAddress, number_of_points = 1){

    if(frame instanceof Buffer && typeof number_of_points == 'number' && typeof dataAddress == 'number'){
      if(dataAddress + number_of_points <= this.size){

        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        let value = Bufer.alloc(1);

        for(let i=0; i< number_of_points; i++){
          value[0]= frame[Math.floor(i/8)] & masks[i%8];          
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
* @return {buffer} buffValue buffer with requested register or null if register does not exits
*/
  GetValue(dataAddress = 0, registerCount = 1){

    if(dataAddress <= this.size){

      let Byte = this.registerBuffer[Math.floor(dataAddress/8)];
      let offset = dataAddress%8;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
      let buffValue = Buffer.alloc(1);

      ((Byte & masks[offset]) > 0 ) ? buffValue[0] = 0x01 : buffValue[0] = 0x00;
      return buffValue;

    }
    else{
      return null;
    }
  }

  /**
* function to write the register from user app
* @param {buffer} value value to write. if buffer[0] > 1 write true else write false
* @param {number} dataAddress address of register
* @return {boolean} true if success
*/
  SetValue(value, dataAddress = 0){

    if(dataAddress <= this.size){
      if( value instanceof Buffer){

        let newByte = 0x00;
        let Byte = this.registerBuffer[Math.floor(dataAddress/8)];  //get byte were the boolean register are
        let offset = dataAddress%8;
        let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
        if(value[0] > 0){
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

}

module.exports = BooleanRegister;

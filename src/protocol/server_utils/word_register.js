/**
** Word datatype memory.
* @module protocol/word_register
* @author Hector E. Socarras.
* @version 0.4.0
*/

const MAX_ITEM_NUMBER = 65535;

/**
* Class representing a word memory area.
*/
class WordRegister {
    /**
    * Create a word register.
    * @param {number} primary_table 3 for inputs 4 for holding registers.
    * @param {number} size total amount of references (inputs or holdings registers).
    */
    constructor(primary_table, size = MAX_ITEM_NUMBER){

      
        if(size < MAX_ITEM_NUMBER){
            this.registerBuffer = Buffer.alloc(size * 2);
            this.size = size;
        }
        else{
            this.registerBuffer = Buffer.alloc(MAX_ITEM_NUMBER * 2);
            this.size = MAX_ITEM_NUMBER;
        } 

        if(primary_table == 4){
          this.reference = 4; //reference for holdings
        }
        else{
          this.reference = 3; //  //reference for inputs
        }

    }

  

/**
*function to read a register and encoded to send through a stream.
* protocol send in H part of register first. Registers are made in byte array with each register using 2 bytes.
* low part of the register are even bytes, higth part odd bytes.
* @param {number} dataAddress address of register
* @param {number} number_of_register register's amount to read
* @return {buffer}
*/
  EncodeRegister(dataAddress = 0, number_of_register = 1){
    if(typeof dataAddress == 'number' && typeof number_of_register == 'number'){
      if(dataAddress + number_of_register <= this.size){
        let offset = dataAddress * 2;
  
        let buffRegister = Buffer.alloc(number_of_register*2);

        for(let i = 0; i <= number_of_register; i+=1){
          buffRegister[2*i] = this.registerBuffer[offset + 2*i+1];
          buffRegister[2*i + 1] = this.registerBuffer[offset + 2*i];          
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
  * protocol send in H part of register first. Registers are made in byte array with each register using 2 bytes.
  * low part of the register are even bytes, higth part odd bytes.
  *@param {buffer} value
  *@param {number} dataAddress address of register
  */
  DecodeRegister(frame, dataAddress = 0){
    if(frame instanceof Buffer && typeof dataAddress == 'number'){      
      if(dataAddress + frame.length/2 <= this.size && frame.length%2 == 0){
        let offset = dataAddress * 2;
        
        for(let i = 0; i <= frame.length; i+=2){          
          this.registerBuffer[offset + i] = frame[i+1];
          this.registerBuffer[offset + i+1] = frame[i];
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
* function to write the register from user app
* @param {buffer} value to write in register
* @param {number} dataAddress address of register
* @param {string} dataType value format. Suppoting format: bool, uint,  uint32, uint64, int,  int32, int64, float,  double.
* @return {boolean} true if success
*/
  SetValue(value, dataAddress = 0){
    if(dataAddress >= 0 && dataAddress <= this.size){
      let offset = dataAddress * 2;
      
      if (value instanceof Buffer) {
        value.copy(this.registerBuffer, offset);        
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
* function to get the register value from user app.
* The register are encoding usin litle endian
* @param {number} dataAddress address of register
* @param {string} registerCount. Number of registers to read 
* @return {buffer} buffValue buffer with requested register or null if register does not exits
*/
  GetValue(dataAddress = 0, registerCount = 1){
    let bufferValue = Buffer.alloc(registerCount*2);
    if(dataAddress >= 0 && dataAddress + registerCount <= this.size){
        this.registerBuffer.copy(bufferValue,0,2*dataAddress, 2*(dataAddress + registerCount));
        return bufferValue;
    }
    else{
      return null;
    }
  }
  
}

module.exports = WordRegister;

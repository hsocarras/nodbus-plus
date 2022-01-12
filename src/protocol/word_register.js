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
  constructor(size = 1024, endianess = 'LE'){

    /**
    *core. using litle endian encoding
    *@type {Buffer}
    */
    this.registerBuffer = Buffer.alloc(size * 2);

    /**
    *@type {number}
    */
    this.size = size;

    /**
     * endianess:
     * @type {string}
     */
    this.endianess = endianess;

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

        for(let i = 0; i <= number_of_register; i+=2){
          buffRegister[i] = this.registerBuffer[offset + i+1];
          buffRegister[i + 1] = this.registerBuffer[offset + i];
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
      if(dataAddress + frame.length/2 <= this.size){
        let offset = dataAddress * 2;
        
        for(let i = 0; i <= Math.floor(frame.length/2); i+=2){          
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
* @param {number} value to write in register
* @param {number} dataAddress address of register
* @param {string} dataType value format. Suppoting format: bool, uint,  uint32, uint64, int,  int32, int64, float,  double.
* @return {boolean} true if success
*/
  SetValue(value, dataAddress = 0, dataType = 'uint16'){
    if(dataAddress >= 0 && dataAddress <= this.size){
      let offset = dataAddress * 2;
      
      if (typeof value == 'number') {

        //selecting the apropiate datatype
        switch(dataType){          
          case 'uint16':
            if(value <= 0xFFFF && value >= 0) {
              if(this.endianess == 'BE'){
                this.registerBuffer.writeUInt16BE(value, offset);
              }
              else { 
                this.registerBuffer.writeUInt16LE(value, offset);
              }
              return true
            }                  
            else{
              return false
            }    
          case 'uint32':
              if(value <= 0xFFFFFFFF && value >= 0 && dataAddress < this.size - 1) {                
                if(this.endianess == 'BE'){
                  this.registerBuffer.writeUInt32BE(value, offset);
                }
                else { 
                  this.registerBuffer.writeUInt32LE(value, offset);
                }
                return true
              }                  
              else{
                return false
              } 
          case 'uint64':
              if(value <= 0xFFFFFFFFFFFFFFFF && value >= 0  && dataAddress < this.size - 3) {                                
                  if(this.endianess == 'BE'){
                    this.registerBuffer.writeUInt64BE(value, offset);
                  }
                  else { 
                    this.registerBuffer.writeUInt64LE(value, offset);
                  }                
                return true
              }                  
              else{
                return false
              } 
          case 'int16':            
            if(value <= 0x7FFF-1 && value >= -32768) {
              if(this.endianess == 'BE'){
                this.registerBuffer.writeInt16BE(value, offset);
              }
              else { 
                this.registerBuffer.writeInt16LE(value, offset); 
              }             
              return true
            }                  
            else{
              return false
            }
          case 'int32':
              if(value <= 0x7FFFFFFF-1 && value >= -0x80000000 && dataAddress < this.size - 1) {
                if(this.endianess == 'BE'){
                  this.registerBuffer.writeInt32BE(value, offset);
                }
                else { 
                  this.registerBuffer.writeInt32LE(value, offset); 
                }                  
                return true
              }                  
              else{
                return false
              }
          case 'int64':
              if(value <= 0x7FFFFFFFFFFFFFFF-1 && value >= -0x8000000000000000  && dataAddress < this.size - 3) {
                if(this.endianess == 'BE'){
                  this.registerBuffer.writeInt64BE(value, offset);
                }
                else { 
                  this.registerBuffer.writeInt64LE(value, offset); 
                }                
                return true
              }                  
              else{
                return false
              } 
          case 'float':
              if(dataAddress < this.size - 1) {
                if(this.endianess == 'BE'){
                  this.registerBuffer.writeFloatBE(value, offset);
                }
                else { 
                  this.registerBuffer.writeFloatLE(value, offset); 
                }                  
                return true
              }                  
              else{
                return false
              }
          case 'double':
              if(dataAddress < this.size - 3) {
                if(this.endianess == 'BE'){
                  this.registerBuffer.writeDoubleBE(value, offset);
                }
                else { 
                  this.registerBuffer.writeDoubleLE(value, offset); 
                }                
                return true
              }                  
              else{
                return false
              }            
          default:
              throw new Error('invalid dataType'+ dataType);              
        }
      }
      else{
        throw new TypeError('Value must be a number');
      }
    }
    else{
      throw new RangeError('Invalid register. Consider Resize de register');
    }
  }

/**
* function to get the register value from user app.
* The register are encoding usin litle endian
* @param {number} dataAddress address of register
* @param {string} dataType value format. Suppoting format: uint,  uint32, uint64, int,  int32, int64, float,  double.
* @return {number}
*/
  GetValue(dataAddress = 0, dataType = 'uint16'){
    if(dataAddress >= 0 && dataAddress <= this.size){
      let offset = dataAddress * 2;

      //selecting the apropiate datatype
      switch(dataType){          
        case 'uint16':  
            if(this.endianess == 'BE'){
              return this.registerBuffer.readUInt16BE(offset);
            }
            else { 
              return this.registerBuffer.readUInt16LE(offset);
            }    
        case 'uint32':
            if(dataAddress < this.size - 1) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readUInt32BE(offset);
              }
              else { 
                return this.registerBuffer.readUInt32LE(offset);
              }                             
            }                  
            else{
              return null
            } 
        case 'uint64':
            if(dataAddress < this.size - 3) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readUInt64BE(offset);
              }
              else { 
                return this.registerBuffer.readUInt64LE(offset);
              }                           
            }                  
            else{
              return null
            } 
        case 'int16':
            if(this.endianess == 'BE'){
              return this.registerBuffer.readInt16BE(offset);
            }
            else { 
              return this.registerBuffer.readInt16LE(offset);
            }                       
        case 'int32':
            if(dataAddress < this.size - 1) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readInt32BE(offset);
              }
              else { 
                return this.registerBuffer.readInt32LE(offset);
              }                
            }                  
            else{
              return null
            }
        case 'int64':
            if(dataAddress < this.size - 3) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readInt64BE(offset);
              }
              else { 
                return this.registerBuffer.readInt64LE(offset);
              }                
            }                  
            else{
              return null
            } 
        case 'float':
            if(dataAddress < this.size - 1) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readFloatLE(offset);
              }
              else { 
                return this.registerBuffer.readFloatLE(offset);
              }                              
            }                  
            else{
              return null
            }
        case 'double':
            if(dataAddress < this.size - 3) {
              if(this.endianess == 'BE'){
                return this.registerBuffer.readDoubleBE(offset);
              }
              else { 
                return this.registerBuffer.readDoubleLE(offset);
              }                           
            }                  
            else{
              return null
            }            
        default:
            throw new Error('invalid dataType'+ dataType);              
      }      
    }
    else{
      throw new RangeError('Invalid register. Consider Resize de register');
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
        let expandBuffer = Buffer.alloc(2*(newSize - this.size))
        this.registerBuffer = Buffer.concat([this.registerBuffer, expandBuffer], 2*newSize)
        this.size = newSize
      } 
    }
    return this.size   
  }
}

module.exports = WordRegister;

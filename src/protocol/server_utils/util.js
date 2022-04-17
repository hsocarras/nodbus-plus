
class Utils {
    constructor(){}

    static GetBufferFromValue(value, endianness = 'LE'){
    

    if(typeof value === 'boolean'){
        let buffValue = Buffer.alloc(1);
        if(value > 0) {
          buffValue[0] = 1;
        }                  
        else{
          buffValue[0] = 0;
        }
        return buffValue 
    }
    else if(typeof value === 'number'){
        let buffValue;
        if(Number.isInteger(value)){
            //signed integer secction
            if(value > 0){
                if(value <= 0x7F){
                    buffValue = Buffer.alloc(1);
                    buffValue.writeInt8(value)
                    return buffValue;
                }
                if(value <= 0xFF){
                    buffValue = Buffer.alloc(1);
                    buffValue.writeUInt8(value)
                    return buffValue;
                }
                if(value <= 0x7FFF){
                    buffValue = Buffer.alloc(2);
                    if(endianness == 'BE'){
                      buffValue.writeInt16BE(value);
                    }
                    else { 
                      buffValue.writeInt16LE(value);
                    }                    
                    return buffValue;
                }
                if(value <= 0xFFFF){
                  buffValue = Buffer.alloc(2);
                  if(endianness == 'BE'){
                    buffValue.writeUInt16BE(value);
                  }
                  else { 
                    buffValue.writeUInt16LE(value);
                  }                   
                  return buffValue;
                }
                if(value <= 0x7FFFFFFF){
                  buffValue = Buffer.alloc(4);
                  if(endianness == 'BE'){
                    buffValue.writeInt32BE(value);
                  }
                  else { 
                    buffValue.writeInt32LE(value);
                  }                   
                  return buffValue;
                }
                if(value <= 0xFFFFFFFF){
                  buffValue = Buffer.alloc(4);
                  if(endianness == 'BE'){
                    buffValue.writeUInt32BE(value);
                  }
                  else { 
                    buffValue.writeUInt32LE(value);
                  }                  
                  return buffValue;
                }
                
            }
            else{
                if(value >= -128){
                  buffValue = Buffer.alloc(1);
                  buffValue.writeInt8(value)
                  return buffValue;
                }
                if(value >= -32768){
                    buffValue = Buffer.alloc(2);
                    if(endianness == 'BE'){
                      buffValue.writeInt16BE(value);
                    }
                    else { 
                      buffValue.writeInt16LE(value);
                    } 
                    return buffValue;
                }
                if(value >= -2147483648){
                  buffValue = Buffer.alloc(4);
                  if(endianness == 'BE'){
                    buffValue.writeInt32BE(value);
                  }
                  else { 
                    buffValue.writeInt32LE(value);
                  } 
                  return buffValue;
                }
            }
        }
        else{
            //Real secction
            try{
                buffValue = Buffer.alloc(4);
                if(endianness == 'BE'){
                    buffValue.writeFloatBE(value);
                }
                else { 
                    buffValue.writeFloatLE(value);
                } 
                return buffValue;                
            }
            catch(e){
                buffValue = Buffer.alloc(8);
                if(endianness == 'BE'){
                    buffValue.writeDoubleBE(value);
                }
                else { 
                    buffValue.writeDoubleLE(value);
                } 
                return buffValue;   
            }
        }
    }
    else if(typeof value === 'bigint'){
        if(value > 0n){
            buffValue = Buffer.alloc(8);
            if(endianness == 'BE'){
                buffValue.writeBigUInt64BE(value);
            }
            else { 
                buffValue.writeBigUInt64LE(value);
            } 
            return buffValue; 
        }
        else{
            buffValue = Buffer.alloc(8);
            if(endianness == 'BE'){
                buffValue.writeBigInt64BE(value);
            }
            else { 
                buffValue.writeBigInt64LE(value);
            } 
            return buffValue; 
        }
    }
    else if(typeof value === 'string'){
        return Buffer.from(value);
    }
    else{
        return null;
    }
    }

    static GetValueFromBuffer(buffValue, dataType, endianness){
        
        if(buffValue instanceof Buffer){
            //selecting the apropiate datatype
            switch(dataType){
                case 'bool':
                    if(buffValue[0] > 0) {
                        return true;
                    }                  
                    else{
                        return false;
                    }  
                case 'int8':
                        if(this.endianness == 'BE'){
                            return buffValue.readInt8(1);
                        }
                        else { 
                            return buffValue.readInt8(0);
                        }                      
                case 'uint8':
                        if(this.endianness == 'BE'){
                            return buffValue.readUInt8(1); 
                        }
                        else { 
                            return buffValue.readUInt8(0); 
                        }                     
                case 'int16': 
                    if(this.endianness == 'BE'){
                        return buffValue.readInt16BE(0);
                    }
                    else { 
                        return buffValue.readInt16LE(0);
                    }     
                case 'uint16':
                    if(this.endianness == 'BE'){
                        return buffValue.readUInt16BE(0);
                    }
                    else { 
                        return buffValue.readUInt16LE(0);
                    } 
                case 'int32':
                    if(this.endianness == 'BE'){
                        return buffValue.readInt32BE(0);
                    }
                    else { 
                        return buffValue.readInt32LE(0);
                    }    
                case 'uint32':
                    if(this.endianness == 'BE'){
                        return buffValue.readUInt32BE(0);
                    }
                    else { 
                        return buffValue.readUInt32LE(0);
                    } 
                case 'int64':
                    if(this.endianness == 'BE'){
                        return buffValue.readBigInt64BE(0);
                    }
                    else { 
                        return buffValue.readBigInt64LE(0);
                    } 
                case 'uint64':
                    if(this.endianness == 'BE'){
                        return buffValue.readBigUInt64BE(0);
                    }
                    else { 
                        return buffValue.readBigUInt64LE(0);
                    }           
                case 'float':
                    if(this.endianness == 'BE'){
                        return buffValue.readFloatBE(0);
                    }
                    else { 
                        return buffValue.readFloatLE(0);
                    } 
                case 'double':
                    if(this.endianness == 'BE'){
                        return buffValue.readDoubleBE(0);
                    }
                    else { 
                        return buffValue.readDoubleLE(0);
                    } 
              case 'string':
                  return buffValue.toString();
              default:
                  return null;              
            }
        }
        else{
            return null;
        }
        
    }

}

module.exports =  Utils;
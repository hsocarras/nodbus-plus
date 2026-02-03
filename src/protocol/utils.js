/**
 * Calculates the CRC-16 checksum for a Modbus RTU frame.
 *
 * This function implements the standard Modbus CRC-16 algorithm, which is used to ensure data integrity
 * in Modbus RTU communication. The CRC is computed over all bytes of the frame except the last two bytes,
 * which are reserved for the CRC itself.
 *
 * @param {Buffer} frame - The complete Modbus RTU frame (including the CRC bytes).
 * @returns {number} The computed CRC-16 value as an unsigned 16-bit integer (low byte first).
 *
 * @example
 * const frame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00]);
 * const crc = calcCRC(frame);
 * // crc will contain the CRC-16 value for the given frame
 */
function calcCRC(frame){
  
    var crc_hi = 0xFF;
    var crc_lo = 0xFF;
    var index;

    var auxcrc_hi = [0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
         0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
         0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01,
         0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
         0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81,
         0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
         0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01,
         0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
         0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
         0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
         0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01,
         0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
         0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
         0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
         0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01,
         0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
         0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81,
                    0x40];

    var auxcrc_lo = [0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06, 0x07, 0xC7, 0x05, 0xC5, 0xC4,
         0x04, 0xCC, 0x0C, 0x0D, 0xCD, 0x0F, 0xCF, 0xCE, 0x0E, 0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09,
         0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9, 0x1B, 0xDB, 0xDA, 0x1A, 0x1E, 0xDE, 0xDF, 0x1F, 0xDD,
         0x1D, 0x1C, 0xDC, 0x14, 0xD4, 0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
         0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3, 0xF2, 0x32, 0x36, 0xF6, 0xF7,
         0x37, 0xF5, 0x35, 0x34, 0xF4, 0x3C, 0xFC, 0xFD, 0x3D, 0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A,
         0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38, 0x28, 0xE8, 0xE9, 0x29, 0xEB, 0x2B, 0x2A, 0xEA, 0xEE,
         0x2E, 0x2F, 0xEF, 0x2D, 0xED, 0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
         0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60, 0x61, 0xA1, 0x63, 0xA3, 0xA2,
         0x62, 0x66, 0xA6, 0xA7, 0x67, 0xA5, 0x65, 0x64, 0xA4, 0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F,
         0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB, 0x69, 0xA9, 0xA8, 0x68, 0x78, 0xB8, 0xB9, 0x79, 0xBB,
         0x7B, 0x7A, 0xBA, 0xBE, 0x7E, 0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
         0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71, 0x70, 0xB0, 0x50, 0x90, 0x91,
         0x51, 0x93, 0x53, 0x52, 0x92, 0x96, 0x56, 0x57, 0x97, 0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C,
         0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E, 0x5A, 0x9A, 0x9B, 0x5B, 0x99, 0x59, 0x58, 0x98, 0x88,
         0x48, 0x49, 0x89, 0x4B, 0x8B, 0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
         0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42, 0x43, 0x83, 0x41, 0x81, 0x80,
                    0x40];

    for(var i = 0; i< frame.length-2; i++) {
        index = crc_hi ^ frame[i];
        crc_hi = crc_lo ^ auxcrc_hi[index];
        crc_lo = auxcrc_lo[index];
    }
    return (crc_hi << 8 | crc_lo);

}

/**
 * Calculates the LRC (Longitudinal Redundancy Check) for a Modbus ASCII frame.
 *
 * The LRC is used for error checking in Modbus ASCII communication. This function computes the LRC
 * by summing all data bytes (converted from ASCII hex pairs), taking the two's complement, and returning
 * the result as an unsigned 8-bit integer.
 *
 * @param {Buffer} frame - The complete Modbus ASCII frame buffer.
 * @returns {number} The computed LRC value as an unsigned 8-bit integer.
 *
 * @example
 * const asciiFrame = Buffer.from(':010300000002FA\r\n');
 * const lrc = calcLRC(asciiFrame);
 * // lrc will contain the LRC value for the given frame
 */
function calcLRC(frame){

    var bufferBytes = Buffer.alloc(Math.floor((frame.length-5)/2));
    var  byteLRC = Buffer.alloc(1);

    for(var i = 0; i < bufferBytes.length; i++){
        bufferBytes[i]=Number('0x'+ frame.toString('ascii',2*i+1 ,2*i+3));
    }

    for(var i = 0; i < bufferBytes.length;i++){
        byteLRC[0] = byteLRC[0] + bufferBytes[i];
    }

    var lrc_temp = Buffer.alloc(1);
    lrc_temp[0] = -byteLRC[0];
    var lrc = lrc_temp.readUInt8(0)
    return lrc;

}

/**
 * Converts an 8-bit unsigned integer to a 2-character uppercase hexadecimal Buffer.
 *
 * This function takes a number between 0 and 255 and returns a Buffer of length 2,
 * where each byte represents the ASCII code of the hexadecimal digits (MSB first).
 *
 * @param {number} uint8Val - The 8-bit unsigned integer to convert (0-255).
 * @returns {Buffer} A Buffer of length 2 containing the ASCII hex representation.
 *
 * @example
 * const buf = valByte2Chars(0xAB); // Buffer [0x41, 0x42] => 'AB'
 */
function valByte2Chars (uint8Val){

    const hex = uint8Val.toString(16).toUpperCase().padStart(2, '0');
    return Buffer.from(hex, 'ascii');
}

/**
 * Generates a 4-byte buffer containing the AND and OR masks for the Modbus "Mask Write Register" (FC=22) function.
 *
 * The function takes an array representing the desired states for each of the 16 bits in a register.
 * The array index corresponds to the bit number (index 0 = LSB).
 * - `1`: Force the bit to 1.
 * - `0`: Force the bit to 0.
 * - `-1` or `undefined`: Leave the bit unchanged.
 *
 * The function calculates the AND and OR masks according to the Modbus specification:
 * `New Value = (Current Value AND AND_Mask) OR (OR_Mask AND (NOT AND_Mask))`
 *
 * @param {Array<1|0|-1|undefined>} valueArray - An array of up to 16 values representing the desired bit states.
 * @returns {Buffer} A 4-byte buffer containing the AND mask and OR mask for the Modbus 0x16 function.
 *
 * @example
 * // To force bit 0 to 1, bit 1 to 0, and leave all others unchanged:
 * const valueArray = [1, 0]; // Bit 0 -> 1, Bit 1 -> 0
 * const maskBuf = getMaskRegisterBuffer(valueArray);
 * // maskBuf will contain AND_Mask = 0xFFFC, OR_Mask = 0x0001
 */
function getMaskRegisterBuffer(valueArray){

    let value = Buffer.alloc(4);
    let AND_Mask = 0;
    let OR_Mask = 0xFFFF;
    let tempMask = 1;    

    for (let i = 0; i < 16; i++){
        
        if(valueArray[i] == 1){
        //AND_MASK = 0;
        //OR_Mask = 1;              
        }
        else if(valueArray[i] == 0){ 
            //AND_MASK = 0;  
            //OR_MASK = 0     
            OR_Mask = OR_Mask  & (~tempMask);   //temp mask negated is 1111 1110 for i = 0
          
        }
        else{
            //AND_MASK = 1; 
            AND_Mask = AND_Mask | tempMask;         
        }
        
        tempMask = tempMask << 1; 
    }   

    value.writeUInt16BE(AND_Mask);
    value.writeUInt16BE(OR_Mask, 2);

    return value;

}

/**
 * Converts an array of boolean values to a Buffer, encoding each boolean as a single bit.
 *
 * The resulting Buffer packs the boolean values into bytes, with the first boolean in the least significant bit
 * of the first byte, the second boolean in the next bit, and so on. If the array length is not a multiple of 8,
 * the last byte will be partially filled with 0.
 *
 * @param {boolean[]} boolArray - Array of boolean values to encode.
 * @returns {Buffer} Buffer containing the packed bits.
 *
 * @example
 * // [true, false, true, true, false, false, false, true] => 0b10001101 => Buffer [0x8D]
 * const buf = boolsToBuffer([true, false, true, true, false, false, false, true]);
 */
function boolsToBuffer(boolArray){

    const bufLength = Math.ceil(boolArray.length / 8);
    const bufValue = Buffer.alloc(bufLength, 0);   

    for(i = 0; i < boolArray.length; i++){       

        if(boolArray[i]){     
            let byteIndex = Math.floor(i / 8);
            let bitOffset = i % 8;       
            bufValue[byteIndex] |= (1 << bitOffset);          
        }
        
    }

    return bufValue;
}


/**
 * Converts a Modbus ASCII frame to an equivalent RTU frame.
 *
 * This function removes the starting colon (':'), LRC, and ending characters (CR, LF)
 * from the ASCII frame, converts the ASCII hex pairs to bytes, and appends a CRC.
 *
 * @param {Buffer} asciiFrame - The Modbus ASCII frame buffer.
 * @returns {Buffer} The equivalent Modbus RTU frame buffer.
 *
 * @example
 * // Example ASCII frame: ':010300000002FA\r\n'
 * const rtuFrame = aduAsciiToRtu(Buffer.from(':010300000002FA\r\n'));
 */
function aduAsciiToRtu(asciiFrame){
    // Validate input
    if (!Buffer.isBuffer(asciiFrame) || asciiFrame.length < 7) {
        throw new Error('Invalid ASCII frame');
    }
        
    // Calculate RTU frame length: (asciiFrame.length - 1 (:) - 4 (LRC + CRLF)) / 2
    const rtuLength = (asciiFrame.length - 5) / 2;
    const rtuFrame = Buffer.alloc(rtuLength + 2); // +2 for CRC
    
    //droping first character (:), lrc and ending character(CR, LF) see Mover over serial line 1.02 b
    for(let i = 0; i < rtuLength; i++){
        rtuFrame[i] = Number('0x'+ asciiFrame.toString('ascii', 2*i + 1 , 2*i + 3));
    }
    
    let crc = calcCRC(rtuFrame);
    rtuFrame.writeUInt16BE(crc,rtuLength);

    return rtuFrame;

}

/**
 * Converts a Modbus RTU frame to an equivalent ASCII frame.
 *
 * This function takes a Modbus RTU frame (Buffer), converts each byte to its ASCII hexadecimal representation,
 * prepends a colon (':'), appends the LRC (Longitudinal Redundancy Check) as two ASCII hex characters,
 * and ends with CRLF ("\r\n"). The LRC is calculated over all bytes except the CRC (last two bytes).
 *
 * @param {Buffer} rtuFrame - The Modbus RTU frame buffer.
 * @returns {Buffer} The equivalent Modbus ASCII frame buffer.
 *
 * @example
 * // Example RTU frame: <Buffer 01 03 00 00 00 02 c4 0b>
 * const asciiFrame = aduRtuToAscii(Buffer.from([0x01,0x03,0x00,0x00,0x00,0x02,0xC4,0x0B]));
 * // asciiFrame: <Buffer 3a 30 31 30 33 30 30 30 30 30 30 30 32 38 38 0d 0a>
 */
function aduRtuToAscii(rtuFrame){

    if (!Buffer.isBuffer(rtuFrame)) {
        throw new Error('Invalid RTU frame');
    }

    // Exclude CRC (last 2 bytes) for LRC calculation
    const dataLength = rtuFrame.length - 2;
    const asciiLength = 1 + (dataLength + 1) * 2 + 2; // ':' + (data bytes + LRC) * 2 + CRLF
    const asciiFrame = Buffer.alloc(asciiLength);
    
    asciiFrame[0] = 0x3A;       // ASCII ':'

    let lrc = 0; // Initialize LRC
    // Convert data bytes to ASCII hex and calculate LRC
    for (let i = 0; i < dataLength; i++) {
        lrc = (lrc + rtuFrame[i]) & 0xFF;
        const hex = rtuFrame[i].toString(16).toUpperCase().padStart(2, '0');
        asciiFrame.write(hex, 1 + i * 2, 2, 'ascii');
    }
    

    // LRC: two's complement
    lrc = ((-lrc) & 0xFF);
    const lrcHex = lrc.toString(16).toUpperCase().padStart(2, '0');
    asciiFrame.write(lrcHex, 1 + dataLength * 2, 2, 'ascii');

    asciiFrame[asciiLength - 2] = 0x0D; // '\r'
    asciiFrame[asciiLength - 1] = 0x0A; // '\n'

    return asciiFrame;
}

/**
 * Reads a 2-byte word from a buffer at the specified word offset.
 *
 * This function returns a Buffer containing two bytes starting at the given word offset (offset * 2).
 * It is useful for extracting 16-bit values from a Modbus buffer.
 *
 * @param {Buffer} targetBuffer - The buffer to read from.
 * @param {number} [offset=0] - The word offset (not byte offset) to read from.
 * @returns {Buffer} A Buffer of length 2 containing the word value.
 * @throws {RangeError} If the offset is out of the buffer's bounds.
 *
 * @example
 * const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);
 * const word = getWordFromBuffer(buf, 1); // Buffer [0x56, 0x78]
 */
function getWordFromBuffer(targetBuffer, offset = 0){

    if(offset < targetBuffer.length / 2){
      
      let value = Buffer.alloc(2);
      value[0] = targetBuffer[offset * 2];
      value[1] = targetBuffer[offset*2 + 1];

      return value;

    }
    else{
      throw new RangeError("offset is out of buffer bounds");
    }
}

/**
 * Writes a 2-byte word value into a buffer at the specified word offset.
 *
 * This function copies two bytes from the `value` buffer into the `targetBuffer`
 * starting at the given word offset (offset * 2). It is useful for setting 16-bit values
 * in a Modbus buffer.
 *
 * @param {Buffer} value - A Buffer of length 2 containing the word to write.
 * @param {Buffer} targetBuffer - The buffer to write into.
 * @param {number} [offset=0] - The word offset (not byte offset) to write at.
 * @throws {RangeError} If the offset is out of the buffer's bounds.
 *
 * @example
 * const buf = Buffer.alloc(4);
 * setWordToBuffer(Buffer.from([0x12, 0x34]), buf, 1);
 * // buf is now <Buffer 00 00 12 34>
 */
function setWordToBuffer(value, targetBuffer, offset = 0){

  if(offset < targetBuffer.length / 2){        
   
      targetBuffer[offset * 2] = value[0];
      targetBuffer[offset*2 + 1] = value[1];


  }
  else{
    throw new RangeError("offset is out of buffer bounds");
  }
}

module.exports.calcCRC = calcCRC;

module.exports.calcLRC = calcLRC;

module.exports.valByteToChars = valByte2Chars;

module.exports.getMaskRegisterBuffer = getMaskRegisterBuffer;

module.exports.boolsToBuffer = boolsToBuffer;

module.exports.aduAsciiToRtu = aduAsciiToRtu;

module.exports.aduRtuToAscii = aduRtuToAscii;

module.exports.getWordFromBuffer = getWordFromBuffer;

module.exports.setWordToBuffer = setWordToBuffer

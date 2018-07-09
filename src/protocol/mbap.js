/**
** Modbus Protocol Data Unit base class.
* @module protocol/mbap
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a modbus tcp header.
*/
class MBAP {
  /**
  * Create MBAP.
  * @param {Buffer} mbapRaw fragment off modbus tcp frame corresponding to header.
  */
  constructor(mbapRaw = Buffer.alloc(7)){

    //buffer with raw header
    this.mbapBuffer = mbapRaw;

    this.transactionID =0x0;
    this.protocolID = 0x0;
    this.length = 0x0;
    this.unitID = 0x0;
  }

  /**
  * function to make mbap frame from  function and data fields
  */
  MakeBuffer(){

      var buff = Buffer.alloc(7);
      buff.writeUInt16BE(this.transactionID,0);
      buff.writeUInt16BE(this.protocolID,2);
      buff.writeUInt16BE(this.length,4);
      buff.writeUInt8(this.unitID,6);

      this.mbapBuffer = buff;

  }

  /**
  *function to parse the mbap buffer to extract function and data fields
  * @throws {string}
  */
  ParseBuffer(){
      if(this.mbapBuffer.length == 7){
        this.transactionID = this.mbapBuffer.readUInt16BE(0);
        this.protocolID = this.mbapBuffer.readUInt16BE(2);
        this.length = this.mbapBuffer.readUInt16BE(4);
        this.unitID = this.mbapBuffer.readUInt8(6);
      }
      else{
        throw new Error('wrong mbap buffer');
      }
  }

}

module.exports = MBAP;

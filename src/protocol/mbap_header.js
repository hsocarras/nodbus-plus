/**
** Modbus Protocol Data Unit base class.
* @module protocol/mbap
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a modbus tcp header.
*/
class MBAP_Header {
  /**
  * Create MBAP.
  * @param {Buffer} mbHeaderRaw fragment off modbus tcp frame corresponding to header.
  */
  constructor(mbHeaderRaw = Buffer.alloc(7)){

    //buffer with raw header
    this.mbHeaderBuffer = mbHeaderRaw;

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

      this.mbHeaderBuffer = buff;

  }

  /**
  *function to parse the mbap buffer to extract function and data fields
  * @return {bool} true if success
  */
  ParseBuffer(){
      if(this.mbHeaderBuffer.length == 7){
        this.transactionID = this.mbHeaderBuffer.readUInt16BE(0);
        this.protocolID = this.mbHeaderBuffer.readUInt16BE(2);
        this.length = this.mbHeaderBuffer.readUInt16BE(4);
        this.unitID = this.mbHeaderBuffer.readUInt8(6);
        return true;
      }
      else{
        return false;
      }
  }

}

module.exports = MBAP_Header;

/**
** Modbus Protocol Data Unit base class.
* @module protocol/pdu
* @author Hector E. Socarras.
* @version 0.4.0
*/

/**
 * Class representing a modbus protocol data unit.
*/
class PDU {
  /**
  * Create a PDU.
  * @param {Buffer} pduRaw fragment off modbus frame corresponding to pdu.
  */
  constructor(pduRaw = Buffer.alloc(1)){

    /**
    *Frame
    *@type {Buffer}
    */
    this.pduBuffer = pduRaw;

    /**
    *modbus function
    *@type {number}
    */
    this.modbus_function = null;

    /**
    *Frame data segment
    *@type {Buffer}
    */
    this.modbus_data = Buffer.alloc(1);

  }

  /**
  * function to make pdu frame from  function and data fields
  */
  MakeBuffer(){

      var buff = Buffer.alloc(this.modbus_data.length + 1);
      buff[0] = this.modbus_function;
      this.modbus_data.copy(buff,1);
      this.pduBuffer = buff;

  }

  /**
  *function to parse the pdu buffer to extract function and data fields
  * @returns {bool} true if success
  */
  ParseBuffer(){

      this.modbus_function = this.pduBuffer[0];

      //creando el buffer de datos
      if(this.pduBuffer.length > 1){
          this.modbus_data = Buffer.alloc(this.pduBuffer.length-1);
          this.pduBuffer.copy(this.modbus_data,0,1);
          return true;
      }
      else if (this.pduBuffer.length == 1){
          this.modbus_data = Buffer.alloc(0);
          return true;
      }
      else{
        return false;
      }
      
      
     
  }

  /**
  *function to claculate the pdu buffer length based on data property
  * @returns {number} the length  calculate for pdu buffer
  */
  GetLength(){
    return this.modbus_data.length + 1;
  }

  static MaxLength = 253;
}

module.exports = PDU

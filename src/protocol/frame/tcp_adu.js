/**
** Modbus TCP Aplication Data Unit base class.
* @module protocol/tcp_adu
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ADU = require('./adu');
const MBAP = require('./mbap');

/**
 * Class representing a modbus tcp aplication data unit.
 * @extends ADU
*/
class TcpADU extends ADU {
  /**
  * Create a ADU.
  * @param {Buffer} aduRaw Frame modbus.
  */
  constructor(aduRaw = Buffer.alloc(1)){
    super(aduRaw);

    this.transactionCounter = 0;

    /**
    * Header of frame modbus tcp
    * @type {object}
    */
    this.mbap = new MBAP();
  }

/**
* function to make adu frame from  MBAP and PDU object
*/
  MakeBuffer(){

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //creando en buffer del mbap
      this.mbap.transactionID = this.transactionCounter;
      this.mbap.protocolID = 0;
      this.mbap.length = this.pdu.pduBuffer.length+1;
      this.mbap.unitID = this.address;
      this.mbap.MakeBuffer();

      var buff = Buffer.alloc(this.pdu.pduBuffer.length+this.mbap.mbapBuffer.length);

      this.mbap.mbapBuffer.copy(buff);
      this.pdu.pduBuffer.copy(buff,7);

      this.aduBuffer = buff;
  }

  /**
  *function to parse the adu buffer to make MBAP and PDU object
  * @throws {string}
  */
  ParseBuffer() {

      if(this.aduBuffer.length > 7) {
        try {
          this.mbap.mbapBuffer = this.aduBuffer.slice(0,7);
          this.mbap.ParseBuffer();          
          this.address = this.mbap.unitID;
          this.pdu.pduBuffer = this.aduBuffer.slice(7, 6 + this.mbap.length);
          this.pdu.ParseBuffer();
          
        }
        catch(err)
        {
          throw err;
        }
      }
      else {
          throw new Error('adu buffer not contain a valid frame');
      }

  }


}

module.exports = TcpADU;

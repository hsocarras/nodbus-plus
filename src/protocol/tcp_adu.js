/**
** Modbus TCP Aplication Data Unit base class.
* @module protocol/tcp_adu
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ADU = require('./adu');
const MBAP_Header = require('./mbap_header');

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
    this.mbapHeader = new MBAP_Header();
  }

/**
* function to make adu frame from  MBAP and PDU object
*/
  MakeBuffer(){

      //creando el buffer de la pdu
      this.pdu.MakeBuffer();

      //creando en buffer del mbap     
      this.mbapHeader.length = this.pdu.pduBuffer.length+1;      
      this.mbapHeader.MakeBuffer();

      var buff = Buffer.alloc(this.pdu.pduBuffer.length+this.mbapHeader.mbHeaderBuffer.length);

      this.mbapHeader.mbHeaderBuffer.copy(buff);
      this.pdu.pduBuffer.copy(buff,7);

      this.aduBuffer = buff;
  }

  /**
  *function to parse the adu buffer to make MBAP and PDU object
  * @return {bool} True if success
  */
  ParseBuffer() {

      if(this.aduBuffer.length > 7) {

          let mbapHeaderOK
          let pduOK
        
          this.mbapHeader.mbHeaderBuffer = this.aduBuffer.slice(0,7);
          mbapHeaderOK = this.mbapHeader.ParseBuffer();          
          this.address = this.mbapHeader.unitID;
          this.pdu.pduBuffer = this.aduBuffer.slice(7, 6 + this.mbapHeader.length);
          pduOK = this.pdu.ParseBuffer();
        
          return mbapHeaderOK & pduOK;  
      }
      else {
          return false;
      }

  }


}

module.exports = TcpADU;

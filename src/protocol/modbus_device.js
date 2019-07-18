/**
** Modbus device module.
* @module protocol/modbus-device
* @author Hector E. Socarras.
* @version 0.4.0
*/

const EventEmitter = require('events');
const PDU = require('./pdu');

/**
 * Class representing a modbus device.
 * @extends EventEmitter
*/
class ModbusDevice extends EventEmitter {
	/**
  * Create a Modbus Device.
  */
	constructor(){
        super();
      
            
    }

  /**
   * Function to create a new protocol data unit
   * @return {object} PDU
   */
  CreatePDU() {
    return new PDU();
  }  

}

module.exports = ModbusDevice;

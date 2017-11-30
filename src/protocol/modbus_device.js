/**
** Modbus device module.
* @module protocol/modbus-device
* @author Hector E. Socarras.
* @version 0.4.0
*/

const EventEmitter = require('events');

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

}

module.exports = ModbusDevice;

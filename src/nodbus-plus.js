/**
 * Nodbus module.
 * @module nodbus
 * @author Hector E. Socarras Cabrera
 * @version 0.14.0
*/


const ModbusTcpServer = require('./server/mb_tcp_server');
//const ModbusTcpClient = require('./client/m_tcp_client');
//const ModbusSerialServer = require('./server/m_serial_server');
//const ModbusSerialClient = require('./client/m_serial_client');
//const ModbusMaster = require('./protocol/modbus_master');
//const ModbusSlave = require('./protocol/modbus_slave');


/**
 * ModbusTcpServer.
 * @module nodbus/ModbusTcpServer
 */
/** Constructor for ModbusTcpServer Class. */
//module.exports.ModbusTcpServer = ModbusTcpServer;

/**
 * ModbusSerialServer.
 * @module nodbus/ModbusSerialServer
 */
/** Constructor for ModbusSerialServer Class. */
//module.exports.ModbusSerialServer = ModbusSerialServer;

/**
 * ModbusSlave.
 * @module nodbus/ModbusSlave
 */
/** Constructor for ModbusSlave base Class. */
//module.exports.ModbusSlave = ModbusSlave;

/**
 * ModbusTcpClient.
 * @module nodbus/ModbusTcpClient
 */
/** Constructor for ModbusTcpClient Class. */
//module.exports.ModbusTcpClient = ModbusTcpClient;

/**
 * ModbusSerialClient.
 * @module nodbus/ModbusSerialClient
 */
/** Constructor for ModbusTcpClient Class. */
//module.exports.ModbusSerialClient = ModbusSerialClient;

/**
 * ModbusMaster.
 * @module nodbus/ModbusMaster
 */
/** Constructor for ModbusMaster Class. */
//module.exports.ModbusMaster = ModbusMaster;

/**
* Create a Slave instance
* @param {number|string} port tcp port or string indicating serial port.
* @param {string} tp transport layer. Can be 'tcp', 'udp4', 'udp6'
* @param {number} modbusAddress modbus addres 1 to 247 for serial slave or tcp for ethernet.
* @param {string} mode Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.CreateTcpServer = function (server_cfg){

  var server = new ModbusTcpServer(server_cfg);
  
  return server;

}

/**
* Create a Slave instance

* @param {string} tp transport layer. Can be 'tcp', 'udp4', 'udp6'
* @param {string} mode Serial or TCP.
* @return {Object} Master object
*/
module.exports.CreateMaster = function (tp = 'tcp', mode = 'tcp'){

  switch(tp){
    case 'tcp':
        if(mode == 'serial'){
          return new ModbusSerialClient('tcp');
        }
        else{
          return new ModbusTcpClient('tcp');
        }
      break;
    case 'udp4':
        if(mode == 'serial'){
          return new ModbusSerialClient('udp4');
        }
        else{
          return new ModbusTcpClient('udp4');
        }
      break;
    case 'udp6':
        if(mode == 'serial'){
          return new ModbusSerialClient('udp6');
        }
        else{
          return new ModbusTcpClient('udp6');
        }
      break;
    default:
      throw new RangeError('Transport layer not supported')
      break;
  }

}

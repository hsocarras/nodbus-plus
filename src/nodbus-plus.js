/**
 * Nodbus module.
 * @module nodbus
 * @author Hector E. Socarras Cabrera
 * @version 0.10.0
*/


const ModbusTcpServer = require('./slave/m_tcp_slave');
const ModbusTcpClient = require('./master/m_tcp_client');
const ModbusSerialServer = require('./slave/m_serial_slave');
const ModbusSerialClient = require('./master/m_serial_client');
const ModbusMaster = require('./master/modbus_master');
const ModbusSlave = require('./slave/modbus_slave');


/**
 * ModbusTcpServer.
 * @module nodbus/ModbusTcpServer
 */
/** Constructor for ModbusTcpServer Class. */
module.exports.ModbusTcpServer = ModbusTcpServer;

/**
 * ModbusSerialServer.
 * @module nodbus/ModbusSerialServer
 */
/** Constructor for ModbusSerialServer Class. */
module.exports.ModbusSerialServer = ModbusSerialServer;

/**
 * ModbusSlave.
 * @module nodbus/ModbusSlave
 */
/** Constructor for ModbusSlave base Class. */
module.exports.ModbusSlave = ModbusSlave;

/**
 * ModbusTcpClient.
 * @module nodbus/ModbusTcpClient
 */
/** Constructor for ModbusTcpClient Class. */
module.exports.ModbusTcpClient = ModbusTcpClient;

/**
 * ModbusSerialClient.
 * @module nodbus/ModbusSerialClient
 */
/** Constructor for ModbusTcpClient Class. */
module.exports.ModbusSerialClient = ModbusSerialClient;

/**
 * ModbusMaster.
 * @module nodbus/ModbusMaster
 */
/** Constructor for ModbusMaster Class. */
module.exports.ModbusMaster = ModbusMaster;

/**
* Create a Slave instance
* @param {number|string} port tcp port or string indicating serial port.
* @param {string} tp transport layer. Can be 'tcp', 'udp4', 'udp6'
* @param {number} modbusAddress modbus addres 1 to 247 for serial slave or tcp for ethernet.
* @param {string} mode Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.CreateSlave = function (port = 502, tp = 'tcp', modbusAddress = 1, mode = 'tcp'){

  if(typeof port == 'number' || typeof port == 'string'){
    
    switch (tp){
      case 'tcp':
        if(mode == 'tcp'){
          //si el modo no fue defnido es un esclavo modbustcp
          return new ModbusTcpServer(port, 'tcp', modbusAddress);
        }
        else{
          if(mode == 'auto' || mode == 'rtu' || mode == 'ascii'){
            return new ModbusSerialServer(port, 'tcp', modbusAddress, mode);
          }
          else{
            return new ModbusSerialServer(port, 'tcp', modbusAddress, 'auto');
          }
        }
        break;
      case 'udp4':
          if(mode == undefined){
            //si el modo no fue defnido es un esclavo modbustcp
            return new ModbusTcpServer(port, 'udp4', modbusAddress);
          }
          else{
            if(mode == 'auto' || mode == 'rtu' || mode == 'ascii'){
              return new ModbusSerialServer(port, 'udp4', modbusAddress, mode);
            }
            else{
              return new ModbusSerialServer(port, 'udp4', modbusAddress, 'auto');
            }
          }
        break;
      case 'udp6':
          if(mode == undefined){
            //si el modo no fue defnido es un esclavo modbustcp
            return new ModbusTcpServer(port, 'udp6', modbusAddress);
          }
          else{
            if(mode == 'aut' || mode == 'rtu' || mode == 'ascii'){
              return new ModbusSerialServer(port, 'udp6', modbusAddress, mode);
            }
            else{
              return new ModbusSerialServer(port, 'udp6', modbusAddress, 'auto');
            }
          }
        break;
        case 'serie':
            return new ModbusSerialServer(port, 'serie', modbusAddress, mode);
          break
        case 'serial':
            return new ModbusSerialServer(port, 'serie', modbusAddress, mode);
          break
      default:
        throw new RangeError('transport layer not supported')

    }
  } 
  else{
    throw new TypeError('port must be a number or string')
  }

}

/**
* Create a Slave instance

* @param {string} tp transport layer. Can be 'tcp', 'udp4', 'udp6'
* @param {string} mode Serial or TCP.
* @return {Object} Master object
*/
module.exports.CreateMaster = function (tp = 'tcp', mode = 'tcp', port){

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
    case 'serial':
      return new ModbusSerialClient('serie', port);
      break;
    case 'serie':
      return new ModbusSerialClient('serie', port);
      break;
    default:
      throw new RangeError('Transport layer not supported')
      break;
  }

}

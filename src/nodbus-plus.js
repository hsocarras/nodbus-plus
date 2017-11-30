/**
 * Nodbus module.
 * @module nodbus
 * @author Hector E. Socarras Cabrera
 * @version 0.4.0
*/


const ModbusTcpServer = require('./server/m_tcp_server');
const ModbusTcpClient = require('./client/m_tcp_client');
const ModbusSTcpServer = require('./server/m_stcp_server');

/**
 * ModbusTcpServer.
 * @module nodbus/ModbusTcpServer
 */
/** Constructor for ModbusTcpServer Class. */
module.exports.ModbusTcpServer = ModbusTcpServer;

/**
 * ModbusSTcpServer.
 * @module nodbus/ModbusSTcpServer
 */
/** Constructor for ModbusSTcpServer Class. */
module.exports.ModbusSTcpServer = ModbusSTcpServer;

/**
 * ModbusTcpClient.
 * @module nodbus/ModbusTcpClient
 */
/** Constructor for ModbusTcpClient Class. */
module.exports.ModbusTcpClient = ModbusTcpClient;

module.exports.CreateSlave = function (port = 502, modbusAddress = 'tcp', mode = 'aut'){

  if(typeof port == 'number'){
    //tcp network
    if(typeof modbusAddress == 'number'){
      //serial protocol
      return new ModbusSTcpServer(port, modbusAddress, mode)
    }
    else{
      //tcp protocol
      return new ModbusTcpServer(port);
    }

  }
  else{
    throw 'serial port no suported yet'
  }

}

/**
 * Nodbus module.
 * @module nodbus
 * @author Hector E. Socarras Cabrera
 * @version 0.14.0
*/

//Modbus Protocol Stack**************************************************************************************************
const ModbusTcpServer = require('./protocol/modbus_server_tcp.js');
const ModbusTcpClient = require('./protocol/modbus_master_tcp.js');
const ModbusSerialServer = require('./protocol/modbus_server_serial.js');
const ModbusSerialClient = require('./protocol/modbus_master_serial.js');
const ModbusClient = require('./protocol/modbus_master.js');
const ModbusServer  = require( "./protocol/modbus_server.js");

module.exports.ModbusSerialServer = ModbusSerialServer;
module.exports.ModbusSerialClient = ModbusSerialClient;
module.exports.ModbusTcpClient = ModbusTcpClient;
module.exports.ModbusTcpServer = ModbusTcpServer;
module.exports.ModbusClient = ModbusClient;
module.exports.ModbusServer = ModbusServer;
//***********************************************************************************************************************

//Modbus full implementation*********************************************************************************************
const NodbusTcpServer = require('./server/nodbus_tcp_server.js');
const NodbusSerialServer = require('./server/nodbus_serial_server.js');
const NetTcpServer = require('./server/net/tcpserver.js');
const NetUdpServer = require('./server/net/udpserver.js');
const NetSerialServer = require('./server/net/serialserver.js');
module.exports.NodbusTcpServer = NodbusTcpServer;

/**
* Create a tcp server instance
* @param {string} net:  Type of network to use, Can be 'tcp', 'udp4', 'udp6'. Default 'tcp'.
* @param {Object} serverCfg: Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.createTcpServer = function (net = 'tcp', serverCfg){

  let netType
  switch(net){
      case 'tcp':
          netType = NetTcpServer;
          break
      case 'udp4':
          netType = NetUdpServer;
          serverCfg.udpType = 'udp4';
          break
      case 'udp6':
          netType = NetUdpServer;
          serverCfg.udpType = 'udp6';
          break
      default:
          netType = NetTcpServer;
  }
  let server = new NodbusTcpServer(serverCfg, netType);

  return server;

}

/**
* Create a tcp server instance
* @param {string} net:  Type of network to use, Can be 'tcp', 'udp4', 'udp6'. Default 'tcp'.
* @param {Object} serverCfg: Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.createSerialServer = function (net = 'serial', serverCfg){

    let netType
    switch(net){
        case 'tcp':
            netType = NetTcpServer;
            break
        case 'udp4':
            netType = NetUdpServer;
            serverCfg.udpType = 'udp4';
            break
        case 'udp6':
            netType = NetUdpServer;
            serverCfg.udpType = 'udp6';
            break
        case 'serial':            
            netType = NetSerialServer;
            break
        default:
            netType = NetSerialServer;
    }
    let server = new NodbusSerialServer(serverCfg, netType);
  
    return server;
  
  }

/**
* Create a Slave instance
* @param {string} tp transport layer. Can be 'tcp', 'udp4', 'udp6'
* @param {string} mode Serial or TCP.
* @return {Object} Master object
*/
/*
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
*/



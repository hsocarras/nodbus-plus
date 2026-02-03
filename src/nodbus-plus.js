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

//Nodbus Server full implementation*********************************************************************************************
const NodbusTcpServer = require('./server/nodbus_tcp_server.js');
const NodbusSerialServer = require('./server/nodbus_serial_server.js');
const NetTcpServer = require('./server/net/tcpserver.js');
const NetUdpServer = require('./server/net/udpserver.js');
const NetSerialServer = require('./server/net/serialserver.js');

module.exports.NodbusTcpServer = NodbusTcpServer;
module.exports.NodbusSerialServer = NodbusSerialServer;
module.exports.NetTcpServer = NetTcpServer;
module.exports.NetUdpServer = NetUdpServer;
module.exports.NetSerialServer = NetSerialServer;   

/**
* Create a tcp server instance
* @param {string} net:  Type of network to use, Can be 'tcp', 'udp4', 'udp6'. Default 'tcp'.
* @param {Object} serverCfg: Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.createTcpServer = function (net = 'tcp', serverCfg = {}){

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
  let server = new NodbusTcpServer(netType, serverCfg);

  return server;

}

/**
* Create a tcp server instance
* @param {string} net:  Type of network to use, Can be 'tcp', 'udp4', 'udp6'. Default 'tcp'.
* @param {Object} serverCfg: Serial transmition mode for serial slave. 'rtu', 'ascii', 'auto' default.
* @return {Object} Slave object
*/
module.exports.createSerialServer = function (net = 'serial', serverCfg = {}){

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
    let server = new NodbusSerialServer(netType, serverCfg);
  
    return server;
  
}

//Nodbus Plus clients full implementation***************************************************************************************

const NodbusTcpClient = require('./client/nodbus_tcp_client.js');
const NodbusSerialClient = require('./client/nodbus_serial_client.js')
const NetTcpChannel = require('./client/net/tcpchannel.js');
const NetUdpChannel = require('./client/net/udpchannel.js');
const NetSerialChannel = require('./client/net/serialchannel.js');

/**
 * 
 * @param {string} channelName Identifier for channels type dictionary supported for the modbus client
 * @param {NetChannel} channelClass A custom Channel class that implements NetChannel interface
 * @returns A NodbusTcpClient instance
 */
module.exports.createTcpClient = function (channelName = 'tcp', channelClass = null){

    let client = new NodbusTcpClient();

    if (channelName instanceof String || typeof channelName === 'string'){
        if(channelClass != null){ 
            client.channelType.set(channelName, channelClass);
        }      
    }

    return client;

}

/**
 * Factory function to create a NodbusSerialClient instance
 * @param {string} channelName Name of the channel type to register or use
 * @param {NetChannel} channelClass Custom Channel class to register for the given channelName
 * @returns Instance of NodbusSerialClient
 */
module.exports.createSerialClient = function(channelName = 'tcp', channelClass = null){

    let client = new NodbusSerialClient();

    if (channelName instanceof String || typeof channelName === 'string'){
        if(channelClass != null){ 
            client.channelType.set(channelName, channelClass);
        }      
    }  

    return client;
}


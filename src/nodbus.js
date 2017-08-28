/**
*@author Hector E. Socarras Cabrera
*@date 8/5/2015
*/


const ModbusTcpServer = require('./server/m_tcp_server');
const ModbusTcpClient = require('./client/m_tcp_client');

module.exports = class Nodbus(){
  constructor(){
    this.ModbusTcpServer = ModbusTcpServer;
    this.ModbusTcpClient = ModbusTcpClient;
  }
}

/**
 * Nodbus module.
 * @module nodbus *
 * @author Hector E. Socarras Cabrera
 * @version 0.4.0
*/


const ModbusTcpServer = require('./server/m_tcp_server');
const ModbusTcpClient = require('./client/m_tcp_client');

/**
 * ModbusTcpServer.
 * @module nodbus/ModbusTcpServer
 */
/** Constructor for ModbusTcpServer Class. */
module.exports.ModbusTcpServer = ModbusTcpServer;

/**
 * ModbusTcpClient.
 * @module nodbus/ModbusTcpClient
 */
/** Constructor for ModbusTcpClient Class. */
module.exports.ModbusTcpClient = ModbusTcpClient;

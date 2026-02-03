import { createRequire } from 'module';
const requirecjs = createRequire(import.meta.url);

const cjs = requirecjs('./nodbus-plus.js');

export default cjs;
export const createTcpServer = cjs.createTcpServer;
export const createSerialServer = cjs.createSerialServer;
export const createTcpClient = cjs.createTcpClient;
export const createSerialClient = cjs.createSerialClient;
export const ModbusTcpServer = cjs.ModbusTcpServer;
export const ModbusSerialServer = cjs.ModbusSerialServer;
export const ModbusTcpClient = cjs.ModbusTcpClient;
export const ModbusSerialClient = cjs.ModbusSerialClient;
export const ModbusServer = cjs.ModbusServer;
export const ModbusClient = cjs.ModbusClient;
export const MjsFlag = true;
export const __all__ = Object.keys(cjs);
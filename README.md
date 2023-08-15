# Nodbus-Plus

A Modbus protocol library for Node.js, written entirely in JavaScript. It supports both Modbus Serial and Modbus TCP.

## Introduction

Nodbus Plus has been designed as a stack for the Modbus protocol. It can be used to create both your own Modbus client and server using its API, or you can use its build in client or server and have an application with Modbus communication in just minutes.

## Installation

```console
$ npm install nodbus-plus
``` 


## Basic Usage:

Create a modbus tcp server.

```javascript
var ModbusTcpServer = require('nodbus-plus').ModbusTcpServer;
var Slave = new ModbusTcpServer(502);
Slave.Start();
```
or use function CreateSlave:
```javascript
var nodbus = require('nodbus-plus');
var ModbusTcpServer = nodbus.CreateSlave(502);
```

Create a modbus serial slave over tcp.

```javascript
var ModbusSerialServer = require('nodbus-plus').ModbusSerialServer;
var Slave = new ModbusSerialServer(502,'tcp', 1);
Slave.Start();
```
or use function CreateSlave:

```javascript
var nodbus = require('nodbus-plus');
var ModbusSerialServer = nodbus.CreateSlave(502, 'tcp', 1, 'auto');
```

Create a modbus tcp client.

```javascript
var ModbusTcpClient = require('nodbus-plus').ModbusTcpClient;
var client = new ModbusTcpClient();
```

## Documentation and Tutorials
See: https://github.com/hsocarras/nodbus-plus/wiki

## Contributing

If you have a suggestion or found a issue, let us known and [create an issue](https://github.com/hsocarras/nodbus-plus/issues)


## License

This project is licensed under the MIT License - see the LICENSE.md file for details

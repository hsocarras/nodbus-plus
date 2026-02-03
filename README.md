# Nodbus-Plus

A Modbus protocol library for Node.js, written entirely in JavaScript. It supports both Modbus Serial and Modbus TCP.

## Introduction

Nodbus-Plus is a Modbus protocol stack for Node.js. You can use its API to create your own Modbus client and server, or use its built-in client and server for quick Modbus communication in just minutes.

## Installation

```console
npm install nodbus-plus
```

## Basic Usage

### Creating a Modbus Server

```javascript
const nodbus = require('nodbus-plus');

// Basic config for TCP server. Default values.
const cfg = {
    inputs: 2048,            // total inputs
    coils: 2048,             // total coils
    holdingRegisters: 2048,  // total holding registers
    inputRegisters: 2048,    // total input registers
    port: 502,               // port to listen on
};

let server = nodbus.createTcpServer('tcp', cfg);
```

The first argument for `createTcpServer` is the transport layer type. The Nodbus-Plus TCP server supports `'tcp'`, `'udp4'`, and `'udp6'`.  
To create a serial server, use `createSerialServer` instead:


```javascript
// Basic config for serial server.
const cfg = {
    address: 1,
    transmitionMode: 0, // 0 - RTU, 1 - ASCII
    inputs: 2048,
    coils: 2048,
    holdingRegisters: 2048,
    inputRegisters: 2048,
    port: 'COM1', // Serial port path (e.g., 'COM1' on Windows or '/dev/ttyUSB0' on Linux)
    // Additional serial port configuration may be required
};

let server = nodbus.createSerialServer('serial', cfg);
```
> **Note:** The `port` property for serial servers must be a string with the path to the serial port.  
> See the Nodbus-Plus API for more details on serial configuration.

#### Add Listeners for Server Events

```javascript
//listenning event
server.on('listening', function(port){
    console.log('Server listening on: ' + port);        
});

//event emited when a request are received
server.on('request', function(sock, req){
    console.log('Request received')
    console.log(req)
});

//Event emited when server send a response to client
server.on('response', function(sock, res){
    console.log('Responding')
    console.log(res)
});

server.on('error', function(err){
    console.log(err)
});
```

Finally, start the server:

```javascript
server.start();
```
---

### Creating a Modbus Client

To create a Modbus client, use `createTcpClient` or `createSerialClient`:

```javascript
const nodbus = require('nodbus-plus');
let client = nodbus.createSerialClient();

//emitted when the client stablish connection with the server
client.on('connection', (id)=>{
    console.log('connection stablish')    
})

//emited when error occurs
client.on('error', (e)=>{    
    console.log(e)    
})

//emitted when a request is sended to server
client.on('request', (id, req)=>{
    console.log('request sended to device: ' + id);        
})

//emited when no response is received
client.on('req-timeout', (id, adu)=>{
    console.log('timeout')        
})

//emited when a response is received
client.on('response', (id, res)=>{
    console.log(res)        
})
```

Add channels to the client. The client creates a connection per channel.  
The following example adds a Modbus TCP server and connects to it:


```javascript

//channel
channelCfg = {        
    ip:'127.0.0.1',
    port:502,
    timeout:250,
}

client.addChannel('device', 'tcp1', channelCfg);
client.connect('device')

```

Once the client is connected and event listeners are configured, you can exchange data using available Modbus functions:


```javascript
// Read two coils starting at address 0 from channel 'device', Modbus address 1
client.readCoils('device', 1, 0, 2);
```
---

### Documentation

For comprehensive information, refer to the [official documentation](https://nodbus-plus.readthedocs.io/en/latest/).


### Getting Started

If you're new to Nodbus-Plus, the [Getting Started Guide](https://nodbus-plus.readthedocs.io/en/latest/starting.html) will walk you through installation and provide basic usage examples.


### Examples

The `./samples` directory in the root folder contains example programs demonstrating how to use the library.



## Contributing

If you have suggestions or find an issue, please [create an issue](https://github.com/hsocarras/nodbus-plus/issues).

## License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.

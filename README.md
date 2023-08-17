# Nodbus-Plus

A Modbus protocol library for Node.js, written entirely in JavaScript. It supports both Modbus Serial and Modbus TCP.

## Introduction

Nodbus Plus has been designed as a stack for the Modbus protocol. It can be used to create both your own Modbus client and server using its API, or you can use its build in client or server and have an application with Modbus communication in just minutes.

## Installation

```console
$ npm install nodbus-plus
``` 

## Basic Usage:

### Create a modbus server.

```javascript
const nodbus = require('nodbus-plus');

//Basic config for tcp server. Default values.
const cfg = {
    inputs : 2048, //total inputs
    coils : 2048,  //total coils
    holdingRegisters : 2048, //total holding register
    inputRegisters : 2048,  //total input register
    port : 502,    //port to listen to
}

let server = nodbus.createTcpServer('tcp', cfg);
```
The first argument for createTcpServer function is the type of transport layer used. The nodbus-plus tcp server suport 'tcp', 'udp4' and 'udp6'. To create a 
serial server the procedure is the same, but calling createSerialServer function instead.

```javascript
//Basic config for tcp server. Default values.
let cfg = {
    address : 1,
    transmitionMode: 0, //0-rtu, 1 - ascii
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 2048,
    inputRegisters : 2048,  
    port : 502,    
}

let server = nodbus.createSerialServer('tcp', cfg);
```
The createSerialServer function can take the value 'serial' as fist argument as well, however the property port mus be a string
with the path to a serial port and adicional port configuration property may be needed. See nodbus-plus api for more details.

Add listeners for srever's events

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
Finally the server must be started.

```javascript
server.start();
```
### Create a modbus client.

To create a modbus client use the functions createTcpClient or createSerialClient.

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

Then channels must be add to the client. The client will create a connection per channel. The following example add a modbus serial over tcp server, and conect to it.

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

Once the client is connected, and event listener configured, data can be exchange using availables modbus function.

```javascript

//reading from cannel 'device', modbus address 1, two coils from 0 coil's address
    client.readCoils('device', 1, 0, 2);

```

### Official Documentation

For comprehensive information on how to use NodbusPlus, refer to the [official documentation](https://nodbus-plus.readthedocs.io/en/latest/).

### Getting Started

If you're new to NodbusPlus, the [Getting Started Guide](https://nodbus-plus.readthedocs.io/en/latest/starting.html) is a great place to begin.
It will walk you through the installation process and provide a basic usage example.


### Examples

Inside the root folder of Nodbus plus, there is a directory './samples' that contains three example programs that make use of the library.


## Contributing

If you have a suggestion or found a issue, let us known and [create an issue](https://github.com/hsocarras/nodbus-plus/issues)


## License

This project is licensed under the MIT License - see the LICENSE.md file for details

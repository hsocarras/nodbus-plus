# Nodbus-Plus

A nodejs modbus library fully writed in javascript.

## Getting Started
* ### Install
#### installing nodbus-plus as a node package
    $ npm install nodbus-plus
#### installing nodbus from source

* ### Basic Usage:

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

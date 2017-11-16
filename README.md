# Nodbus

A nodejs modbus library fully writed in javascript.

## Getting Started
* ### Install
#### installing nodbus as a node package
    $ npm install nodbus+
#### installing nodbus from source

* ### Usage:

Create a modbus tcp server.

      var ModbusTcpServer = require('nodbus').ModbusTcpServer;
      var Slave = new ModbusTcpServer(502);
      Slave.Start();

Create a modbus tcp client.

    var ModbusTcpClient = require('nodbus').ModbusTcpClient;
    var client = new ModbusTcpClient();

## Documentation and Tutorials
See: https://github.com/hsocarras/nodbus/wiki
## Contributing

If you have a suggestion or found a issue, let us known and [create an issue](https://github.com/hsocarras/nodbus/issues)

## Supporting the project

If you like the project, please support the development.

 bitcoins: 3E5Ro3eUc4Q9gAE2QCgyyCSda3R7jnQmBC

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

# Nodbus-Plus Changelog

## Verion 0.6.2
* ### Client

Se implementa el evento idle en el modbus master.
Se agrega la propiedad isIdle

## Verion 0.6.4
* ### Slave

Se implementa la propiedad modbusAddress en modbus_slave con chequeo de rango.


## Verison 0.7.2
* ### Nodbus

Se agrega el modbus slave a lo objetos exportados por nodbus.

## Version 0.8.0
* ### ModbusMaster

Add retries when a modbus indication has timeout.
Add suport for multiples slaves.

## Version 0.9.0

All devices get improve api with request and resonse object

* ### ModbusTCPMaster

Can send multiples request to a modbus slave. Can handle multiples responses due to tcp coalesing

* ### ModbusTCPServer
Remove access control.
Add suport for multiple simultaneus modbus-tcp indication due to tcp coalesing

## Version 0.10.0

All devices get suport for udp transport layer.

.. _nodbus_serial_master:

======================
Class: NodbusSerialClient
======================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusSerialClient Class <modbus_serial_master>`. It provides ready to use Modbus RTU/Ascii Client.


Creating a NodbusSerialClient Instance
===================================

new NodbusSerialClient(channelClass)
-------------------------------------

* **channelClass:** <Class>: This argument define the constructor for the net layer. See :ref:`NetChannel Class <nodbus_net_channel>`.
* **Returns:** <NodbusSerialClient>

NodbusPlus expose the function createSerialClient([netConstructor]) to create new instances for NodbusSerialClient.

* **netConstructor** <string>: Can be 'tcp','udp' or serial. Default 'tcp'.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      let nodbusSerialClient = nodbus.createSerialClient('tcp'); //default settings, net layer is tcp

However new NodbusSerialClient instance can be created with customs :ref:`NetChannel <nodbus_net_channel>` importing the nodbusSerialClient Class.

.. code-block:: javascript

      const NodbusSerialClient = require('nodbus-plus').NodbusSerialClient;
      const NetChannel = require('custom\net\custome_channel.js'); //this is a example  file for a user channel, it do not exist on nodbus-plus library

      
      let nodbusSerialClient = new NodbusSerialClient(NetChannel);     



NodbusSerialClient's Events
===========================


Event: 'broadcast_timeout'
-----------------------------------

This event indicate that the client has no pending broadcast request and is free to send another request.


Event: 'connection'
-------------------

* **id** <string>: Channel's name

Emitted when the client succesfully connect to a server. 

Event: 'connection-closed'
---------------------------

* **id** <string>: Channel's name

Emitted when the channel close the connection.


Event: 'data'
---------------------

* **id** <string>: Channel's name.

* **data** <Buffer>: Data received.

Emitted when the channel emit the data event.



Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'req_timeout'
--------------------

* **transactionId** <number>: Indicate wich request fires the timeout event. 
* **vreq** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      nodbusSerialClient.on('req_timeout', (id, req) ->{
         console.log('Timeout error from request: ' + id + '\n');
      })

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusTcpClient.setReqTimer(transactionId, [timeout])` ends without call 
:ref:`Method: modbusTcpClient.clearReqTimer(transactionId)`


Event: 'request'
----------------

* **id** <string>: Channel's name.

* **request** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited after the client send data to the server.


Event: 'response'
----------------

* **id** <string>: Channel's name.

* **response** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited when data received fron server has been validated.


Event: 'transaction'
--------------------

* **req** <Buffer>: Modbus Tcp request adu. 
* **res** <Buffer>: Modbus Tcp request adu.  

This event is emmited when the :ref:`Method: modbusTcpClient.processResAdu(bufferAdu)` is called to manage a server response.


Event: 'write'
---------------------

* **id** <string>: Channel's name.

* **reqAdu** <Buffer>: Client request,  a modbus tcp adu.

Emited after the client send data to the server.


NodbusSerialClient's Atributes
===============================


Atribute: nodbusSerialClient.activeRequest
------------------------------------------

* <Buffer>    

This property store the current active request, if no request is pending then is null.


Atribute: nodbusSerialClient.channels
-------------------------------------

* <Map> Map with client's channel list.
    * *key* <string> Channel's id.
    * *value* <object>: A channel object. See :ref:`NetChannel Class <nodbus_net_channel>`




NodbusSerialClient's Methods
==============================


See :ref:`ModbusSerialClient Class Methods <modbus_serial_client_methods>` for all base class inherited methods.



Method: nodbusSerialClient.addChannel(id, channelCfg)
---------------------------------------------------------

* **id** <String>: Channels's name. Must be unique for each channel.

* **channelCfg** <object>: Configuration object for the channel with following properties for tcp and udp:
  * *ip* <String>: Modbus server's ip address. Defaul 'localhost'.
  * *port* <number> Port where the modbus server's is listening.
  * udpType <string>: Used in udp server to set 'udp4' or 'udp6'. Default 'udp6'.
  * *timeout* <number> Number of milliseconds to await for a response on the channel.

* **channelCfg** <object>: Configuration object with the following properties for serial network:

   * port <string> : The path to the serial port. Example 'COM1.
   * speed <number>: Enum with following baudrates in bps : 0-110, 1-300, 2-1200, 3-2400, 4-4800, 5-9600, 6-14400, 7-19200, 8-38400, 9-57600, 10-115200. Default 7.
   * dataBits <number>: 7 or 8. Default 8.
   * stopBits <number>: 0 or 1.
   * parity <number>: Enum with following value. 0-'none', 1-'even', 2-'odd'. Default 1.
   * timeBetweenFrame <number>: Number of millisends to await without receiving data to consider end of modbus frame.
   * *timeout* <number> Number of milliseconds to await for a response on the channel.
   
  This method create a channel from the channel's constructor and add to the channels list :ref:`Atribute: nodbusSerialClient.channels`.

.. code-block:: javascript
      
      let device1 = {
      ip: '127.0.0.1',  //server's ip address
      port: 502,        //tcp port
      timeout: 500}     // miliseconds for timeout event

      nodbusSerialClient.addChannel('device1', device1);
      

Method: nodbusSerialClient.connect(id)
----------------------------------------

* **id** <String>: Channels's name.

  This method try to connect to the remote server configured on the channel or open the serial port given.



Method: nodbusSerialClient.delChannel(id)
------------------------------------------

* **id** <String>: Channels's name.

  This method remove a channel from the channels list :ref:`Atribute: nodbusSerialClient.channels`.



Method: nodbusSerialClient.disconnect(id)
------------------------------------------

* **id** <String>: Channels's name.

This method send the FIN package to the remote server to close the connection or close the serial port guiven.



Method: nodbusSerialClient.isChannelReady(id)
----------------------------------------------

* **id** <String>: Channels's name.
* **return** <boolean>: true if channel is connected and ready to send data to the server, otherwise false.

  This method return true if channel is connected and ready to send data to the server.




Method: nodbusSerialClient.makeRequest(unitId, pdu, asciiMode)
---------------------------------------------------------------

* **unitId** <number>: modbus address.
* **pdu** <Buffer>: The pdu's buffer.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <Buffer>: return a tcp adu request's buffer

This functions first increment the transaction counter and create a modbus tcp request ready to be send to the client.


Method: nodbusSerialClient.forceSingleCoil(value, channelId, unitId, startCoil, asciiMode)
--------------------------------------------------------------------------------------------

* **value** <boolean>: Value to force.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: Coil to force at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the force coil (function 05) request and sended to server.

.. code-block:: javascript
      
      //forcing coil to 1 on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //coils 10.      
      successStatus = nodbusSerialClient.forceSingleCoil(1, 'device1', 255, 10);


Method: nodbusSerialClient.forceMultipleCoils(values, channelId, unitId, startCoil, asciiMode)
-----------------------------------------------------------------------------------------------

* **value** <Array>: Array of booleans with values to force.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: First coil to force starting at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the force multiples coils (function 15) request and sended to server.

.. code-block:: javascript
      
      //forcing 6 coils to desire values on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //starting at coil 10.  
      vals = [1, 0, 1, 1, 0, 1]    
      successStatus = nodbusSerialClient.forceMultipleCoils(val, 'device1', 255, 10);


Method: nodbusSerialClient.maskHoldingRegister(values, channelId, unitId, startRegister, asciiMode)
----------------------------------------------------------------------------------------------------

* **values** <Array> An array of 16 numbers with values to force. Index 0 is de less significant bit.
                A value off 1 force to 1 the corresponding bit, 0 force to 0, other values don't change the bit value.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the mask holding register (function 22) request and sended to server.

.. code-block:: javascript
      
      //forcing register on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = [1, 0, 1, 0, 2, 2, 1, 1, 2, 2, 0, 0, 0, 1, 2, 2]
      successStatus = nodbusSerialClient.maskHoldingRegister(vals, 'device1', 255, 99);



Method: nodbusSerialClient.presetSingleRegister(value, channelId, unitId, startRegister, asciiMode)
----------------------------------------------------------------------------------------------------

* **value** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the preset single register (function 06) request and sended to server.

.. code-block:: javascript
      
      //forcing register on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let val = Buffer.alloc(2);
      val.writeInt16BE(4567);
      successStatus = nodbusSerialClient.presetSingleRegister(val, 'device1', 255, 99);

    
Method: nodbusSerialClient.presetMultiplesRegisters(values, channelId, unitId, startRegister, asciiMode)
---------------------------------------------------------------------------------------------------------

* **values** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the preset multiple registers (function 16) request and sended to server. The amount ofregister to write is the
values's buffer half length.

.. code-block:: javascript
      
      //writing 3 registers on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = Buffer.alloc(6);
      let tempRegister = Buffer.alloc(2);
      tempRegister.writeUInt16BE(245);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 0);
      tempRegister.writeUInt16BE(8965);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 1);
      tempRegister.writeUInt16BE(1045);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 2);
      successStatus = nodbusSerialClient.presetMultipleRegisters(vals, 'device1', 255, 99);



Method: nodbusSerialClient.readCoils(channelId, unitId, startCoil, coilsCuantity, asciiMode)
---------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: Starting coil to read at 0 address.
* **coilsCuantity** <number>: Number of coils to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the read coil  (function 01) request and sended to server.

.. code-block:: javascript
      
      //Reading coil on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //coils 10 startint at 0.
      //Read 14 coils
      successStatus = nodbusSerialClient.readCoils('device1', 255, 10, 14);


Method: nodbusSerialClient.readHoldingRegisters(channelId, unitId, startRegister, registersCuantity,  asciiMode)
------------------------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of registers to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the read holding register (function 03) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 10 .
      //Read 4 register
      successStatus = nodbusSerialClient.readHoldingRegisters('device1', 255, 10, 4);



Method: nodbusSerialClient.readInputs(channelId, unitId, startInput, inputsCuantity,  asciiMode)
--------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startInput** <number>: Starting input to read at 0 address.
* **inputsCuantity** <number>: Number of inputs to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the read inputs  (function 02) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //input 0 .
      //Read 6 inputs
      successStatus = nodbusSerialClient.readInputs('device1', 255, 0, 6);


Method: nodbusSerialClient.readInputRegisters(channelId, unitId, startRegister, registersCuantity, asciiMode)
--------------------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of inputs to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the read input register (function 04) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 10 .
      //Read 4 register
      successStatus = nodbusSerialClient.readInputRegisters('device1', 255, 10, 4);



Method: nodbusSerialClient.readWriteMultiplesRegisters(values, channelId, unitId, readStartingRegister, readRegisterCuantity, writeStartingRegister, asciiMode)
---------------------------------------------------------------------------------------------------------------------------------------------------------------

* **values** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **readStartingRegister** <number>: Starting input to read at 0 address.
* **readRegisterCuantity** <number>: Number of registers to read.
* **writeStartingRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This functions create the read and write holding registers (function 23) request and sended to server.

.. code-block:: javascript
      
      //writing 3 registers on channel device1, unitId 255  define device itself and reading five registers from register 10
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = Buffer.alloc(6);
      let tempRegister = Buffer.alloc(2);
      tempRegister.writeUInt16BE(245);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 0);
      tempRegister.writeUInt16BE(8965);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 1);
      tempRegister.writeUInt16BE(1045);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 2);
      successStatus = nodbusSerialClient.readWriteMultiplesRegisters(vals, 'device1', 255, 10, 5, 99);


Method: nodbusSerialClient.getWordFromBuffer(targetBuffer, [offset])
-----------------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.

This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9


Method: nodbusSerialClient.setWordToBuffer(value, targetBuffer, [offset])
---------------------------------------------------------------------------

* **value** <Buffer>: two bytes length buffer.
* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to write.
* **offset** <number>: A number with register's offset inside the buffer.

This method write a 16 bits register inside a buffer. The offset is 16 bits aligned.

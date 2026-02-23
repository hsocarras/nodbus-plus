.. _nodbus_serial_master:

==========================
Class: NodbusSerialClient
==========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusSerialClient Class <modbus_serial_master>`. It provides a ready-to-use Modbus RTU/ASCII client.


Creating a NodbusSerialClient Instance
=======================================

new NodbusSerialClient()
-------------------------------------

* **Returns:** <NodbusSerialClient>

Nodbus-Plus exposes the helper `createSerialClient([netType], [netConstructor])` to create new `NodbusSerialClient` instances
with extended network channel constructors. See :ref:`nodbus_net_channel` for channel's API description.

* **netType** <string>: The id for custom channel. See channelType property.
* **netConstructor** <string>: Can be 'tcp', 'udp' or 'serial'. Default: 'tcp'.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      let nodbusSerialClient = nodbus.createSerialClient();

Alternatively, a `NodbusSerialClient` instance can be created with a custom :ref:`NetChannel <nodbus_net_channel>`.

.. code-block:: javascript

      const NodbusSerialClient = require('nodbus-plus').NodbusSerialClient;
      const CanBusNetChannel = require('./custom/net/custom_channel.js'); // example user channel implementation

      let nodbusSerialClient = new NodbusSerialClient('my_own_channel_over_can',CanBusNetChannel);



NodbusSerialClient's Events
===========================

**Inherited Events**

The following events are inherited from :ref:`ModbusSerialClient Class <modbus_serial_master>`:
* ``broadcast-timeout`` : Indicates the client has no pending broadcast request and is free to send another request.
* ``req-timeout`` - Emitted when a request times out before receiving a response.
* ``transaction`` - Emitted when a complete request/response pair has been processed.

Event: 'connection'
-------------------

Emitted when the client successfully establishes a connection to a server on a specific channel.

* **id** <string>: The channel's identifier.

.. code-block:: javascript

      client.on('connection', (id) => {
         console.log(`Connected to channel: ${id}`);
      });

Event: 'connection-closed'
--------------------------

Emitted when a channel closes its connection.

* **id** <string>: The channel identifier

.. code-block:: javascript

      client.on('connection-closed', (id) => {
         console.log(`Channel ${id} disconnected`);
      });

Event: 'data'
-------------

Emitted when raw data is received from the channel before protocol-level validation.

* **id** <string>: The channel identifier
* **data** <Buffer>: Raw bytes received

.. code-block:: javascript

      client.on('data', (id, data) => {
         console.log(`Raw data from ${id}:`, data);
      });

Event: 'error'
--------------

Emitted when the transport reports an error.

* **err** <Error>: Error object

.. code-block:: javascript

      client.on('error', (err) => {
         console.error('Client error:', err);
      });


Event: 'request'
----------------

Emitted after the client sends a request to the server.

* **id** <string>: The channel identifier
* **request** <object>: Request object with properties: `timeStamp`, `unitId`, `functionCode`, `data`

.. code-block:: javascript

      client.on('request', (id, request) => {
         console.log(`Request sent on ${id}:`, request);
      });

Event: 'response'
-----------------

Emitted when a received response has been validated as a valid Modbus ADU.

* **id** <string>: The channel identifier
* **response** <object>: Response object with properties: `timeStamp`, `unitId`, `functionCode`, `data`

.. code-block:: javascript

      client.on('response', (id, response) => {
         console.log(`Response received on ${id}:`, response);
      });



Event: 'write'
--------------

Emitted after the client sends raw ADU bytes to the server.

* **id** <string>: The channel identifier
* **reqAdu** <Buffer>: The ADU bytes that were written

.. code-block:: javascript

      client.on('write', (id, reqAdu) => {
         console.log(`Data written to ${id}`);
      });


NodbusSerialClient's Attributes
===============================

**Inherited Attributes**

The following attributes are inherited from :ref:`ModbusSerialClient Class <modbus_serial_master>`:

* ``activeRequest`` - The current active request ADU buffer; `null` if no request is pending
* ``activeRequestTimerId`` - Timer ID for the active request timeout
* ``turnAroundDelay`` - Timer ID for the turnaround delay after a broadcast request

**Own Attributes**

Attribute: nodbusSerialClient.channelType
------------------------------------------

* <Map> Map of available channel constructors.
      * *key* <string>: Channel type id.
      * *value* <Class>: Channel constructor (see :ref:`NetChannel Class <nodbus_net_channel>`).

This property stores the client's channel constructors. Built-in channel types for Nodbus-Plus are `tcp1`, `udp1`, and `serial1`.

Attribute: nodbusSerialClient.channels
---------------------------------------

* <Map> Map with the client's channel instances.
      * *key* <string>: Channel id.
      * *value* <object>: Channel instance (see :ref:`NetChannel Class <nodbus_net_channel>`).


Attribute: nodbusSerialClient.isIdle
----------------------------------------

* <boolean> `true` if the client has no active request and is not waiting for a turnaround delay after a broadcast request; otherwise `false`.

NodbusSerialClient's Methods
==============================

The following methods are inherited from the base classes and are available on `NodbusSerialClient`:

**Inherited Methods from ModbusSerialClient**


- ``makeRequest(address, pdu, asciiMode)`` : Creates a complete Modbus serial ADU request buffer with slave address and checksum.
- ``storeRequest(bufferReq, asciiMode)`` : Stores a request as the currently active request (only one active request allowed on serial).
- ``setReqTimer(timeout)`` : Sets a timeout timer for the active request.
- ``clearReqTimer()`` : Clears the timeout timer for the active request.
- ``setTurnAroundDelay(timeout)`` : Sets the turnaround delay after a broadcast request.
- ``clearTurnAroundDelay()`` : Clears the turnaround delay timer.
- ``processResAdu(bufferRes)`` : Validates and processes a received response ADU.
- ``aduAsciiToRtu(asciiFrame)`` : Converts an ASCII ADU to RTU format with CRC checksum.
- ``aduRtuToAscii(rtuFrame)`` : Converts an RTU ADU to ASCII format with LRC checksum.
- ``calcCRC(frame)`` : Calculates the CRC-16 checksum for RTU frames.
- ``calcLRC(frame)`` : Calculates the LRC checksum for ASCII frames.

**Inherited Methods from ModbusClient (PDU builders & utilities)**

- ``readCoilStatusPdu(startCoil, coilQuantity)`` : Creates PDU for reading coil status (Function Code 01).
- ``readInputStatusPdu(startInput, inputQuantity)`` : Creates PDU for reading discrete inputs (Function Code 02).
- ``readHoldingRegistersPdu(startRegister, registerQuantity)`` : Creates PDU for reading holding registers (Function Code 03).
- ``readInputRegistersPdu(startRegister, registerQuantity)`` : Creates PDU for reading input registers (Function Code 04).
- ``forceSingleCoilPdu(value, startCoil)`` : Creates PDU for writing a single coil (Function Code 05).
- ``presetSingleRegisterPdu(value, startRegister)`` : Creates PDU for writing a single register (Function Code 06).
- ``forceMultipleCoilsPdu(values, startCoil, coilQuantity)`` : Creates PDU for writing multiple coils (Function Code 15).
- ``presetMultipleRegistersPdu(values, startRegister, registerQuantity)`` : Creates PDU for writing multiple registers (Function Code 16).
- ``maskHoldingRegisterPdu(values, startRegister)`` : Creates PDU for Mask Write Register (Function Code 22).
- ``readWriteMultipleRegistersPdu(values, readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite)`` : Creates PDU for Read/Write Multiple Registers (Function Code 23).

**Own Methods**

Method: nodbusSerialClient.addChannel(id, type, channelCfg)
------------------------------------------------------------

* **id** <string>: Channel name. Must be unique for each channel.

* **type** <string>: Channel's constructor id stored on channelType property. Default value is 'tcp1'.

* **channelCfg** <object>: Configuration object for the channel with following properties for tcp and udp:

      * *ip* <String>: Modbus server's IP address. Default: 'localhost'.
      * *port* <number>: Port where the Modbus server is listening.
      * *udpType* <string>: Used in UDP channels to set `udp4` or `udp6`. Default: `udp6`.
      * *timeout* <number>: Number of milliseconds to await for a response on the channel.

* **channelCfg** <object>: Configuration object with the following properties for serial network:

      * *port* <string>: Serial port path, e.g. `COM1`.
      * *baudRate* <number>: Baud rate (e.g. 110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200).
      * *dataBits* <number>: 7 or 8 (default: 8).
      * *stopBits* <number>: 1 or 2 (default: 1).
      * *parity* <string>: `none`, `even`, or `odd` (default: `none`).
      * *timeBetweenFrame* <number>: Milliseconds to await without receiving data to consider the end of a Modbus frame.
      * *timeout* <number>: Milliseconds to await for a response on the channel.

This method creates a channel instance from the channel constructor and adds it to the channels list (:ref:`Attribute: nodbusSerialClient.channels`).

.. code-block:: javascript
      
                  let device1 = {
                        ip: '127.0.0.1',  // server's IP address
                        port: 502,        // TCP port
                        timeout: 500      // milliseconds for timeout event
                  };

                  nodbusSerialClient.addChannel('device1', 'tcp1', device1);
      

Method: nodbusSerialClient.connect(id)
----------------------------------------

* **id** <string>: Channel name.

Connects the client to the remote server configured for the given channel, or opens the configured serial port.

.. code-block:: javascript

      nodbusSerialClient.connect('device1'); // connects to the server configured on channel 'device1'


Method: nodbusSerialClient.delChannel(id)
-------------------------------------------

* **id** <string>: Channel name.

Removes the channel from the channels list (:ref:`Attribute: nodbusSerialClient.channels`).

.. code-block:: javascript

      nodbusSerialClient.delChannel('device1'); // removes channel 'device1' from the client

Method: nodbusSerialClient.disconnect(id)
-----------------------------------------

* **id** <string>: Channel name.

Closes the connection for the given channel (sends TCP FIN for network channels or closes the serial port for serial channels).

.. code-block:: javascript

      nodbusSerialClient.disconnect('device1'); // disconnects channel 'device1' from the server      


Method: nodbusSerialClient.isChannelReady(id)
---------------------------------------------

* **id** <string>: Channel name.
* **returns** <boolean>: `true` if the channel is connected and ready to send data, otherwise `false`.

Returns whether the channel is connected and ready to transmit data to the server.

.. code-block:: javascript

      let isReady = nodbusSerialClient.isChannelReady('device1');
      console.log(`Channel 'device1' ready: ${isReady}`);

Method: nodbusSerialClient.forceSingleCoil(value, channelId, unitId, startCoil, asciiMode)
--------------------------------------------------------------------------------------------

* **value** <boolean>: Value to write to the coil.
* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. (Spec recommends 255 for local device.)
* **startCoil** <number>: Coil address (0-based).
* **asciiMode** <boolean>: If `true`, send request in ASCII mode. Default: `false` (RTU).
* **returns** <boolean>: `true` on success.

This function creates a Force Single Coil (function 05) request and sends it to the server.

.. code-block:: javascript

      // Force coil at address 10 to ON (1) on channel 'device1'
      let successStatus = nodbusSerialClient.forceSingleCoil(true, 'device1', 255, 10);


Method: nodbusSerialClient.forceMultipleCoils(values, channelId, unitId, startCoil, asciiMode)
-----------------------------------------------------------------------------------------------

* **value** <Array>: Array of booleans with values to force.
* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startCoil** <number>: First coil to force starting at 0 address.
* **asciiMode** <boolean>: If `true`, use ASCII mode; otherwise RTU. Default: `false` (RTU).
* **Returns** <boolean>: true if success

This function creates the Force Multiple Coils (function 15) request and sends it to the server.

.. code-block:: javascript

      // Force 6 coils to desired values on channel 'device1'.
      // If the device is a Modbus gateway then unitId specifies the target station.
      // Starting at coil 10.
      let vals = [true, false, true, true, false, true];
      let successStatus = nodbusSerialClient.forceMultipleCoils(vals, 'device1', 255, 10);


Method: nodbusSerialClient.maskHoldingRegister(values, channelId, unitId, startRegister, asciiMode)
----------------------------------------------------------------------------------------------------

* **values** <Array>: An array of 16 numeric codes describing the mask/write operation. Index 0 is the least significant bit.
                A value of `1` forces the corresponding bit to 1, `0` forces it to 0; other values leave the bit unchanged.
* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean>: If `true`, use ASCII mode; otherwise RTU. Default: `false` (RTU).
* **Returns** <boolean>: true if success

This function creates a Mask Write Register (function 22) request and sends it to the server.

.. code-block:: javascript

      // Mask/write register on channel 'device1' (unitId 255), starting at register 99.
      let vals = [1, 0, 1, 0, 2, 2, 1, 1, 2, 2, 0, 0, 0, 1, 2, 2];
      let successStatus = nodbusSerialClient.maskHoldingRegister(vals, 'device1', 255, 99);



Method: nodbusSerialClient.presetSingleRegister(value, channelId, unitId, startRegister, asciiMode)
----------------------------------------------------------------------------------------------------

* **value** <Buffer>: A two-byte buffer containing the register value.
* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean>: If `true`, use ASCII mode; otherwise RTU. Default: `false` (RTU).
* **Returns** <boolean>: true if success

This function creates a Preset Single Register (function 06) request and sends it to the server.

.. code-block:: javascript

      // Write register 99 on channel 'device1' (unitId 255).
      let val = Buffer.alloc(2);
      val.writeInt16BE(4567);
      let successStatus = nodbusSerialClient.presetSingleRegister(val, 'device1', 255, 99);

    
Method: nodbusSerialClient.presetMultipleRegisters(values, channelId, unitId, startRegister, asciiMode)
---------------------------------------------------------------------------------------------------------

* **values** <Buffer>: Buffer with register values (2 bytes per register).
* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean>: If `true`, use ASCII mode; otherwise RTU. Default: `false` (RTU).
* **Returns** <boolean>: true if success

This function creates a Preset Multiple Registers (function 16) request and sends it to the server. The number of registers is half the length of the `values` buffer (2 bytes per register).

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
      let successStatus = nodbusSerialClient.presetMultipleRegisters(vals, 'device1', 255, 99);



Method: nodbusSerialClient.readCoils(channelId, unitId, startCoil, coilsCuantity, asciiMode)
---------------------------------------------------------------------------------------------

* **channelId** <string>: Channel name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startCoil** <number>: Starting coil to read at 0 address.
* **coilsCuantity** <number>: Number of coils to read.
* **asciiMode** <boolean>: If `true`, use ASCII mode; otherwise RTU. Default: `false` (RTU).
* **Returns** <boolean>: true if success

This function creates a Read Coil (function 01) request and sends it to the server.

.. code-block:: javascript

      // Read 14 coils starting at address 10 on channel 'device1'.
      let successStatus = nodbusSerialClient.readCoils('device1', 255, 10, 14);


Method: nodbusSerialClient.readHoldingRegisters(channelId, unitId, startRegister, registersCuantity,  asciiMode)
------------------------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of registers to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This function creates a Read Holding Registers (function 03) request and sends it to the server.

.. code-block:: javascript

      // Read 4 holding registers starting at register 10 on channel 'device1'.
      let successStatus = nodbusSerialClient.readHoldingRegisters('device1', 255, 10, 4);



Method: nodbusSerialClient.readInputs(channelId, unitId, startInput, inputsCuantity,  asciiMode)
--------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startInput** <number>: Starting input to read at 0 address.
* **inputsCuantity** <number>: Number of inputs to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This function creates a Read Discrete Inputs (function 02) request and sends it to the server.

.. code-block:: javascript

      // Read 6 discrete inputs starting at address 0 on channel 'device1'.
      let successStatus = nodbusSerialClient.readInputs('device1', 255, 0, 6);


Method: nodbusSerialClient.readInputRegisters(channelId, unitId, startRegister, registersCuantity, asciiMode)
--------------------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of inputs to read.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This function creates a Read Input Registers (function 04) request and sends it to the server.

.. code-block:: javascript

      // Read 4 input registers starting at register 10 on channel 'device1'.
      let successStatus = nodbusSerialClient.readInputRegisters('device1', 255, 10, 4);



Method: nodbusSerialClient.readWriteMultiplesRegisters(values, channelId, unitId, readStartingRegister, readRegisterCuantity, writeStartingRegister, asciiMode)
---------------------------------------------------------------------------------------------------------------------------------------------------------------

* **values** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy Modbus unit id used by some gateways. The Modbus specification recommends using 255 for local devices.
* **readStartingRegister** <number>: Starting input to read at 0 address.
* **readRegisterCuantity** <number>: Number of registers to read.
* **writeStartingRegister** <number>: Register to write at 0 address.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <boolean>: true if success

This function creates a Read/Write Multiple Registers (function 23) request and sends it to the server.

.. code-block:: javascript

      // Write 3 registers starting at 99 and read 5 registers starting at 10 on channel 'device1'.
      let vals = Buffer.alloc(6);
      let tempRegister = Buffer.alloc(2);
      tempRegister.writeUInt16BE(245);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 0);
      tempRegister.writeUInt16BE(8965);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 1);
      tempRegister.writeUInt16BE(1045);
      nodbusSerialClient.setWordToBuffer(tempRegister, vals, 2);
      let successStatus = nodbusSerialClient.readWriteMultiplesRegisters(vals, 'device1', 255, 10, 5, 99);




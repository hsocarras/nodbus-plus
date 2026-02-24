.. _nodbus_serial_server:

===========================
Class: NodbusSerialServer
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

       

The `NodbusSerialServer` class extends :ref:`ModbusSerialServer <modbus_serial_server>` to provide a fully functional Modbus serial server implementation.

Creating a NodbusSerialServer Instance
========================================

new nodbusSerialServer([netType], [options])
---------------------------------------------

* **netType** <Class>: This argument define the constructor for the net layer. See :ref:`NetServer Class <nodbus_net_server>`
* **options** <object>: Configuration object with following properties:

  * transmissionMode <boolean>: 0 for RTU mode, 1 for ASCII mode (default: ``0``).
  * address <number>: Modbus slave address; must be between 1–247 (default: ``1``).
  * inputs <number>: Quantity of discrete inputs (0–65535). If set to 0, inputs share the same buffer as input registers (default: ``2048``).
  * coils <number>: Quantity of coils (0–65535). If set to 0, coils share the same buffer as holding registers (default: ``2048``).
  * holdingRegisters <number>: Quantity of holding registers (1–65535, default: ``2048``).
  * inputRegisters <number>: Quantity of input registers (1–65535, default: ``2048``).
  * port <number|string>: TCP/UDP port or serial port path (example: ``COM1``).
  * udpType <string>: UDP socket type; either ``udp4`` or ``udp6`` (default: ``udp4``).
  * baudRate <number>: Baud rate in bits per second (example: 9600, 19200, 38400, 57600, 115200, default: ``19200``).

  * dataBits <number>: 7 or 8 (default: ``8``).
  * stopBits <number>: 1 or 2 (default: ``1``).
  * parity <string>: ``none``, ``even``, or ``odd`` (default: ``none``).

  * timeBetweenFrame <number>: The number of milliseconds elapsed without receiving data on the serial port to consider that the RTU frame has finished.


* **Returns:** <NodbusSerialServer>
  
Nodbus-plus come with built-in NetServer implementations for TCP, UDP, and serial transports, that con be imported to construct a NodbusSerialServer. See :ref:`NetServer Class <nodbus_net_server>` for more details.

.. code-block:: javascript

      const Tcp = require('nodbus-plus').NetTcpServer;
      const Udp = require('nodbus-plus').NetUdpServer;
      const Serial = require('nodbus-plus').NetSerialServer;

      let config = {
         port: 'COM1', //mandatory to define port
      }
      let nodbusSerialServer = new nodbus.NodbusSerialServer(Serial, config);


NodbusPlus also expose the function createSerialServer([netConstructor], [options]) to create new instances for NodbusSerialClass with built in NetServer implementations. 
netConstructor is a string that can be 'tcp', 'udp4' or 'udp6' or 'serial' to create a NodbusSerialServer with the corresponding NetServer implementation. 
If netConstructor is not provided or diferent that allowed values, the created NodbusSerialServer will use the built in serial NetServer.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');

      let config1 = {
         port: 502, //mandatory to define port
      }

      let config2 = {
         port: 'COM1',
      }

      let nodbusSerialServer = nodbus.createSerialServer('serial', config1);
      let nodbusSerialServer2 = nodbus.createSerialServer('serial', config2); 
       


Alternatively, create a `NodbusSerialServer` with a custom :ref:`NetServer <nodbus_net_server>`.

.. code-block:: javascript

      const NodbusSerialServer = require('nodbus-plus').NodbusSerialServer;
      const NetServer = require('custom/net/custom_server.js');

      let config = {port: 'COM1'};
      let nodbusSerialServer = new NodbusSerialServer(NetServer, config);

     

NodbusSerialServer's Events
===========================

**Inherited Events**

The following events are inherited from :ref:`ModbusSerialServer Class <modbus_serial_server>`:
- ``error`` : Emitted when an error occurs. Args: **e** <Error>.
- ``exception`` : Emitted when a Modbus exception is generated. Args: **functionCode** <number>, **exceptionCode** <number>, **name** <string>.
- ``write-coils`` : Emitted after coils are written. Args: **startCoil** <number>, **quantityOfCoils** <number>.
- ``write-registers`` : Emitted after holding registers are written. Args: **startRegister** <number>, **quantityOfRegisters** <number>.


Event: 'closed'
----------------

Emitted when the server is closed.

.. code-block:: javascript

      nodbusSerialServer.on('closed', () => {
        console.log('Server has closed');
      });


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.

.. code-block:: javascript

      nodbusSerialServer.on('error', (e) => {
        console.error('Server error:', e);
      });


Event: 'data'
---------------------

* **source** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.
                        or a node serial port object.

* **data** <Buffer>: Raw bytes received.

Emitted when the underlying transport layer receives data.

.. code-block:: javascript

      nodbusSerialServer.on('data', (source, data) => {
        console.log('Data received from', source, ':', data);
      });


Event: 'listening'
------------------

* **port** <number|string>: TCP/UDP port or serial port path.

Emitted when the server starts listening or the serial port opens.

.. code-block:: javascript

      nodbusSerialServer.on('listening', (port) => {
        console.log('Server is now listening on port', port);
      });

Event: 'request'
----------------

* **source** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 
        or node serial port object.

* **request** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.

  * *address* <number>: The modbus address.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emitted after the data event and only if the data validates at the network layer. This means that the received data has been validated as a complete and valid Modbus ADU frame,
  but before any protocol-level validation is performed on the PDU. Address matching and CRC/LRC checks are included in the network layer validation, but function code and data validation are not.
  This allows you to inspect all incoming requests, including those with unsupported function codes or invalid data, before the server generates an exception response.

.. code-block:: javascript

      nodbusSerialServer.on('request', (source, request) => {
        console.log('Modbus request received from', source, ':', request);
      });

Event: 'response'
------------------

* **source** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 
                or node serial port object.

* **response** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  * 
  * *address* <number>: The modbus address.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emitted before sending the response ADU buffer to the socket.

.. code-block:: javascript

      nodbusSerialServer.on('response', (source, response) => {
        console.log('Modbus response being sent to', source, ':', response);
      });


Event: 'write'
---------------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  
  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_ or node serial port object.

* **res** <Buffer>: Server's response.

Emitted when the underlying transport writes data to the socket.

.. code-block:: javascript

      nodbusSerialServer.on('write', (source, res) => {
        console.log('Data written to', source, ':', res);
      });



NodbusSerialServer's Atributes
===============================


**Inherited Attributes**

The following attributes are inherited from :ref:`ModbusServer Class <modbus_server>`:

- ``_internalFunctionCode`` — Map of supported Modbus function codes (Map<number, string>).
- ``supportedFunctionCode`` — Getter that returns an iterator over supported function codes.
- ``holdingRegisters`` — Buffer containing holding registers (4x reference).
- ``inputRegisters`` — Buffer containing input registers (3x reference).
- ``inputs`` — Buffer containing discrete inputs (1x reference).
- ``coils`` — Buffer containing coils (0x reference).

From :ref:`ModbusSerialServer Class <modbus_serial_server>`:

- ``address`` — Modbus slave address (1–247).
- ``transmissionMode`` — 0 for RTU mode, 1 for ASCII mode (default: 0).
- ``busMessageCount`` — Diagnostic counter for total messages received.
- ``busCommunicationErrorCount`` — Diagnostic counter for communication errors.
- ``busCharacterOverrunCount`` — Diagnostic counter for character overruns.
- ``slaveMessageCount`` — Diagnostic counter for messages processed by the slave.
- ``slaveNoResponseCount`` — Diagnostic counter for requests that did not receive a response.
- ``slaveNAKCount`` — Diagnostic counter for requests that received a NAK response.
- ``slaveBusyCount`` — Diagnostic counter for requests that received a "slave busy" response.
- ``slaveExceptionErrorCount`` — Diagnostic counter for requests that received an exception response.
-  ``exceptionCoils`` — Buffer containing 8 exception coils.



Attribute: nodbusSerialServer.isListening
--------------------------------------------

* <boolean>

A getter that return the listening status.
      

Attribute: nodbusSerialServer.net
--------------------------------------------

* <Object>

A instance of a NetServer Class. See :ref:`NetServer Class <nodbus_net_server>`.


Attribute: nodbusSerialServer.port
--------------------------------------------

* <number|string>: TCP/UDP port or serial port path (example: ``COM1``).



NodbusSerialServer's Methods
=============================

**Inherited Methods**

The following methods are inherited from :ref:`ModbusServer Class <modbus_server>`:

- ``processReqPdu(reqPduBuffer)`` : Main function that processes a request PDU and returns a response PDU.
- ``makeExceptionResPdu(mbFunctionCode, exceptionCode)`` : Creates an exception response PDU.
- ``readCoilsService(pduReqData)`` : Executes Function Code 01 (Read Coil Status).
- ``readDiscreteInputsService(pduReqData)`` : Executes Function Code 02 (Read Discrete Inputs).
- ``readHoldingRegistersService(pduReqData)`` : Executes Function Code 03 (Read Holding Registers).
- ``readInputRegistersService(pduReqData)`` : Executes Function Code 04 (Read Input Registers).
- ``writeSingleCoilService(pduReqData)`` : Executes Function Code 05 (Write Single Coil).
- ``writeSingleRegisterService(pduReqData)`` : Executes Function Code 06 (Write Single Register).
- ``writeMultipleCoilsService(pduReqData)`` : Executes Function Code 15 (Write Multiple Coils).
- ``writeMultipleRegistersService(pduReqData)`` : Executes Function Code 16 (Write Multiple Registers).
- ``maskWriteRegisterService(pduReqData)`` : Executes Function Code 22 (Mask Write Register).
- ``readWriteMultipleRegistersService(pduReqData)`` : Executes Function Code 23 (Read/Write Multiple Registers).
- ``getBoolFromBuffer(targetBuffer, [offset])`` : Reads a boolean value from a buffer at the specified offset.
- ``setBoolToBuffer(value, targetBuffer, [offset])`` : Writes a boolean value to a buffer at the specified offset.
- ``getWordFromBuffer(targetBuffer, [offset])`` : Reads a 16-bit word from a buffer at the specified offset.
- ``setWordToBuffer(value, targetBuffer, [offset])`` : Writes a 16-bit word to a buffer at the specified offset.
  
For :ref:`ModbusSerialServer Class Methods <modbus_serial_server_methods>`:

- ``aduAsciiToRtu(asciiFrame)`` — Convert an ASCII ADU to RTU format with CRC checksum.
- ``aduRtuToAscii(rtuFrame)`` — Convert an RTU ADU to ASCII format with LRC checksum.
- ``calcCRC(frame)`` — Calculate the CRC-16 checksum for an RTU frame.
- ``calcLRC(frame)`` — Calculate the LRC checksum for an ASCII frame.
- ``executeBroadcastRequest(reqPduBuffer)`` — Execute a broadcast request without generating a response.
- ``getAddress(reqAduBuffer)`` — Get the address field from a Modbus RTU request.
- ``getPdu(reqAduBuffer)`` — Get the PDU from a Modbus RTU request.
- ``getChecksum(reqAduBuffer)`` — Get the checksum from a Modbus frame.
- ``getResponseAdu(reqPduBuffer)`` — Get the response ADU buffer for a given request adu buffer.
- ``readExceptionCoilsService(pduData)`` — This method execute the read exception coils indication on the server.
- ``resetCounters()`` — Reset all diagnostic counters to 0.
- ``validateAddress(reqAduBuffer)`` — Validate the address field of a Modbus RTU request against the server's configured address.
- ``validateChecksum(reqAduBuffer)`` — Validate the checksum of a Modbus RTU request.


Method: nodbusSerialServer.start()
------------------------------------------------

Start the server. The server emits a ``listening`` event when ready to accept connections.

.. code-block:: javascript

      nodbusSerialServer.start();

Method: nodbusSerialServer.stop()
------------------------------------------------

Stop the server. The server emits a ``closed`` event when all connections are closed and resources are released.

.. code-block:: javascript

      nodbusSerialServer.stop();
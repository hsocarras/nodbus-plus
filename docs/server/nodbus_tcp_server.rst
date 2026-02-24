.. _nodbus_tcp_server:

===========================
Class: NodbusTcpServer
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3


The `NodbusTcpServer` class extends the :ref:`ModbusTcpServer Class <modbus_tcp_server>` and implements a fully functional Modbus TCP server.

Creating a NodbusTcpServer Instance
===================================

new NodbusTcpServer([netType], [options])
------------------------------------------

* **netType** <Class>: Constructor for the transport layer. See :ref:`NetServer Class <nodbus_net_server>`.
* **options** <object>: Configuration object with the following properties:

  * ``inputs`` <number>: Number of discrete inputs (0–65535). If set to ``0``, inputs share the same buffer as input registers. Default: ``2048``.
  * ``coils`` <number>: Number of coils (0–65535). If set to ``0``, coils share the same buffer as holding registers. Default: ``2048``.
  * ``holdingRegisters`` <number>: Number of holding registers (1–65535). Default: ``2048``.  
  * ``inputRegisters`` <number>: Number of input registers (1–65535). Default: ``2048``.
  * ``port`` <number|string>: TCP port on which the server will listen (example: ``502``). Default: ``502``.
  * ``maxConnections`` <number>: Maximum simultaneous connections allowed by the server. Default: ``32``.
  * ``udpType`` <string>: UDP socket type when UDP transport is used; either ``udp4`` or ``udp6``. Default: ``udp4``.

* **Returns:** <NodbusTcpServer>
  
Nodbus-plus come with built-in NetServer implementations for TCP and UDP transports, that con be imported to construct a NodbusTcpServer. 
See :ref:`NetServer Class <nodbus_net_server>` for more details.

.. code-block:: javascript

      const Tcp = require('nodbus-plus').NetTcpServer;
      const Udp = require('nodbus-plus').NetUdpServer;
      // Modbus TCP server using TCP transport
      let nodbusTcpServer = new NodbusTcpServer(Tcp, {port: 1502});

NodbusPlus also expose the function createTcpServer([netConstructor], [options]) to create new instances for NodbusTcpServer with built in NetServer implementations. 
netConstructor is a string that can be 'tcp', 'udp4' or 'udp6' to create a NodbusTcpServer with the corresponding NetServer implementation. 
If netConstructor is not provided or diferent that allowed values, the created NodbusTcpServer will use the built in TCP NetServer.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');

      // Default TCP server (uses TCP transport)
      let nodbusTcpServer = nodbus.createTcpServer('tcp');

      let config = { port: 1502 };

      // Modbus TCP server listening on port 1502 using UDP6 transport
      let nodbusTcpServer2 = nodbus.createTcpServer('udp6', config);

      // Modbus TCP server using UDP4 transport
      let nodbusTcpServer3 = nodbus.createTcpServer('udp4', config);

Alternatively, create a `NodbusTcpServer` with a custom :ref:`NetServer <nodbus_net_server>`.

.. code-block:: javascript

      const NodbusTcpServer = require('nodbus-plus').NodbusTcpServer;
      const NetServer = require('custom/net/custom_server.js');  // Example custom NetServer (not included in nodbus-plus)

      let config = {};
      let nodbusTcpServer = new NodbusTcpServer(NetServer, config);


NodbusTcpServer's Events
=========================

**Inherited Events**

The following events are inherited from :ref:`ModbusTcpServer Class <modbus_tcp_server>`:

- ``error`` : Emitted when an error occurs. Args: **e** <Error>.
- ``exception`` : Emitted when a Modbus exception is generated. Args: **functionCode** <number>, **exceptionCode** <number>, **name** <string>.
- ``write-coils`` : Emitted after coils are written. Args: **startCoil** <number>, **quantityOfCoils** <number>.
- ``write-registers`` : Emitted after holding registers are written. Args: **startRegister** <number>, **quantityOfRegisters** <number>.


Event: 'closed'
----------------

Emitted when the server is closed.

.. code-block:: javascript

      nodbusTcpServer.on('closed', () => {
          console.log('Server closed');
      });


Event: 'connection'
-------------------

* **socket** <Object>: A node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_.

Emitted when a client connects. Only emitted when the TCP transport is used.

.. code-block:: javascript

      nodbusTcpServer.on('connection', (socket) => {
          console.log('New client connected');
      });


Event: 'connection-closed'
---------------------------

Emitted when a client's socket is closed and destroyed.

.. code-block:: javascript

      nodbusTcpServer.on('connection-closed', (socket) => {
          console.log('Client connection closed');
      });


Event: 'data'
---------------------

* **source** <object>: A `net.Socket` if TCP is used, or a datagram ``rinfo`` object for UDP.
* **data** <Buffer>: Raw bytes received.

Emitted when the underlying net server emits a ``data`` event.

.. code-block:: javascript

      nodbusTcpServer.on('data', (source, data) => {
          console.log('Data received from', source, ':', data);
      });


Event: 'listening'
------------------

* **port** <number|string>: TCP port on which the server is listening.

Emitted when the server starts listening or the underlying transport is ready.

.. code-block:: javascript

      nodbusTcpServer.on('listening', (port) => {
          console.log('Server is now listening on port', port);
      });


Event: 'request'
----------------

* **source** <object>: A `net.Socket` if TCP is used, or a datagram ``rinfo`` object for UDP.
* **request** <object>: An object with the following properties:

  * *timeStamp* <number>: Request timestamp.
  * *transactionId* <number>: MBAP header transaction id.
  * *unitId* <number>: MBAP header unit id.
  * *functionCode* <number>: Modbus function code.
  * *data* <Buffer>: PDU data.

Emitted after the data event and only if the data validates at the network layer. This means that the received data has been validated as a complete and valid Modbus ADU frame,
but before any protocol-level validation is performed on the PDU. Header fields are validated, but function code and data validation are not.
This allows you to inspect all incoming requests, including those with unsupported function codes or invalid data, before the server generates an exception response.

.. code-block:: javascript

      nodbusTcpServer.on('request', (socket, request) => {
          console.log('Received request:', request);
      });

Event: 'response'
------------------

* **source** <object>: A `net.Socket` (TCP) or datagram ``rinfo`` (UDP).
* **response** <object>: An object with the following properties:

  * *timeStamp* <number>: Response timestamp.
  * *transactionId* <number>: MBAP header transaction id.
  * *unitId* <number>: MBAP header unit id.
  * *functionCode* <number>: Modbus function code.
  * *data* <Buffer>: PDU data.

Emitted before sending the response ADU buffer to the socket.

.. code-block:: javascript

      nodbusTcpServer.on('response', (source, response) => {
          console.log('Sending response:', response);
      });

Event: 'write'
---------------------

* **source** <object>: A `net.Socket` (TCP) or datagram ``rinfo`` (UDP).
* **res** <Buffer>: Server's response buffer.

Emitted when the underlying transport writes data to the socket.

.. code-block:: javascript

      nodbusTcpServer.on('write', (source, res) => {
          console.log('Data written to', source, ':', res);
      });


NodbusTcpServer's Attributes
============================

**Inherited Attributes**

The following attributes are inherited from :ref:`ModbusServer Class <modbus_server>`:

- ``_internalFunctionCode`` — Map of supported Modbus function codes (Map<number, string>).
- ``supportedFunctionCode`` — Getter that returns an iterator over supported function codes.
- ``holdingRegisters`` — Buffer containing holding registers (4x reference).
- ``inputRegisters`` — Buffer containing input registers (3x reference).
- ``inputs`` — Buffer containing discrete inputs (1x reference).
- ``coils`` — Buffer containing coils (0x reference).



Attribute: nodbusTcpServer.isListening
--------------------------------------

* <boolean>

Getter that returns the server listening status.


Attribute: nodbusTcpServer.net
------------------------------

* <Object>

Instance of a NetServer class. See :ref:`NetServer Class <nodbus_net_server>`.


Attribute: nodbusTcpServer.maxConnections
-----------------------------------------

* <number>

Maximum number of simultaneous connections allowed by the server.


Attribute: nodbusTcpServer.port
-------------------------------

* <number>

TCP port on which the server listens.


NodbusTcpServer's Methods
=========================

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
  
 For :ref:`ModbusTcpServer Class Methods <modbus_tcp_server_methods>`:

- ``getMbapHeader(reqAduBuffer)`` : Get the MBAP header from a Modbus TCP ADU buffer.
- ``getPdu(reqAduBuffer)`` : Get the PDU from a Modbus TCP ADU buffer.
- ``getResponseAdu(reqAduBuffer)`` : Get the response ADU buffer for a given request adu buffer.
- ``validateMbapHeader(reqAduBuffer)`` : Validate the MBAP header of a Modbus TCP ADU buffer. 


Method: nodbusTcpServer.start()
------------------------------------------------

Start the server. Emits the event ``listening`` when ready to accept connections.

.. code-block:: javascript

      nodbusTcpServer.start();


Method: nodbusTcpServer.stop()
------------------------------------------------

Stop the server. Emits the event ``closed`` when all connections have been closed.

.. code-block:: javascript

      nodbusTcpServer.stop();
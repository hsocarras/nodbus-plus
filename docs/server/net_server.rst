
.. _nodbus_net_server:

===========================
API: Net Server
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

The Nodbus library uses a NetServer abstraction to implement the network layer for Modbus servers (TCP, UDP, or serial).
A  build-in NetServer instance may wrap one of the following transport implementations:

- ``tcpServer`` — wrapper around Node's ``net.Server`` (`node.net.Server <https://nodejs.org/api/net.html#class-netserver>`_).
- ``udpServer`` — wrapper around Node's ``dgram.Socket`` (`node.dgram.Socket <https://nodejs.org/api/dgram.html#class-dgramsocket>`_).
- ``serialServer`` — wrapper around the ``serialport`` package (`serialport <https://serialport.io/>`_).


Creating a NetServer instance
=============================

new NetServer([options])
------------------------

``options`` is an object whose supported properties depend on the transport type.

TCP / UDP options

  * *port* <number>: TCP/UDP port to listen on (default: ``502``).
  * *maxConnections* <number>: Maximum simultaneous TCP connections (TCP only). Default: ``32``.
  * *udpType* <string>: For UDP channels, either ``udp4`` or ``udp6`` (default: ``udp6``).

Serial options

  * *port* <string>: Serial port path (example: ``COM1``).
  * *baudRate* <number>: Baud rate in bps (for example: 110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200). Default: ``19200``.
  * *dataBits* <number>: 7 or 8 (default: ``8``).
  * *stopBits* <number>: 1 or 2 (default: ``1``).
  * *parity* <string>: ``none``, ``even``, or ``odd`` (default: ``none``).
  * *timeBetweenFrame* <number>: Milliseconds to consider the end of a Modbus RTU frame.

Constructor returns a configured NetServer instance for the chosen transport.


Event hooks
===========

`NetServer` is not an EventEmitter. Instead, it exposes hook properties that the caller assigns to handle transport events. Hook signatures are documented below.

onConnectionAcceptedHook()
---------------------------

Called when the underlying transport accepts a new connection (TCP).

* **socket** <object>: The connection/socket object created by the transport.
  
.. code-block:: javascript

      netServer.onConnectionAcceptedHook = (socket) => {
        console.log('New connection accepted:', socket.remoteAddress);
      };

onDataHook(data)
-----------------

Called when raw data arrives from the transport. This is invoked before any protocol-level validation.

* **source** <object>: The source of the data (socket in tcp, rinfo in udp or serial port in serial).
* **data** <Buffer>: Raw bytes received.

.. code-block:: javascript

      netServer.onDataHook = (source, data) => {
        console.log('Data received from', source, ':', data);
      };

onErrorHook(err)
-----------------

Called when the transport reports an error.

* **err** <Error>: Error object.

.. code-block:: javascript

      netServer.onErrorHook = (err) => {
        console.error('Transport error:', err);
      };


onListeningHook()
------------------

Called when the underlying server starts listening. No arguments are passed.

.. code-block:: javascript

      netServer.onListeningHook = () => {
        console.log('Server is now listening on port', netServer.port);
      };

onMbAduHook(source,data)
-------------------------

Called when received data has been validated as a Modbus ADU (after protocol-level validation).

* **source** <object>: The source of the data (socket in tcp, rinfo in udp or serial port in serial).
* **data** <Buffer>: Validated Modbus ADU.

onServerCloseHook()
--------------------

Called when the underlying transport closes. No arguments are passed.

.. code-block:: javascript

      netServer.onServerCloseHook = () => {
        console.log('Server has closed');
      };

onWriteHook(source, data)
--------------------------

Called after data has been written to the transport.

* **source** <object>: The source of the data (socket in tcp, rinfo in udp or serial port in serial).
* **data** <Buffer>: Bytes that were written.

.. code-block:: javascript

      netServer.onWriteHook = (source, data) => {
        console.log('Data written to', source, ':', data);
      };

Attributes
==========

Attribute: netServer.activeConnections (TCP only)
--------------------------------------------------

* <Array>: List of active connections/sockets.

Attribute: netServer.coreServer
-------------------------------

* <object> — Underlying transport instance:

  * ``net.Server`` for TCP
  * ``dgram.Socket`` for UDP
  * ``SerialPort`` for serial transport (from the ``serialport`` package)

This property stores the actual transport object used by the NetServer wrapper.

Attribute: netServer.isListening
--------------------------------

* <boolean>: ``true`` when the underlying transport is listening/open, otherwise ``false``.

Attribute: netServer.maxConnections
-----------------------------------

* <number>: Maximum number of TCP connections (TCP only).

Attribute: netServer.port
-------------------------

* <number|string>: TCP/UDP port number or serial port path.

Attribute: netServer.tcpCoalescingDetection
-------------------------------------------

* <boolean>: Enable or disable TCP coalescing detection for Modbus TCP frames (default: ``false``).

Attribute: netServer.validateFrame
----------------------------------

* <function>: Function used to validate incoming frames at the network layer. 
It receives a ``Buffer`` containing the frame and should return ``true`` when the frame is complete and valid for the chosen protocol.

Attributes: hook properties
----------------------------

The following hook properties reference functions described in the "Event hooks" section above:

- ``onConnectionAcceptedHook``
- ``onDataHook``
- ``onErrorHook``
- ``onListeningHook``
- ``onMbAduHook``
- ``onServerCloseHook``
- ``onWriteHook``


Methods
=======

Method: netServer.start()
-------------------------

Start the server and begin accepting connections or listening on the configured transport.

.. code-block:: javascript

      netServer.start();

Method: netServer.stop()
------------------------

Stop the server. Existing connections may be closed and no new connections will be accepted.

.. code-block:: javascript

      netServer.stop();

Method: netServer.write(socket, frame)
--------------------------------------

Write a frame to a client socket.

* **socket** <object>: The destination socket/connection.
* **frame** <Buffer>: Buffer containing the ADU or PDU to send.

After writing, the implementation should call the ``onWriteHook`` hook.


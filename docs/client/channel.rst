
.. _nodbus_net_channel:

===========================
API: Net Channel
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

NetChannel (network channel) is the abstraction used by Nodbus-Plus to implement the network layer for Modbus clients.
Nodbus-plus come with built-in NetChannel implementations for TCP, UDP, and serial transports. These are:

- ``TcpChannel`` — a thin wrapper around Node's ``net.Socket``.
- ``UdpChannel`` — a thin wrapper around Node's ``dgram.Socket``.
- ``SerialChannel`` — a wrapper around `serialport <https://serialport.io/>`_.

A custom NetChannel implementation can be used by implementing the same interface.

Creating a NetChannel instance
===============================

new NetChannel([options])
-------------------------

``options`` is an object whose supported properties depend on the transport type:

TCP / UDP options

  * *port* <number>: TCP/UDP port to connect to (default: ``502``).
  * *ip* <string>: IP address or hostname (default: ``localhost``).
  * *timeout* <number>: Milliseconds to await for a response on the channel.
  * *udpType* <string>: For UDP channels, either ``udp4`` or ``udp6`` (default: ``udp6``).

Serial options

  * *port* <string>: Serial port path, e.g. ``COM1`` or ``/dev/ttyUSB0``.
  * *baudRate* <number>: Baud rate (for example: 9600, 19200, 38400, 57600, 115200).
  * *dataBits* <number>: 7 or 8 (default: 8).
  * *stopBits* <number>: 1 or 2 (default: 1).
  * *parity* <string>: ``none``, ``even``, or ``odd`` (default: ``none``).
  * *timeBetweenFrame* <number>: Milliseconds to consider the end of a Modbus RTU frame.

Constructor returns a configured NetChannel instance for the chosen transport.


Event hooks
===========

NetChannel is not itself an EventEmitter. Instead, it exposes hook properties that the calling code (for example the Nodbus client/server) assigns to handle transport events.
Hook signatures are documented below.

.. _channel_onConnectHook:

onConnectHook()
-----------------

Called when the underlying transport establishes a connection. For build in TCP this is when the TCP socket connects.
For UDP and serial channels this is called when the channel is ready to send/receive data. No arguments are passed.

.. _channel_onDataHook:

onDataHook(data)
-----------------

Called when raw data is received from the transport. The argument is a Buffer containing the received bytes. 
This is called before any protocol-level validation, so the data may not be a valid Modbus frame.

* **data** <Buffer>: Raw bytes received.

.. _channel_onErrorHook:

onErrorHook(err)
-----------------

Called when the transport reports an error.

* **err** <Error>: Error object.

.. _channel_onMbAduHook:

onMbAduHook(data)
------------------

Called when received data has been validated as a Modbus ADU (after protocol-level validation).

* **data** <Buffer>: Validated Modbus ADU.

.. _channel_onCloseHook:

onCloseHook()
-------------

Called when the underlying transport closes. No arguments are passed.

.. _channel_onWriteHook:

onWriteHook(data)
------------------

Called after data has been written to the transport.

* **data** <Buffer>: Bytes that were written.


Attributes
==========

Attribute: netChannel.coreChannel
---------------------------------

* <object>

References the underlying transport object:

  * ``net.Socket`` for TCP channels.
  * ``dgram.Socket`` for UDP channels.
  * ``SerialPort`` for serial channels (from the serialport package).

Attribute: netChannel.ip (TCP/UDP channels)
-------------------------------------------

* <string>

Remote IP address or hostname used by the channel.

Attribute: netChannel.port
--------------------------

* <number> (TCP/UDP channels) port number used by the channel. Default: ``502``.
* <string> (serial channels) Serial port path used by the channel. Example: ``COM1`` or ``/dev/ttyUSB0``.

Remote port to connect with or serial port path to open.

Attribute: netChannel.onConnectHook
------------------------------------

* <function> — Hook assigned by the caller. See :ref:`channel_onConnectHook`.

Attribute: netChannel.onDataHook
--------------------------------

* <function> — Hook assigned by the caller. See :ref:`channel_onDataHook`.

Attribute: netChannel.onErrorHook
---------------------------------

* <function> — Hook assigned by the caller. See :ref:`channel_onErrorHook`.

Attribute: netChannel.onMbAduHook
---------------------------------

* <function> — Hook assigned by the caller. See :ref:`channel_onMbAduHook`.

Attribute: netChannel.onWriteHook
---------------------------------

* <function> — Hook assigned by the caller. See :ref:`channel_onWriteHook`.

Attribute: netChannel.tcpCoalescingDetection (TCP/UDP channels)
------------------------------------------------------------------

* <boolean> — Enable or disable TCP coalescing detection for Modbus TCP. Default: ``false``.

Attribute: netChannel.validateFrame
-----------------------------------

* <function> — Optional validator function used to verify received frames. Must have the following signature:
* **frame** <Buffer>: Buffer containing the received bytes.
* **returns** <boolean>: Should return ``true`` if the frame is valid for the protocol in use, or ``false`` otherwise.


Methods
=======

netChannel.connect()
---------------------

* **returns** <Promise>: Resolves when the transport connection is established. The resolved value is transport-specific (for TCP it is the socket), or the promise is rejected on connection error.

Establishes the transport connection (open serial port, connect TCP socket, etc.).

netChannel.disconnect()
------------------------

* **returns** <Promise>: Resolves when the transport connection is closed.

Closes the transport (close serial port or TCP socket).

netChannel.isConnected()
-------------------------

* **returns** <boolean>: ``true`` if the transport is currently connected/open.

netChannel.write(frame)
-------------------------------

* **frame** <Buffer>: Buffer containing bytes to send.
* **returns** <boolean>: ``true`` if the write operation was successfully initiated, or ``false`` if there was an error (for example, if the transport is not connected).

Writes bytes to the transport. After the write completes the channel should call ``onWriteHook`` (if assigned) with the written data.


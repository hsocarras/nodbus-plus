.. _nodbus_net_channel:

===========================
API: Net Channel
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

Nodbus implementation for a  modbus TCP or serial client use a netChanner object to implement the network layer. This object can be one of the following types:

* **TcpChannel**: A wrapper around node `net.Socket <https://nodejs.org/api/net.html#class-netserver>`_.

* **UdpChannel**: A wrapper around node `dgram.Socket <https://nodejs.org/api/dgram.html#class-dgramsocket>`_.

* **SerialChannel**: A wrapper around node `serialport <https://serialport.io/>`_ .


Creating a Nodbus NetChannel Instance
====================================

new NetChannel([options])
-------------------------

* **options** <object>: Configuration object with the following properties (for tcp and udp channel) :

   * port <number> : The tcp or udp port to listen. Default 502.
   * ip <string>: Ip address

* **options** <object>: Configuration object with the following properties (for serial channel):

   * port <string> : The path to the serial port. Example 'COM1.
   * speed <number>: Enum with following baudrates in bps : 0-110, 1-300, 2-1200, 3-2400, 4-4800, 5-9600, 6-14400, 7-19200, 8-38400, 9-57600, 10-115200. Default 7.
   * dataBits <number>: 7 or 8. Default 8.
   * stopBits <number>: 0 or 1.
   * parity <number>: Enum with following value. 0-'none', 1-'even', 2-'odd'. Default 1.
   * timeBetweenFrame <number>: Number of millisends to await without receiving data to consider end of modbus frame.

Constructor for new NetChannel instance.


NetChannel Event's Hooks
========================

The net channel object is not a event emitter, instead it uses the core channel's events to call hooks functions.

onConnectHook
-------------------------

This function is called when the core channel object emits the 'connect' event.

onDataHook
-----------


* **data** <Buffer>: Data received.

This function is called when the core channel emits the data event.

onErrorHook
-----------

* **e** <object>: error object.

This function is called when the core channel emits the 'error' event.


onMbAduHook
-------------


* **data** <Buffer>: Data received.

This hook function is similar to onDataHook, but is only called when the buffer received has been validated.


onCloseHook
------------------

This hook function is called when core channel emits the 'close' event. It is called with no arguments.

onWriteHook
-----------

* **data** <Buffer>: Data sended.

This hook function is called when data has been sennded to a server. It is called when connection socket write some data.


NetChannel's Atributes
=======================

Atribute: netChannel.coreChannel
---------------------------------

* <object>

   * **net.Socket**: For tcp `node <https://nodejs.org/api/net.html#class-netsocket>`_. 
   * **dgram.Socket**: For udp `node <https://nodejs.org/api/dgram.html#class-dgramsocket>`_.
   * **SerialPort**: A wrapper around node `serialport <https://serialport.io/docs/api-serialport>`_ .

This property is a node net.Socket or  udp.Socket in nodbus tcpClient class or serialport from serialport library in nodbus serial client. 
The netChannel class in Nodbus-Plus library is a wrapper around one of this main class.

Atribute: netChannel.ip
--------------------------------------------

* <string>: server's ip address.


Atribute: netChannel.onConnectHook
----------------------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onConnectHook`


Atribute: netChannel.onDataHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onDataHook`


Atribute: netChannel.onErrorHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onErrorHook`



Atribute: netChannel.onMbAduHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onMbAduHook`



Atribute: netChannel.onWriteHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onWriteHook`

Atribute: netChannel.port
-----------------------------

* <number>

Port where the server is listening.

Atribute: netChannel.tcpCoalescingDetection
--------------------------------------------

* <boolean>

Activate o deactivate the tcp coalscing detection function for modbus tcp protocol. Default false.


Atribute: netChannel.validateFrame
----------------------------------

* <function>

This property is a reference to a function that performs validation.
 It defines how the nodbus server executes certain protocols for validating data at the network layer level.

 It is called with a Buffer as argument with the modbus frame received.


netChannel's Methods
====================


Method: netChannel.connect()
-------------------------------

* **Return** <Promise>: Promise that will be resolve when the connection is stabished whit  a socket as argument, or rejected with ip and port as parameter.

This method try to connect to channels ip and port, return a promise that resolve if the connectios is stablished successfully, otherwhise is rejected.


Method: netChannel.disconnect()
-------------------------------

* **Return** <Promise>: Promise that will be resolve when the connection is closed.

Method: netChannel.isConnected()
-------------------------------

* **Return** <bool>: Return true is the socket is connected.


Method: netChannel.write(socket, frame)
-------------------------------------------------

* **socket** <object>: buffer containig the pdu's data.
* **frame** <Buffer>: buffer with response pdu.

function to write data to a server. It takes a srteam object and a buffer to write to. When data has been send, the function calls onWriteHook funtion.

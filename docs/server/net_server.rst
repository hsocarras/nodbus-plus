.. _nodbus_net_server:

===========================
API: Net Server
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

Nodbus implementation for a  modbus TCP or serial servers use a netServer object to implement the network layer. This object can be one of the following types:

* **tcpServer**: A wrapper around node `net.Server <https://nodejs.org/api/net.html#class-netserver>`_.

* **udpserver**: A wrapper around node `dgram.Socket <https://nodejs.org/api/dgram.html#class-dgramsocket>`_.

* **serialServer**: A wrapper around node `serialport <https://serialport.io/>`_ .


Creating a Nodbus NetServer Instance
====================================

new NetServer([options])
-------------------------

* **options** <object>: Configuration object with the following properties:

   * port <number> : The tcp or udp port to listen. Default 502.

   * maxConnections <number>: Max number of simultaneous connection supported. (Only tcp net server). Default 32.

   * type <string>: Used in udp server to set 'udp4' or 'udp6'. Default 'udp6'.

Constructor for new NetServer instance.


NetServer Event's Hooks
========================

The net server object is not a event emitter, instead it uses the core server events to call hooks functions.

onConnectionAcceptedHook
-------------------------

* **socket** <object>: socket created

This function is called when the core server emits the 'connection' event and the connection is accepted by the server.

onDataHook
-----------

* **socket** <object>: socket that emit the data event
* **data** <Buffer>: Data received.

This function is called when the core server emits the data event.

onErrorHook
-----------

* **e** <object>: error object.

This function is called when the core server emits the 'error' event.

onListeningHook
----------------

This function is called when the core server emit the 'listening' event. It is called with no arguments.

onMbAduHook
-------------

* **socket** <object>: socket that emit the data event
* **data** <Buffer>: Data received.

This hook function is similar to onDataHook, but is only called when the buffer received has been validated and has correct length for modbus tcp or correct checksum
for modbus serial.


onServerCloseHook
------------------

This hook function is called when core server emits the 'close' event. It is called with no arguments.

onWriteHook
-----------

* **socket** <object>: socket that emit the data event
* **data** <Buffer>: Data sended to client.

This hook function is called when data has been sennded by server to a client. It is called when connection socket write some data.


NetServer's Atributes
=====================

Atribute: netServer.activeConnections
--------------------------------------------

* <array>: An array with active connections.


Atribute: netServer.coreServer
-------------------------------

* <object>

   * **net.Server**: For tcp `node <https://nodejs.org/api/net.html#class-netserver>`_. 

   * **dgram.Socket**: For udp `node <https://nodejs.org/api/dgram.html#class-dgramsocket>`_.

   * **SerialPort**: A wrapper around node `serialport <https://serialport.io/docs/api-serialport>`_ .

This property is a node net.Server in nodbus tcpServer class or node udp.Socket in nodbus udpServer or serialport from serialport library in nodbus serialServer. 
The netServer class in Nodbus-Plus library is a wrapper around one of this main class.

Atribute: netServer.isListening
-------------------------------------

* <bool> 

True if the coreServer is listening.


Atribute: netServer.maxConnections
-------------------------------------

* <number>

The max number of connection accepted in the tcpServer type of netServer. In udpServer has no efect.

Atribute: netServer.onConnectionAcceptedHook
----------------------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onConnectionAcceptedHook`


Atribute: netServer.onDataHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onDataHook`


Atribute: netServer.onErrorHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onErrorHook`


Atribute: netServer.onListeningHook
------------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onListeningHook`


Atribute: netServer.onMbAduHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onMbAduHook`


Atribute: netServer.onServerCloseHook
--------------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onServerCloseHook`


Atribute: netServer.onWriteHook
----------------------------------

* <function>

This property is a reference for a hook function. See :ref:`onWriteHook`

Atribute: netServer.port
-----------------------------

* <number>

Port to listen to.

Atribute: netServer.tcpCoalescingDetection
--------------------------------------------

* <boolean>

Activate o deactivate the tcp coalscing detection function for modbus tcp protocol. Default false.


Atribute: netServer.validateFrame
----------------------------------

* <function>

This property is a reference to a function that performs validation.
 It defines how the nodbus server executes certain protocols for validating data at the network layer level.

 It is called with a Buffer as argument with the modbus frame received.


NetServer's Methods
====================


Method: netServer.start()
-------------------------------

This method start the server.


Method: netServer.stop()
-----------------------------

This functions stop the server. No further connection are accepted.

Method: netServer.write(socket, frame)
-------------------------------------------------

* **socket** <object>: buffer containig the pdu's data.
* **frame** <Buffer>: buffer with response pdu.

function to write data to a client. It takes a srteam object and a buffer to wrie to. When data has been send, the function calls onWriteHook funtion.


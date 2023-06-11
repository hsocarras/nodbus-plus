.. _nodbus_tcp_server:

===========================
Class: NodbusTcpServer
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

       

The NodbusTcpServer class extends the :ref:`ModbusTcpServer Class <modbus_tcp_server>`. This class implements a fully funcional modbus tcp server.

Creating a NodbusTcpServer Instance
====================================

new nodbusTcpServer([options], [netType])
------------------------------------------

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

  * port <number>: TCP port on which the server will listen. Default 502

  * maxConnections <number>: Simultaneous conextions allowed by the server. Default 32.  

  * tcpCoalescingDetection <boolean>: If this option is active the nodbus server can handle more than one modbus tcp adu in the same tcp package, 
      otherwise only one adu per package will be accepted. Default true.

  * udpType <string>: Define the type of udp socket id udp net type is configured. Can take two values 'ud4' and 'usp6'. Default 'udp4'.

* **netType** <Class>: This argument define the constructor for the net layer. See :ref:`NetServer Class <nodbus_net_server>`

* **Returns:** <NodbusTcpServer>

NodbusPlus expose the function createServer([netConstructor], [options]) to create new instances for NodbusTcpClass

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      let nodbusTcpServer = nodbus.createTcpServer('tcp'); //default settings, net layer is tcp

      let config = {
         port:1502
      }
      // modbus tcp server listen to port 1502 and udp6
      let nodbusTcpServer2 = nodbus.createTcpServer('udp6', config); 
      //or udp version 4
      let nodbusTcpServer3 = nodbus.createTcpServer('udp4', config); 

However new Nodbus plus instance can be created with customs :ref:`NetServer <nodbus_net_server>` importing the NodbusTcpServer Class.

.. code-block:: javascript

      const NodbusTcpServer = require('nodbus-plus').NodbusTcpServer;
      const NetServer = require('custom\net\custome_server.js');

      let config = {};
      let nodbusTcpServer = new NodbusTcpServer(config, NetServer);

     

NodbusTcpServer's Events
=========================

Event: 'closed'
----------------

Emitted when the server is closed.


Event: 'connection'
-------------------

* **socket** <Object>: A node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_

Emitted when a client connect. Only emmited when 'tcp' type layer is used.


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'data'
---------------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.

* **data** <Buffer>: Data received.

Emitted when the underlaying net server emit the data event.


Event: 'listening'
------------------

* **port** <number>: TCP port on which the server is listening.

Emitted when the server is listening.


Event: 'request'
----------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 

* **request** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited after the data event and only if the data had been validate at net layer level (data's length greater than 7 and equal to header's length field plus 6).


Event: 'write'
---------------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.

* **res** <Buffer>: Server's response.

Emitted when the underlaying net server write data to the socket.


NodbusTcpServer's Atributes
===========================

Atribute: nodbusServer.isListening
--------------------------------------------

* <boolean>

A getter that return the listening status.
      

Atribute: nodbusTcpServer.net
--------------------------------------------

* <Object>

A instance of a NetServer Class. See :ref:`NetServer Class <nodbus_net_server>`.


Atribute: nodbusTcpServer.maxConnections
--------------------------------------------

* <number>

Max number of simultaneous connections allowed by the server.


Atribute: nodbusTcpServer.port
--------------------------------------------

* <number>

TCP port on which the server will listen.


NodbusTcpServer's Methods
=========================


Method: nodbusTcpServer.start()
------------------------------------------------

Start the server. The server will emit the event 'listening' whhen is ready for accept connections.

Method: nodbusTcpServer.stop()
------------------------------------------------

Stop the server. The server will emit the event 'closed' when all connection are destroyed.
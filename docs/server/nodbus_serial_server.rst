.. _nodbus_serial_server:

===========================
Class: NodbusSerialServer
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

       

The NodbusSerialServer class extends the :ref:`ModbusSerialServer Class <modbus_serial_server>`. This class implements a fully funcional modbus serial server.

Creating a NodbusSerialServer Instance
====================================

new nodbusSerialServer([netType], [options])
------------------------------------------

* **netType** <Class>: This argument define the constructor for the net layer. See :ref:`NetServer Class <nodbus_net_server>`

* **options** <object>: Configuration object with following properties:

  * transmitionMode <boolean>: 0- RTU transmition mode, 1 - Ascii mode. Default 0.

  * address <number>: Modbus address, a value between 1 -247. Default 1, any invalid value with set to default.

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

  * port <number|string>: TCP port on which the server will listen or serial port like 'COM1'.   

  * udpType <string>: Define the type of udp socket id udp net type is configured. Can take two values 'ud4' and 'usp6'. Default 'udp4'.

  * speed <number>: Define the serial port baudrate. It's a enum with following values in bits per secconds.
   
    *  0: 110

    *  1: 300

    *  2: 1200

    *  3: 2400

    *  4: 4800

    *  5: 9600

    *  6: 14400

    *  7: 19200 (Default)

    *  8: 38400

    *  9: 57600

    *  10: 115200

  * dataBits <number> 7 or 8.

  * stopBits <number> Default 1.

  * parity <number> Enum with following values:

    *  0: 'none'

    *  1: 'even' (default)

    *  2: 'odd'

  * timeBetweenFrame <number>: The number of milliseconds elapsed without receiving data on the serial port to consider that the RTU frame has finished.


* **Returns:** <NodbusSerialServer>

NodbusPlus expose the function createSerialServer([netConstructor], [options]) to create new instances for NodbusSerialClass

.. code-block:: javascript

      const nodbus = require('nodbus-plus');

      let config1 = {
         port: 502, //mandatory to define port
      }

      let config2 = {
         port: 'COM1', //mandatory to define port
      }

      let nodbusSerialServer = nodbus.createSerialServer('tcp', config1); //default settings, net layer is serial

      
      // modbus serial server 
      let nodbusTcpServer2 = nodbus.createTcpServer('serial', config2); 
       


However new NodbusSerialServer instance can be created with customs :ref:`NetServer <nodbus_net_server>` importing the NodbusTcpServer Class.

.. code-block:: javascript

      const NodbusTcpServer = require('nodbus-plus').NodbusTcpServer;
      const NetServer = require('custom\net\custome_server.js');

      let config = {port: 502};
      let nodbusTcpServer = new NodbusTcpServer(NetServer, config);

     

NodbusTcpServer's Events
=========================

Event: 'closed'
----------------

Emitted when the server is closed.


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


Event: 'response'
----------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 

* **response** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited before to send the response adu's buffer to the socket to be sended.


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


Atribute: nodbusTcpServer.port
--------------------------------------------

* <number>

TCP port on which the server will listen.


NodbusTcpServer's Methods
=========================


Method: nodbusTcpServer.start()
------------------------------------------------

Start the server. The server will emit the event 'listening' whhen is ready for accept connections or data.

Method: nodbusTcpServer.stop()
------------------------------------------------

Stop the server. The server will emit the event 'closed' when all connection are destroyed or the serial port is closed.
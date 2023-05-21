.. _modbus_serial_master:

===========================
Class: ModbusSerialClient
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusClient Class <modbus_master>`. It provides the basic functionalities to handle Modbus Serial Aplication Data Units (ADU).

.. Figure:: /images/serial_adu.png

   *Modbus Serial Aplication Data Unis*

Creating a ModbusSerialClient Instance
======================================

new ModbusSerialClient()
-------------------------

* **Returns:** <ModbusSerialClient>

Constructor for new ModbusSerialClient instance.

.. code-block:: javascript

      const ModbusSerialClient = require('nodbus-plus').ModbusSerialClient;
      let modbusSerialClient = new ModbusSerialClient();


Events
======

Event: 'req_timeout'
--------------------


* **req** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      modbusSerialClient.on('req_timeout', (req) ->{
         console.log('Timeout error from slave: ' + req[0] + '\n');
      })

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusSerialClient.setReqTimer([timeout])` ends without call 
:ref:`Method: modbusSerialClient.clearReqTimer()`

Event: 'transaction'
--------------------

* **req** <Buffer>: Modbus Tcp request adu. 
* **res** <Buffer>: Modbus Tcp request adu.

  

This event is emmited when the :ref:`Method: modbusSerialClient.processResAdu(bufferAdu, [ascii])` is called to manage a server response.


Atributes
=========

Atribute: modbusSerialClient.activeRequest
------------------------------------------

* <Buffer>    

This property store the current active request, if no request is pending then is null.


Atribute: modbusSerialClient.activeRequestTimerId
-------------------------------------------------

* <Number>    

A property to store active request's timer. Each request start a timeout timer when is sended to server. This map store the timer for the active request.

Atribute: modbusSerialClient.turnAroundDelay
---------------------------------------------

* <number>
   
When the serial client send a broadcast request have to await for the turnaround timer to send a new request. This property staore the value in milliseconds for this timer.
Default value is 10 ms.

Methods
=======

See :ref:`ModbusClient Class Methods <modbus_client_methods>` for base class inherited methods.

Method: modbusSerialClient.aduAsciiToRtu(asciiFrame)
----------------------------------------------------

* **asciiFrame** <Buffer>: A serial ascii adu.
* **Returns** <Buffer>: A serial rtu adu.

This method get a ascii adu and convert it in a equivalent rtu adu, including the crc checksum.

Method: modbusSerialClient.aduRtuToAscii(rtuFrame)
----------------------------------------------------

* **rtuFrame** <Buffer>: A serial rtu adu.
* **Returns** <Buffer>: A serial ascii adu.

This method get a rtu adu and convert it in a equivalent ascii adu, including the lrc checksum.


Method: modbusSerialClient.calcCRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial rtu adu request buffer received by server.
* **Returns** <number>: crc value for request.

This method calculate the checksum for he buffer request and return it. It receives a complete rtu frame and ignore the crc field (last two bytes) when calculate the crc value.


Method: modbusSerialClient.calcLRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial ascii adu request buffer received by server.
* **Returns** <number>: lrc value for request.

This method calculate the checksum for he buffer request and return it. It receives a complete ascii frame including start character (:) and ending characters.


Method: modbusSerialClient.makeRequest(address, pdu)
---------------------------------------------------------

* **address** <number>: Modbus address.
* **pdu** <Buffer>: The pdu's buffer.
* **Returns** <Buffer>: return a serial adu request's buffer

This functions create a modbus serial request ready to be send to the client.


Method: modbusSerialClient.setReqTimer([timeout])
---------------------------------------------------

* **timeout** <number>: Number of milliseconds to await for a response or fire timeout event.
* **Returns** <number>: Timer's id to be use on clearTimeout.

This functions store a timerId in the :ref:`request timers pool <Atribute: modbusSerialClient.activeRequestTimerId>`.


Method: modbusSerialClient.clearReqTimer()
--------------------------------------------


This functions call the build in clearTimeout function to avoid emit the'req_timeout' event.


Method: modbusSerialClient.processResAdu(bufferAdu, [ascii])
-------------------------------------------------------------

* **bufferAdu** <Buffer>: A modbus tcp adu response buffer.
* **ascii** <boolean>: A flag indicating if the response is in ascii mode.


This method is used to managed server response. Call the :ref:`Method: modbusSerialClient.clearReqTimer()` to avoid emit 'req_timeout' event and emit the 'transaction' event.
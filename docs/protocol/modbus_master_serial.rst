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


ModbusSerialClient's Events
===========================

Event: 'broadcast-timeout'
---------------------------

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusSerialClient.setTurnAroundDelay([timeout])` is reached. Indicate that client
has no pending broadcast request and is free to send another request.

.. code-block:: javascript

      modbusSerialClient.on('broadcast-timeout', () ->{
         console.log('Broadcast request timeout, client is free to send new request\n');
      })


Event: 'req-timeout'
--------------------

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusSerialClient.setReqTimer([timeout])` ends without call 
:ref:`Method: modbusSerialClient.clearReqTimer()`. Indicate that client has a pending request and no response has been received in the expected time.
The event return the request buffer that cause the timeout, so you can manage it as you want, for example log it or resend it.
After emit this event the client is free to send new request because the activeRequest property is set to null.

* **req** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      modbusSerialClient.on('req-timeout', (req) ->{
         console.log('Timeout error from slave: ' + req[0] + '\n');
      })



Event: 'transaction'
--------------------

This event is emmited when the :ref:`Method: modbusSerialClient.processResAdu(bufferAdu, [ascii])` is called to manage a server response.

* **req** <Buffer>: Modbus serial request adu. 
* **res** <Buffer>: Modbus serial response adu.

.. code-block:: javascript

      modbusSerialClient.on('transaction', (req, res) ->{
         console.log('Transaction completed, request: ' + req + ' response: ' + res + '\n');
      })




ModbusSerialClient's Atributes
===============================

Atribute: modbusSerialClient.activeRequest
------------------------------------------

* <Buffer>    

This property store the current active request, if no request is pending then is null.


Atribute: modbusSerialClient.activeRequestTimerId
-------------------------------------------------

* <Number>    

A property to store active request's timer. Each request start a timeout timer when is sended to server. 
This property store the timer for the active request.

Atribute: modbusSerialClient.turnAroundDelay
---------------------------------------------

* <number>
   
When the serial client send a broadcast request have to await for the turnaround timer to send a new request. 
This property store the timer ID for the turnaround delay.

ModbusSerialClient's Methods
============================

.. _modbus_serial_client_methods:

See :ref:`ModbusClient Class Methods <modbus_client_methods>` for base class inherited methods.

- ``readCoilStatusPdu(startCoil, coilQuantity)`` : Constructs the PDU to read coil status (Function Code 01).
- ``readInputStatusPdu(startInput, inputQuantity)`` : Constructs the PDU to read discrete inputs (Function Code 02).
- ``readHoldingRegistersPdu(startRegister, registerQuantity)`` : Constructs the PDU to read holding registers (Function Code 03).
- ``readInputRegistersPdu(startRegister, registerQuantity)`` : Constructs the PDU to read input registers (Function Code 04).
- ``forceSingleCoilPdu(value, startCoil)`` : Constructs the PDU to write a single coil (Function Code 05).
- ``presetSingleRegisterPdu(value, startRegister)`` : Constructs the PDU to write a single register (Function Code 06).
- ``forceMultipleCoilsPdu(values, startCoil, coilQuantity)`` : Constructs the PDU to write multiple coils (Function Code 15).
- ``presetMultipleRegistersPdu(values, startRegister, registerQuantity)`` : Constructs the PDU to write multiple registers (Function Code 16).
- ``maskHoldingRegisterPdu(values, startRegister)`` : Constructs the PDU for Mask Write Register (Function Code 22).
- ``readWriteMultipleRegistersPdu(values, readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite)`` : Constructs the PDU for Read/Write Multiple Registers (Function Code 23).
- ``boolToBuffer(value)`` : Converts a boolean value to a 2-byte buffer used in coil operations.
- ``getMaskRegisterBuffer(...)`` : Utility to construct a register mask buffer.
- ``boolsToBuffer(...)`` : Utility to convert an array of booleans to a buffer.
- ``getWordFromBuffer(...)`` : Utility to read a word from a buffer.
- ``setWordToBuffer(...)`` : Utility to write a word to a buffer.

Method: modbusSerialClient.aduAsciiToRtu(asciiFrame)
----------------------------------------------------

* **asciiFrame** <Buffer>: A serial ascii adu.
* **Returns** <Buffer>: A serial rtu adu.

This method get a ascii adu and convert it in a equivalent rtu adu, including the crc checksum.

.. code-block:: javascript

    let asciiFrame = Buffer.from(':010300000002FA\r\n');
    let rtuFrame = modbusSerialClient.aduAsciiToRtu(asciiFrame);
    console.log(rtuFrame); //Buffer:[0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]


Method: modbusSerialClient.aduRtuToAscii(rtuFrame)
----------------------------------------------------

* **rtuFrame** <Buffer>: A serial rtu adu.
* **Returns** <Buffer>: A serial ascii adu.

This method get a rtu adu and convert it in a equivalent ascii adu, including the lrc checksum.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = modbusSerialClient.aduRtuToAscii(rtuFrame);
    console.log(asciiFrame); //:010300000002FA\r\n


Method: modbusSerialClient.calcCRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial rtu adu request buffer received by server.
* **Returns** <number>: crc value for request.

This method calculate the checksum for he buffer request and return it. 
It receives a complete rtu frame and ignore the crc field (last two bytes) when calculate the crc value.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let crcValue = modbusSerialClient.calcCRC(rtuFrame);
    console.log(crcValue); //0xC40B


Method: modbusSerialClient.calcLRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial ascii adu request buffer received by server.
* **Returns** <number>: lrc value for request.

This method calculate the checksum for he buffer request and return it. 
It receives a complete ascii frame including start character (:) and ending characters.

.. code-block:: javascript

    let asciiFrame = Buffer.from(':010300000002FA\r\n');
    let lrcValue = modbusSerialClient.calcLRC(asciiFrame);
    console.log(lrcValue); //0xFA

Method: modbusSerialClient.clearReqTimer()
--------------------------------------------

This functions call the build in clearTimeout function to avoid emit the'req-timeout' event.

.. code-block:: javascript

    modbusSerialClient.clearReqTimer();

Method: modbusSerialClient.makeRequest(address, pdu, asciiMode)
---------------------------------------------------------

* **address** <number>: Modbus address value between 0 and 247.
* **pdu** <Buffer>: The pdu's buffer.
* **asciiMode** <boolean> A flag to indicate if the request must be in ascii format. Default value is false, rtu mode.
* **Returns** <Buffer>: return a serial adu request's buffer

This functions create a modbus serial request ready to be send to the client.

.. code-block:: javascript

    let address = 0x01;
    let pdu = modbusSerialClient.readHoldingRegistersPdu(0, 2);
    let requestAdu = modbusSerialClient.makeRequest(address, pdu, false);
    console.log(requestAdu); //Buffer:[0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]

Method: modbusSerialClient.processResAdu(bufferAdu)
-------------------------------------------------------------

* **bufferAdu** <Buffer>: A modbus serial adu response buffer.

This method is used to managed server response and call the :ref:`Method: modbusSerialClient.clearReqTimer()` to avoid emit 'req-timeout' event and emit the 'transaction' event.

.. code-block:: javascript

    let bufferAdu = Buffer.from([0x01, 0x03, 0x04, 0x00, 0x0A, 0x00, 0x14, 0x45, 0xE6]);
    modbusSerialClient.processResAdu(bufferAdu);

Method: modbusSerialClient.setReqTimer([timeout])
---------------------------------------------------

* **timeout** <number>: Number of milliseconds to await for a response or fire timeout event.
* **Returns** <number>: Timer's id to be use on clearTimeout.

This functions store a timerId in the :ref:`request timers pool <Atribute: modbusSerialClient.activeRequestTimerId>`.

.. code-block:: javascript

    let timeout = 5000; //5 seconds
    let timerId = modbusSerialClient.setReqTimer(timeout);
    

Method: modbusSerialClient.setTurnAroundDelay([timeout])
---------------------------------------------------

* **timeout** <number>: Number of milliseconds to await for fire broadcast-timeout event.
* **Returns** <number>: Timer's id to be use on clearTimeout.

This function store a timerId in the :ref:`request timers pool <Atribute: modbusSerialClient.turnAroundDelay>`. 
Is used when a broadcast request is sended.

.. code-block:: javascript

    let timeout = 5000; //5 seconds
    let timerId = modbusSerialClient.setTurnAroundDelay(timeout);

Method: modbusSerialClient.storeRequest(bufferReq, asciiMode)
------------------------------------------------------------

* **bufferRequest** <Buffer>: A buffer with the modbus request.
* **asciiMode** <boolean>: A flag that indicate that request stored is ascii.
* **return** <boolean>: True if success

This method checks if activeRequest property is null and store the request, if not it return false indicating tha are still a request pending.
It also checks if the request is ascii or not and set the internal ascii flag for active request

.. code-block:: javascript

    let bufferRequest = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let isStored = modbusSerialClient.storeRequest(bufferRequest, false);
    console.log(isStored); //true





Method: modbusSerialClient.storeRequest(bufferReq, ascciiMode)
-------------------------------------------------------------------


* **bufferRequest** <Buffer>: A buffer with the modbus request.
* **asciiMode** <boolean>: A flag that indicate that request stored is ascii.
* **return** <boolean>: True if success

This method checks if activeRequest property is null, if not it return false indicating tha are still a request pending.
It also checks if the request is ascii or not and set the internal ascii flag for active request.


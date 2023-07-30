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


ModbusSerialClient's Atributes
===============================

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

ModbusSerialClient's Methods
============================

.. _modbus_serial_client_methods:

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


Method: modbusSerialClient.boolToBuffer(value)
---------------------------------------------------------------------

* **value** <boolean>
* **Return** <Buffer>: Two bytes length Buffer. 

This is a utitlity method. It gets a buffer with a boolean value encoded for use on forceSingleCoilPdu function as value argument. Example:

.. code-block:: javascript

    let value = modbusSerialClient.boolToBuffer(false);
    console.log(value); //Buffer:[0x00, 0x00]
    value = modbusSerialClient.boolToBuffer(true);
    console.log(value); //Buffer:[0xFF, 0x00]


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


Method: modbusSerialClient.getMaskRegisterBuffer(value)
---------------------------------------------------------------------

* **value** <Array>: An 16 numbers length array indicating how to mask the register.
* **Return** <Buffer>: Four bytes length Buffer. 

This is a utility method that return a four-byte length buffer with the AND_MASK and OR_MASK values encoded for use in the maskHoldingRegisterPdu function as the value argument. 

The value argument is a 16-number array, with each number representing the position of one bit inside the register. If the number is 1, then the corresponding bit will be set to 1. 
If the number is 0, then the corresponding bit will be set to 0. If the number is different from 0 or 1, then the corresponding bit will remain unchanged. For example:

.. code-block:: javascript

    let value = [-1, 0, 1, -1, -1, -1, 0, 0, 1, -1, -1, -1, -1, -1, 1, 1];
    maskBuffer = modbusSerialClient.getMaskRegisterBuffer(value);

    //masks
    let andMask =  maskBuffer.readUInt16BE(0);     
    let orMask =   maskBuffer.readUInt16BE(2);

    let testRegister = Buffer.from([0x9A, 0xFB]);
    console.log(testRegister)
    let currentContent = testRegister.readUInt16BE(0);
    let finalResult = (currentContent & andMask) | (orMask & (~andMask)); //Modbus Spec 

    let finalRegister = Buffer.alloc(2);
    finalRegister.writeUInt16BE(finalResult, 0);    
    console.log(finalRegister)

    //Output
    //<Buffer 9a fb>
    //<Buffer db 3d>


Method: modbusSerialClient.boolsToBuffer(value)
---------------------------------------------------------------------

* **value** <Array>: A boolean array.
* **Return** <Buffer>: a buffer with binary representation of boolean array. 

This is a utility method that return a buffer from a boolean array for modbus function code 15. 

The value argument is a array of boolean with values to bu force to coils. For example:

.. code-block:: javascript

    let values = [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1]; //at 0 index stat LSB Byte
    valBuffer = modbusSerialClient.boolsToBuffer(values);

    //result valBuffer [0xC2 0x04]
    // calling force multiples colis
    let pdu = modbusSerialClient.forceMultipleCoilsPdu(valBuffer, 10, values.length)  //calling force multiples coils at coil 10 and 11 coils to force


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


Method: modbusClient.getWordFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.


This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9


Method: modbusClient.setWordToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <Buffer>: two bytes length buffer.
* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to write.
* **offset** <number>: A number with register's offset inside the buffer.

This method write a 16 bits register inside a buffer. The offset is 16 bits aligned.


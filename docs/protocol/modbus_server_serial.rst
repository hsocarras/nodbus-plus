.. _modbus_serial_server:

==========================
Class: ModbusSerialServer
==========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusServer Class <modbus_server>`. It provides the basic functionalities to handle Modbus Serial Aplication Data Units (ADU).

.. Figure:: /images/serial_adu.png

   *Modbus Serial Aplication Data Unis*


Creating a ModbusSerialServer Instance
======================================

new ModbusSerialServer([options])
----------------------------------

* **options** <object>: Configuration object with following properties:

  * **address** <number>: A value between 1 and 247. Default 1.

  * **inputs** <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * **coils** <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * **holdingRegisters** <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * **inputRegisters** <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

  * **transmitionMode** <number>: The mode for serial transmition. Default 0.  

    * *0* Mode Rtu. The server only acept RTU transmition mode.

    * *1* Mode Ascii. The server only acept Ascii transmition mode.

* **Returns:** <ModbusSerialServer>

Constructor for new ModbusSerialServer instance.

.. code-block:: javascript

      const ModbusSerialServer = require('nodbus-plus').ModbusSerialServer;
      let modbusSerialServer = new ModbusSerialServer({inputs: 1024, coils: 512}); //new server with 1024 inputs, 512 coils and 2048 holding and inputs registers


ModbusSerialServer's Events
============================

See :ref:`ModbusServer Class Events <modbus_server>` for all base class inherited events.

- ``error`` : Emitted when an error occurs. Args: **e** <Error>.
- ``exception`` : Emitted when a Modbus exception is generated. Args: **functionCode** <number>, **exceptionCode** <number>, **name** <string>.
- ``write-coils`` : Emitted after coils are written. Args: **startCoil** <number>, **quantityOfCoils** <number>.
- ``write-registers`` : Emitted after holding registers are written. Args: **startRegister** <number>, **quantityOfRegisters** <number>.

ModbusSerialServer's Atributes
==============================

See :ref:`ModbusServer Class Attributes <modbus_server>` for detailed attributes documentation.

- ``_internalFunctionCode`` <Map<number, string>> : Map associating Modbus function codes with handler method names.
- ``supportedFunctionCode`` <iterator> : Iterator for supported function codes from `_internalFunctionCode`.
- ``holdingRegisters`` <Buffer> : Buffer storing holding registers with big-endian 16-bit encoding.
- ``inputRegisters`` <Buffer> : Buffer storing input registers.
- ``inputs`` <Buffer> : Buffer storing discrete inputs (read-only booleans).
- ``coils`` <Buffer> : Buffer storing coils (read-write booleans).


Atribute: modbusSerialServer.address
------------------------------------

* <number>

Accessor property to get and set the modbus's address. Allowed values are any number between 1-247.


Atribute: modbusSerialServer.busCharacterOverrunCount
-------------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.busCommunicationErrorCount
-------------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.busMessageCount
--------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.



Atribute: modbusSerialServer.exceptionCoils
--------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' 8 exception coils. 

Atribute: modbusSerialServer.slaveBusyCount
--------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.slaveExceptionErrorCount
-----------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.slaveMessageCount
--------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.slaveNAKCount
--------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.slaveNoResponseCount
--------------------------------------------------

* <number>

A diagnostic counter. See Modbus spec for more details.


Atribute: modbusSerialServer.transmitionMode
---------------------------------------------

* <boolean>

Property to define the modbus serial transmition mode. Allowed values are 0, 1 rtu and ascii mode. Default 0, 'rtu'.


ModbusSerialServer's Methods
============================

.. _modbus_serial_server_methods:

See :ref:`ModbusServer Class Methods <modbus_server_methods>` for all base class inherited methods.

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


Method: modbusSerialServer.aduAsciiToRtu(asciiFrame)
----------------------------------------------------

* **asciiFrame** <Buffer>: A serial ascii adu.
* **Returns** <Buffer>: A serial rtu adu.

This method get a ascii adu and convert it in a equivalent rtu adu, including the crc checksum.

.. code-block:: javascript

    let asciiFrame = Buffer.from(':010300000002FA\r\n');
    let rtuFrame = modbusSerialServer.aduAsciiToRtu(asciiFrame);
    console.log(rtuFrame); //Buffer:[0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]


Method: modbusSerialServer.aduRtuToAscii(rtuFrame)
----------------------------------------------------

* **rtuFrame** <Buffer>: A serial rtu adu.
* **Returns** <Buffer>: A serial ascii adu.

This method get a rtu adu and convert it in a equivalent ascii adu, including the lrc checksum.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = modbusSerialServer.aduRtuToAscii(rtuFrame);
    console.log(asciiFrame); //:010300000002FA\r\n


Method: modbusSerialServer.calcCRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial rtu adu request buffer received by server.
* **Returns** <number>: crc value for request.

This method calculate the checksum for he buffer request and return it. 
It receives a complete rtu frame and ignore the crc field (last two bytes) when calculate the crc value.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let crcValue = modbusSerialServer.calcCRC(rtuFrame);
    console.log(crcValue); //0xC40B


Method: modbusSerialServer.calcLRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial ascii adu request buffer received by server.
* **Returns** <number>: lrc value for request.

This method calculate the checksum for he buffer request and return it. 
It receives a complete ascii frame including start character (:) and ending characters.

.. code-block:: javascript

    let asciiFrame = Buffer.from(':010300000002FA\r\n');
    let lrcValue = modbusSerialServer.calcLRC(asciiFrame);
    console.log(lrcValue); //0xFA

Method: modbusSerialServer.executeBroadcastReq(reqAduBuffer)
---------------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a serial adu.

This method is similar to getResponseAdu method, but is only invoqued when a broadcast request (address 0) is processed. 
It returns no response.

.. code-block:: javascript

    let broadcastReq = Buffer.from(':000300000002FA\r\n');
    modbusSerialServer.executeBroadcastReq(broadcastReq); //execute the request but return no response


Method: modbusSerialServer.getAddress(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <number>: Modbus Rtu address field.

This method return the address field on a modbus rtu request.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let address = modbusSerialServer.getAddress(rtuFrame);
    let address2 = modbusSerialServer.getAddress(asciiFrame);
    console.log(address); //1
    console.log(address2); //4

Method: modbusSerialServer.getPdu(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <Buffer>: Modbus Rtu pdu.

This method return the pdu on a modbus serial request.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let pdu = modbusSerialServer.getPdu(rtuFrame);
    let pdu2 = modbusSerialServer.getPdu(asciiFrame);
    console.log(pdu); //Buffer:[0x03, 0x00, 0x00, 0x00, 0x02]
    console.log(pdu2); //Buffer:[0x03, 0x00, 0x00, 0x00, 0x02]

Method: modbusSerialServer.getChecksum(reqAduBuffer)
------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <number>: Modbus message checsum.

This method return the checksum for the modbus's frame.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let checksum = modbusSerialServer.getChecksum(rtuFrame);
    let checksum2 = modbusSerialServer.getChecksum(asciiFrame);
    console.log(checksum); //0xC40B
    console.log(checksum2); //0xFA


Method: modbusSerialServer.getResponseAdu(reqAduBuffer)
-------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a serial adu.
* **Returns** <Buffer>: Modbus response adu.

This method make the response adu acording to transmition mode selected and return it.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let responseAdu = modbusSerialServer.getResponseAdu(rtuFrame);
    let responseAdu2 = modbusSerialServer.getResponseAdu(asciiFrame);
    console.log(responseAdu); //Buffer:[0x01, 0x03, 0x04, 0x11, 0x22, 0x33, 0x44, 0xC5, 0xCD]
    console.log(responseAdu2); //:04030411223344B9\r\n




Method: modbusSerialServer.readExceptionCoilsService(pduReqData)
-----------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/7.png

   *Modbus Read Exception Coils Request and Response*

This method execute the read exception coils indication on the server. 
This method is not intended to be called directly, but instead through the method processReqPdu when function code 07 is received.


Method: modbusSerialServer.resetCounters()
------------------------------------------------

This method set to 0 all diagnostic counter in the modbus serial server.

      
Method: modbusSerialServer.validateAddress(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial adu request buffer received by server.
* **Returns** <bool>: true if field field is 0 or match the server's address, otherwise false.

This method validate the address field on modbus request adu frame, if it match the server's address or if is the broadcast address it returns true.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let broadcastFrame = Buffer.from(':000300000002FA\r\n');
    modbusSerialServer.address = 4;
    console.log(modbusSerialServer.validateAddress(rtuFrame)); //false
    console.log(modbusSerialServer.validateAddress(asciiFrame)); //true
    console.log(modbusSerialServer.validateAddress(broadcastFrame)); //true

Method: modbusSerialServer.validateCheckSum(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial adu request buffer received by server.
* **Returns** <bool>: true if checksum field is correct, otherwise false.

This method validate the checksum field on modbus request adu frame, if it match the calculated checksum for the request it returns true.

.. code-block:: javascript

    let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
    let asciiFrame = Buffer.from(':040300000002FA\r\n');
    let wrongRtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00]);
    let wrongAsciiFrame = Buffer.from(':04030000000200\r\n');
    console.log(modbusSerialServer.validateCheckSum(rtuFrame)); //true
    console.log(modbusSerialServer.validateCheckSum(asciiFrame)); //true
    console.log(modbusSerialServer.validateCheckSum(wrongRtuFrame)); //false
    console.log(modbusSerialServer.validateCheckSum(wrongAsciiFrame)); //false


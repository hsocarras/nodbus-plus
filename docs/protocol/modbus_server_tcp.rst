.. _modbus_tcp_server:

======================
Class: ModbusTcpServer
======================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusServer Class <modbus_server>`. It provides the basic functionalities to handle Modbus TCP Aplication Data Units (ADU).

.. Figure:: /images/tcp_adu.png

   *Modbus Tcp Aplication Data Unis*


Creating a ModbusTCPServer Instance
===================================


new ModbusTcpServer([options])
-------------------------------

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

* **Returns:** <ModbusTcpServer>

Constructor for new ModbusTcpServer instance.

.. code-block:: javascript

      const ModbusTcpServer = require('nodbus-plus').ModbusTcpServer;
      let modbusTcpServer = new ModbusTcpServer({inputs: 1024, coils: 512}); //new server with 1024 inputs, 512 coils and 2048 holding and inputs registers


ModbusTcpServer's Events
=========================

The following events are inherited from the :ref:`ModbusServer <modbus_server>` base class:

Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when an error occurs during server operation.

Event: 'exception'
------------------

* **functionCode** <number>: The request's function code.
* **exceptionCode** <number>: The exception code.
* **name** <string>: The name of the exception.

Emitted when a Modbus exception is generated in response to a client request.

Event: 'write-coils'
--------------------

* **startCoil** <number>: The starting coil address.
* **quantityOfCoils** <number>: The amount of coils modified.

Emitted after a coil's value is changed due to a client's write coil request.

Event: 'write-registers'
------------------------

* **startRegister** <number>: The starting register address.
* **quantityOfRegisters** <number>: The amount of registers modified.

Emitted after a holding register's value is changed due to a client's write register request.


ModbusTcpServer's Atributes
===========================

See :ref:`ModbusServer Class Attributes <modbus_server>` for detailed attributes documentation.

- ``_internalFunctionCode`` <Map<number, string>> : Map associating Modbus function codes with handler method names.
- ``supportedFunctionCode`` <iterator> : Iterator for supported function codes from `_internalFunctionCode`.
- ``holdingRegisters`` <Buffer> : Buffer storing holding registers with big-endian 16-bit encoding.
- ``inputRegisters`` <Buffer> : Buffer storing input registers.
- ``inputs`` <Buffer> : Buffer storing discrete inputs (read-only booleans).
- ``coils`` <Buffer> : Buffer storing coils (read-write booleans).

ModbusTcpServer's Methods
=========================

.. _modbus_tcp_server_methods:

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

Method: modbusTcpServer.getMbapHeader(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the header.

This method return the header part of a modbus tcp adu.

.. code-block:: javascript

      let mbapHeader = modbusTcpServer.getMbapHeader(reqAduBuffer);
      console.log(mbapHeader.length)  //returns 7
      console.log(mbapHeader[6])      //returns the legacy address byte

Method: modbusTcpServer.getPdu(reqAduBuffer)
----------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the pdu.

This method return the pdu part of a modbus tcp adu.

.. code-block:: javascript

      let pdu = modbusTcpServer.getPdu(reqAduBuffer);
      console.log(pdu.length)  //returns the length of the pdu
      console.log(pdu[0])     //returns the function code byte


Method: modbusTcpServer.getResponseAdu(reqAduBuffer)
----------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: Response Adu in a buffer object.

* **Throws**:

      - **TypeError**: If `reqAduBuffer` is not a `Buffer` object.
      - **RangeError**: If the ADU length is invalid (must be between 8 and 260 bytes), or if the MBAP header is malformed (protocol ID must be 0 or the MBAP length field does not match the PDU size).
      


This method is the main TCP server's method. It receives a Modbus TCP request as an argument, processes it, and returns a buffer with the response ready to be send.

.. code-block:: javascript

        try {
              let responseAduBuffer = modbusTcpServer.getResponseAdu(reqAduBuffer);
              console.log(responseAduBuffer); // returns a buffer with the response adu
        }
        catch (err) {
              if (err instanceof TypeError) {
                    console.error('TypeError:', err.message);
              }
              else if (err instanceof RangeError) {
                    console.error('RangeError:', err.message);
              }
              else {
                    // Errors thrown by processReqPdu or other runtime errors
                    console.error('Error processing request PDU:', err.message);
              }
        }


Method: modbusTcpServer.validateMbapHeader(mbapBuffer)
------------------------------------------------------

* **mbapBuffer** <Buffer>: adu's header buffer.
* **Return** <boolean>: True if is a valid header otherwise false.


This method return true if header's buffer has 7 bytes length and the protocol's field is 0.

.. code-block:: javascript

      let isValidHeader = modbusTcpServer.validateMbapHeader(mbapBuffer);
      console.log(isValidHeader)  //returns true if the header is valid, otherwise false


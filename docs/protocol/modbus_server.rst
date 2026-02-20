.. _modbus_server:

===========================
Class: ModbusServer
===========================

**Nodbus-Plus v1.0.1 Documentation**

.. contents:: Table of Contents
   :depth: 3

       

The `ModbusServer` class is an `EventEmitter` that provides basic functionalities to handle Modbus Protocol Data Units (PDU).

.. Figure:: /images/modbus_pdu.png

   *Modbus Protocol Data Unis*


Creating a ModbusServer Instance
================================

new ModbusServer([options])
---------------------------

* **options** <object>: Configuration object with the following properties:

  * inputs <number>: The quantity of discrete inputs the server will have. An integer between 0 and 65535. If set to 0, the inputs will share the same Buffer as the input registers. **Default: 2048**.

  * coils <number>: The quantity of coils the server will have. An integer between 0 and 65535. If set to 0, the coils will share the same Buffer as the holding registers. **Default: 2048**.

  * holdingRegisters <number>: The quantity of holding registers the server will have. An integer between 1 and 65535. **Default: 2048**.
  
  * inputRegisters <number>: The quantity of input registers the server will have. An integer between 1 and 65535. **Default: 2048**.


* **Returns:** <ModbusServer>

Constructor for a new `ModbusServer` instance. The package supports both CommonJS and ECMAScript modules.

**Using CommonJS (`require`)**

.. code-block:: javascript

      const { ModbusServer } = require('nodbus-plus');
      
      // New server with 1024 inputs and 512 coils.
      const modbusServer = new ModbusServer({inputs: 1024, coils: 512});

**Using ECMAScript Modules (`import`)**

.. code-block:: javascript

      import { ModbusServer } from 'nodbus-plus';
      
      // New server with 1024 inputs and 512 coils.
      const modbusServer = new ModbusServer({inputs: 1024, coils: 512});


ModbusServer's Events
=====================


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when an error occurs.

Event: 'exception'
---------------------

* **functionCode** <number>: The request's function code.
* **exceptionCode** <number>: The exception code.
* **name** <string>: The name of the exception.

Emitted when a Modbus exception occurs. The following table lists the standard exception codes:

.. list-table::
   :widths: 10 35 55
   :header-rows: 1

   * - Code
     - Name
     - Meaning
   * - 01
     - ILLEGAL FUNCTION
     - The function code received in the query is not an allowable action for the server.
   * - 02
     - ILLEGAL DATA ADDRESS
     - The data address received in the query is not an allowable address for the server.
   * - 03
     - ILLEGAL DATA VALUE
     - A value contained in the query data field is not an allowable value for the server.
   * - 04
     - SLAVE DEVICE FAILURE
     - An unrecoverable error occurred while the server was attempting to perform the requested action.
   * - 05
     - ACKNOWLEDGE
     - The server has accepted the request and is processing it, but a long duration of time will be required to do so. This response is returned to prevent a timeout error from occurring in the client (or master).
   * - 06
     - SLAVE DEVICE BUSY
     - The server is engaged in processing a long-duration program command. The client should retransmit the message later.
   * - 08
     - MEMORY PARITY ERROR
     - Specialized use for function codes 20 and 21 to indicate that the extended file area failed a consistency check.
   * - 0A
     - GATEWAY PATH UNAVAILABLE
     - Used with gateways to indicate that the gateway was unable to allocate a communication path. Usually means the gateway is misconfigured or overloaded.
   * - 0B
     - GATEWAY TARGET DEVICE FAILED TO RESPOND
     - Used with gateways to indicate that no response was obtained from the target device.

.. code-block:: javascript

      modbusServer.on('exception', (functionCode, exceptionCode, name) => {
            console.error(`Exception occurred. Function code: ${functionCode}, Exception code: ${exceptionCode} (${name})`);
      });

Event: 'write-coils'
---------------------

* **startCoil** <number>: The starting coil address.

* **quantityOfCoils** <number>: The amount of coils modified.

Emitted after a coil's value is changed due to a client's write coil request.

.. code-block:: javascript

      modbusServer.on('write-coils', (startCoil, quantityOfCoils) => {
            console.log(`Coils updated. Starting coil: ${startCoil}, Quantity of coils: ${quantityOfCoils}`);
      });

Event: 'write-registers'
------------------------

* **startRegister** <number>: The starting register address.

* **quantityOfRegisters** <number>: The amount of registers modified.

Emitted after a holding register's value is changed due to a client's write register request. 

.. code-block:: javascript

      modbusServer.on('write-registers', (startRegister, quantityOfRegisters) => {
            console.log(`Registers updated. Starting register: ${startRegister}, Quantity of registers: ${quantityOfRegisters}`);
      });

ModbusServer's Atributes
========================

Atribute: modbusServer._internalFunctionCode
--------------------------------------------

* <Map<number, string>>

Map that associates Modbus function codes (numeric keys) with the name of the handler method (string) on the server instance. Each map entry should follow the shape: `functionCode -> handlerMethodName`.

When `processReqPdu` receives a request, it looks up the request's function code in this map and calls the corresponding handler method on the `ModbusServer` instance. The handler is expected to have the signature `handler(pduReqData)` where `pduReqData` is a `Buffer` containing the request PDU data; 
the handler must return a `Buffer` containing the response PDU (or produce an exception via the server's exception flow).

The map is pre-populated with handlers for the standard Modbus function codes implemented by `ModbusServer`. Child classes can extend, replace, or remove entries to implement custom or overridden behavior for specific function codes.

Example — add a custom handler for non-standard function code 68:

.. code-block:: javascript

      const { ModbusServer } = require('nodbus-plus');

      class ModbusServerExtended extends ModbusServer {
            constructor(cfg) {
                  super(cfg);
                  // Register handler name for function code 68
                  this._internalFunctionCode.set(68, 'customService68');
            }

            // Handler receives the request PDU data Buffer and returns a response Buffer
            customService68(pduReqData) {
                  const resp = Buffer.alloc(2);
                  resp[0] = 68; // function code in response
                  resp[1] = pduReqData[0] || 0; // example: echo first request byte
                  return resp;
            }
      }
      

Atribute: modbusServer.supportedFunctionCode
--------------------------------------------

* <iterator>

This is a getter that returns an iterator for the keys of `modbusServer._internalFunctionCode`. 
This is equivalent to calling `modbusServer._internalFunctionCode.keys()`.

.. code-block:: javascript

      // Example of iterating through all supported function codes.      
      for (const functionCode of modbusServer.supportedFunctionCode) {
         console.log(`Server supports function code: ${functionCode}`);
      }
      

Atribute: modbusServer.holdingRegisters
---------------------------------------

* <Buffer>

This property is a `Buffer` that stores the server's holding registers. Nodbus-Plus uses big-endian encoding for 16-bit registers.

Each register occupies two bytes. Register `N` corresponds to bytes `N*2` and `N*2 + 1` in the buffer. 
For example, register 0 occupies bytes 0-1, and register 1 occupies bytes 2-3.

While you can use native `Buffer` methods to interact with this data, it is recommended to use the provided helper methods:
:ref:`getWordFromBuffer <Method: modbusServer.getWordFromBuffer(targetBuffer, [offset])>` and :ref:`setWordToBuffer <Method: modbusServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusServer.inputRegisters
-------------------------------------

* <Buffer>

This property is a `Buffer` that stores the server's input registers. The structure and byte order are identical to `holdingRegisters`.


Atribute: modbusServer.inputs
-----------------------------

* <Buffer>

This property is a `Buffer` that stores the server's discrete inputs (read-only booleans). Each bit in the buffer represents one input.

The mapping is sequential: byte 0 holds inputs 0-7, byte 1 holds inputs 8-15, and so on.

To read or write values, it is recommended to use the helper methods:
:ref:`getBoolFromBuffer <Method: modbusServer.getBoolFromBuffer(targetBuffer, [offset])>` and :ref:`setBoolToBuffer <Method: modbusServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusServer.coils
-----------------------------

* <Buffer>

This property is a `Buffer` that stores the server's coils (read-write booleans). The structure and bit mapping are identical to `inputs`.


ModbusServer's Methods
=======================

.. _modbus_server_methods:

Method: modbusServer.processReqPdu(reqPduBuffer)
------------------------------------------------

* **reqPduBuffer** <Buffer>: A buffer containind the data part from request pdu.
* **Returns** <Buffer>: Complete response pdu's buffer.

This is the server's main function. Receive a request pdu buffer, and return a response pdu that can be a normal response or exception response.

.. code-block:: javascript

      const responsePdu = modbusServer.processReqPdu(requestPduBuffer);
      

Method: modbusServer.makeExceptionResPdu(mbFunctionCode,  exceptionCode)
------------------------------------------------------------------------

* **mbFunctionCode** <number>: The function code that cause the exception.
* **exceptionCode** <number>: See available exception code on :ref:`Event: 'exception'`
* **Returns** <Buffer>: Exception response pdu

This functions create a exception response pdu by add 0x80 to function code and appending the exception code.

.. code-block:: javascript

      const exceptionPdu = modbusServer.makeExceptionResPdu(3, 2); //function code 3, exception code 2
      //exceptionPdu will be Buffer:[0x83, 0x02]

Method: modbusServer.readCoilsService(pduReqData)
-------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/01-readcoils.png

   *Modbus Read Coils Request and Response*

This method execute the read coil status indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 01 is received.


Method: modbusServer.readDiscreteInputsService(pduReqData)
----------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/02-readinputs.png

   *Modbus Read Inputs Request and Response*

This method execute the read digital input status indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 02 is received.


Method: modbusServer.readHoldingRegistersService(pduReqData)
------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/03-readholding.png

   *Modbus Read Holding Registers Request and Response*

This method execute the read holding registers indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 03 is received.


Method: modbusServer.readInputRegistersService(pduReqData)
------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/04-readinputsreg.png

   *Modbus Read Inputs Registers Request and Response*

This method execute the read input registers indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 04 is received.


Method: modbusServer.writeSingleCoilService(pduReqData)
---------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/05-writecoil.png

   *Modbus Write Single Coil Request and Response*

This method execute the write single coil indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 05 is received.


Method: modbusServer.writeSingleRegisterService(pduReqData)
------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/06-writeregister.png

   *Modbus Write Single holding Register Request and Response*

This method execute the write single register indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 06 is received.


Method: modbusServer.writeMultipleCoilsService(pduReqData)
-----------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/15-writecoil.png

   *Modbus Write Multiple Coils Request and Response*

This method execute the write multiple coils indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 15 is received.


Method: modbusServer.writeMultipleRegistersService(pduReqData)
--------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/16.png

   *Modbus Write Multiple Registers Request and Response*

This method execute the write multiple registers indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 16 is received.


Method: modbusServer.maskWriteRegisterService(pduReqData)
--------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/22-mask.png

   *Modbus Mask Register Request and Response*

This method execute the mask register indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 22 is received.


Method: modbusServer.readWriteMultipleRegistersService(pduReqData)
------------------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/23.png

   *Modbus Read and Write Multiple Registers Request and Response*

This method execute the read and write multiple registers indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 23 is received.


Method: modbusServer.getBoolFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to read.
* **offset** <number>: A number with value's offset inside the buffer.
* **Return** <boolean>: value.


This method read a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

      modbusServer.inputs[0] = 0x44  //first byte 0100 0100
      modbusServer.coils[1] =  0x55 //second byte 0101 0101

      modbusServer.getBoolFromBuffer(modbusServer.inputs, 6) //return 1
      modbusServer.getBoolFromBuffer(modbusServer.coils, 5) //return 0


Method: modbusServer.setBoolToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <boolean>: Value to write.
* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to write.
* **offset** <number>: A number with value's offset inside the buffer.


This method write a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

      modbusServer.setBoolToBuffer(1, modbusServer.inputs, 6) //set 7th bit of first byte to 1
      modbusServer.setBoolToBuffer(0, modbusServer.coils, 5) //set 5th bit of second byte to 0
    
Method: modbusServer.getWordFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.


This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9

.. code-block:: javascript

      modbusServer.holdingRegisters[0] = 0x11;
      modbusServer.holdingRegisters[1] = 0x22;
      modbusServer.holdingRegisters[2] = 0x33;
      modbusServer.holdingRegisters[3] = 0x44;
      
      modbusServer.holdingRegisters.readUInt16BE(0)                           //returns 0x1122
      modbusServer.holdingRegisters.readUInt16BE(1)                           //returns 0x2233
      modbusServer.getWordFromBuffer(modbusServer.holdingRegisters, 0)        //returns Buffer:[0x11, 0x22]
      modbusServer.getWordFromBuffer(modbusServer.holdingRegisters, 1)        //returns Buffer:[0x33, 0x44]

Method: modbusServer.setWordToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <Buffer>: two bytes length buffer.
* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to write.
* **offset** <number>: A number with register's offset inside the buffer.



This method write a 16 bits register inside a buffer. The offset is 16 bits aligned. Example:

.. code-block:: javascript

      let realValue = Buffer.alloc(4);
      realValue.writeFloatBE(3.14);
      let register1 = realValue.subarray(0, 2);
      let register2 = realValue.subarray(2, 4);
      modbusServer.setWordToBuffer(register1, modbusServer.holdingRegisters, 1) //set first two bytes of holding registers to register1
      modbusServer.setWordToBuffer(register2, modbusServer.holdingRegisters, 2) //set second two bytes of holding registers to register2  
      console.log(modbusServer.holdingRegisters.readFloatBE(2)) //returns 3.14
      
      

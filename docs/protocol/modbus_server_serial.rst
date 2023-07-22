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


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.

Event: 'mb_exception'
---------------------

* **functionCode** <number>: request function code.
* **exceptionCode** <number>: the code of exception
* **name** <string>: Name of exception.

.. raw:: html

  <table>
      <tr>
         <th>Code</th>
         <th>Name</th>
         <th>Meaning</th>
      </tr>
   <tr>
         <td>01</td>
         <td>ILLEGAL FUNCTION</td>
         <td>The function code received in the query is not an allowable action for the server.</td>
   </tr>
   <tr>
         <td>02</td>
         <td>ILLEGAL DATA ADDRESS</td>
         <td>The data address received in the query is not an allowable address for the server.</td>
   </tr>
   <tr>
         <td>03</td>
         <td>ILLEGAL DATA VALUE</td>
         <td>A value contained in the query data field is not an allowable value for server</td>
   </tr>
   <tr>
         <td>04</td>
         <td>SLAVE DEVICE FAILURE</td>
         <td>An unrecoverable error occurred while the server was attempting to perform the requested action.</td>
   </tr>
    <tr>
         <td>05</td>
         <td>ACKNOWLEDGE</td>
         <td>The server (or slave) has accepted the request and is processing it, but a long duration of time will be required to do so.
               This response is returned to prevent a timeout error from occurringin the client (or master).</td>
   </tr>
   <tr>
         <td>06</td>
         <td>SLAVE DEVICE BUSY</td>
         <td>Specialized use in conjunction with programming commands. The server (or slave) is engaged in processing a long–duration program command.</td>
   </tr>
   <tr>
         <td>08</td>
         <td>MEMORY PARITY ERROR</td>
         <td>Specialized use in conjunction with function codes 20 and 21 and reference type 6, to indicate that the extended file area failed to pass a consistency check.</td>
   </tr>
   <tr>
         <td>0A</td>
         <td>GATEWAY PATH UNAVAILABLE</td>
         <td>Specialized use in conjunction with gateways, indicates that the gateway was unable to allocate an internal communication path from the input port to the output port for processing the request.
            Usually means that the gateway is misconfigured or overloaded.</td>
   </tr>
   <tr>
         <td>0B</td>
         <td>GATEWAY TARGET DEVICE FAILED TO RESPOND</td>
         <td>Specialized use in conjunction with gateways, indicates that no response was obtained from the target device. Usually means that the device is not present on the network.</td>
   </tr>
   </table> 

Emitted when a Modbus exception occurs.

Event: 'write-coils'
--------------

* **startCoil** <number> Indicate in wich coil start the new value. 

* **cuantityOfCoils** <number>: amound of coils modificated  

Emitted after change a coil value due to a clienst write coil request.


Event: 'write-registers'
--------------

* **startRegister** <number> Indicate in wich register start the new value. 

* **cuantityOfRegister** <number>: amound of register modificated.  

Emitted after change a holding register value due to a clienst write register request.  



ModbusSerialServer's Atributes
==============================

Atribute: modbusSerialServer._internalFunctionCode
--------------------------------------------

* <Map>

This property stores the Modbus functions codes supported by the server. 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      class ModbusSerialServerExtended extends ModbusSerialServer{
            constructor(mbServerCfg){
                  super(mbServerCfg)
                  //adding the new function code and the name of handler
                  this._internalFunctionCode.set(68, 'customService68');
            }
            //New method to handle function code 68. receive a buffer with pdu data as argument.
            customService68(pduReqData){
                  let resp = Buffer.alloc(2);
                  resp[0] = 68;
                  resp[1] = pduReqData[0];
                  return resp
            }
      }
      


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


Atribute: modbusSerialServer.coils
-----------------------------

* <Buffer>

This property is a Buffer that store the servers' digital coils. The byte 0 store the coils 0 to 7, byte 1 store coils 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusSerialServer.getBoolFromBuffer(targetBuffer, [offset])>`
 and :ref:`setBooltoBuffer method <Method: modbusSerialServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusSerialServer.exceptionCoils
--------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' 8 exception coils.
To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusSerialServer.getBoolFromBuffer(targetBuffer, [offset])>` 
and :ref:`setBooltoBuffer method <Method: modbusSerialServer.setBoolToBuffer(value, targetBuffer, [offset])>`.

Atribute: modbusSerialServer.holdingRegisters
---------------------------------------

* <Buffer>

This property is a Buffer that store the servers' holding registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusSerialServer.getWordFromBuffer(targetBuffer, [offset])>` and the :ref:`setWordtoBuffer method <Method: modbusSerialServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusSerialServer.inputRegisters
-------------------------------------

* <Buffer>

This property is a Buffer that store the servers' input registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusSerialServer.getWordFromBuffer(targetBuffer, [offset])>` 
and the :ref:`setWordtoBuffer method <Method: modbusSerialServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusSerialServer.inputs
------------------------------------

* <Buffer>

This property is a Buffer that store the servers' digital inputs. The byte 0 store the inputs 0 to 7, byte 1 store inputs 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusSerialServer.getBoolFromBuffer(targetBuffer, [offset])>`
and :ref:`setBooltoBuffer method <Method: modbusSerialServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


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

Atribute: modbusSerialServer.supportedFunctionCode
---------------------------------------------------

* <iterator>

This is a getter that return an iterator object trhough modbusSerialServer._internalFunctionCode keys. It's the same that call modbusSerialServer._internalFunctionCode.keys().

.. code-block:: javascript

      //Example of getting all suported function code.       
      for(const functionCode of modbusSerialServer.supportedFunctionCode){
         console.log(functionCode)
      }


Atribute: modbusSerialServer.transmitionMode
---------------------------------------------

* <boolean>

Property to define the modbus serial transmition mode. Allowed values are 0, 1 rtu and ascii mode. Default 0, 'rtu'.


ModbusSerialServer's Methods
============================

.. _modbus_serial_server_methods:

See :ref:`ModbusServer Class Methods <modbus_server_methods>` for all base class inherited methods.


Method: modbusSerialServer.aduAsciiToRtu(asciiFrame)
----------------------------------------------------

* **asciiFrame** <Buffer>: A serial ascii adu.
* **Returns** <Buffer>: A serial rtu adu.

This method get a ascii adu and convert it in a equivalent rtu adu, including the crc checksum.

Method: modbusSerialServer.aduRtuToAscii(rtuFrame)
----------------------------------------------------

* **rtuFrame** <Buffer>: A serial rtu adu.
* **Returns** <Buffer>: A serial ascii adu.

This method get a rtu adu and convert it in a equivalent ascii adu, including the lrc checksum.


Method: modbusSerialServer.calcCRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial rtu adu request buffer received by server.
* **Returns** <number>: crc value for request.

This method calculate the checksum for he buffer request and return it. It receives a complete rtu frame and ignore the crc field (last two bytes) when calculate the crc value.


Method: modbusSerialServer.calcLRC(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial ascii adu request buffer received by server.
* **Returns** <number>: lrc value for request.

This method calculate the checksum for he buffer request and return it. It receives a complete ascii frame including start character (:) and ending characters.


Method: modbusSerialServer.executeBroadcastReq(reqAduBuffer)
---------------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a serial adu.

This method is similar to getResponseAdu method, but is only invoqued when a broadcast request (address 0) is processed. It returns no response.


Method: modbusSerialServer.getAddress(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <number>: Modbus Rtu address field.

This method return the address field on a modbus rtu request.


Method: modbusSerialServer.getBoolFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to read.
* **offset** <number>: A number with value's offset inside the buffer.
* **Return** <boolean>: value.


This method read a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

      modbusSerialServer.inputs[0] = 0x44  //first byte 0100 0100
      modbusSerialServer.coils[1] =  0x55 //second byte 0101 0101

      modbusSerialServer.getBoolFromBuffer(modbusSerialServer.inputs, 6) //return 1
      modbusSerialServer.getBoolFromBuffer(modbusSerialServer.coils, 5) //return 0


Method: modbusSerialServer.getPdu(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <Buffer>: Modbus Rtu pdu.

This method return the pdu on a modbus rtu request.

Method: modbusSerialServer.getChecksum(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu or ascii serial adu.
* **Returns** <number>: Modbus message checsum.

This method return the checksum for the modbus's frame.


Method: modbusSerialServer.getResponseAdu(reqAduBuffer)
-------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a serial adu.
* **Returns** <Buffer>: Modbus response adu.

This method make the response adu acording to transmition mode selected and return it.


Method: modbusSerialServer.getWordFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.


This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9

.. code-block:: javascript

      modbusSerialServer.holdingRegisters[0] = 0x11;
      modbusSerialServer.holdingRegisters[1] = 0x22;
      modbusSerialServer.holdingRegisters[2] = 0x33;
      modbusSerialServer.holdingRegisters[3] = 0x44;
      
      modbusSerialServer.holdingRegisters.readUInt16BE(0)                           //returns 0x1122
      modbusSerialServer.holdingRegisters.readUInt16BE(1)                           //returns 0x2233
      modbusSerialServer.getWordFromBuffer(modbusSerialServer.holdingRegisters, 0)        //returns Buffer:[0x11, 0x22]
      modbusSerialServer.getWordFromBuffer(modbusSerialServer.holdingRegisters, 1)        //returns Buffer:[0x33, 0x44]


Method: modbusSerialServer.readExceptionCoilsService(pduReqData)
-----------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/7.png

   *Modbus Read Exception Coils Request and Response*

This method execute the read exception coils indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 07 is received.


Method: modbusSerialServer.resetCounters()
------------------------------------------------

This method set to 0 all diagnostic counter in the modbus serial server.


Method: modbusSerialServer.setBoolToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <boolean>: Value to write.
* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to write.
* **offset** <number>: A number with value's offset inside the buffer.


This method write a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

     modbusSerialServer.getBoolFromBuffer(true, modbusSerialServer.coils, 5) 
     console.log(modbusSerialServer.coils[1])  //now second byte is 0x75 (0111 0101)


Method: modbusSerialServer.setWordToBuffer(value, targetBuffer, [offset])
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

      //writing pi value in bytes 2, 3, 4, 5
      modbusSerialServer.setWordToBuffer(register1, modbusSerialServer.holdingRegisters, 1);
      modbusSerialServer.setWordToBuffer(register2, modbusSerialServer.holdingRegisters, 2);

      //instead this write pi value in bytes 1, 2, 3, 4
      modbusSerialServer.holdingRegisters.writefloatBE(3.14, 1) //alignment problem

      
Method: modbusSerialServer.validateAddress(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial adu request buffer received by server.
* **Returns** <bool>: true if field field is 0 or match the server's address, otherwise false.

This method validate the address field of the modbus frame, if it match the server's address or if is the broadcast address it returns true.

Method: modbusSerialServer.validateCheckSum(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial adu request buffer received by server.
* **Returns** <bool>: true if checksum field is correct, otherwise false.

This method is similar calculate th checksum for he buffer request acording to transmitionMode property, then compare the calculated checksum with request's checksum field. If match
return true, otherwise return false.


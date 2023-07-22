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


ModbusTcpServer's Atributes
===========================

Atribute: modbusTcpServer._internalFunctionCode
--------------------------------------------

* <Map>

This property stores the Modbus functions codes supported by the server. 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      class ModbusTcpServerExtended extends ModbusTcpServer{
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
      

Atribute: modbusTcpServer.supportedFunctionCode
------------------------------------------------

* <iterator>

This is a getter that return an iterator object trhough modbusTcpServer._internalFunctionCode keys. It's the same that call modbusTcpServer._internalFunctionCode.keys().

.. code-block:: javascript

      //Example of getting all suported function code.       
      for(const functionCode of modbusTcpServer.supportedFunctionCode){
         console.log(functionCode)
      }

Atribute: modbusTcpServer.holdingRegisters
-------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' holding registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusTcpServer.getWordFromBuffer(targetBuffer, [offset])>` and the :ref:`setWordtoBuffer method <Method: modbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusTcpServer.inputRegisters
------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' input registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusTcpServer.getWordFromBuffer(targetBuffer, [offset])>` and the :ref:`setWordtoBuffer method <Method: modbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusTcpServer.inputs
---------------------------------

* <Buffer>

This property is a Buffer that store the servers' digital inputs. The byte 0 store the inputs 0 to 7, byte 1 store inputs 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])>` 
and :ref:`setBooltoBuffer method <Method: modbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


Atribute: modbusTcpServer.coils
-------------------------------

* <Buffer>

This property is a Buffer that store the servers' digital coils. The byte 0 store the coils 0 to 7, byte 1 store coils 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])>` and :ref:`setBooltoBuffer method <Method: modbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


ModbusTcpServer's Methods
=========================

.. _modbus_tcp_server_methods:

See :ref:`ModbusServer Class Methods <modbus_server_methods>` for all base class inherited methods.

Method: modbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to read.
* **offset** <number>: A number with value's offset inside the buffer.
* **Return** <boolean>: value.


This method read a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

      modbusTcpServer.inputs[0] = 0x44  //first byte 0100 0100
      modbusTcpServer.coils[1] =  0x55 //second byte 0101 0101

      modbusTcpServer.getBoolFromBuffer(modbusTcpServer.inputs, 6) //return 1
      modbusTcpServer.getBoolFromBuffer(modbusTcpServer.coils, 5) //return 0


Method: modbusTcpServer.getPdu(reqAduBuffer)
----------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the pdu.

This method return the pdu part of a modbus tcp adu.


Method: modbusTcpServer.getMbapHeader(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the header.

This method return the header part of a modbus tcp adu.

Method: modbusTcpServer.getResponseAdu(reqAduBuffer)
----------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: Response Adu in a buffer object.


This method is the main TCP server's method. It receives a Modbus TCP request as an argument, processes it, and returns a buffer with the response ready to be send.


Method: modbusTcpServer.getWordFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.


This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9

.. code-block:: javascript

      modbusTcpServer.holdingRegisters[0] = 0x11;
      modbusTcpServer.holdingRegisters[1] = 0x22;
      modbusTcpServer.holdingRegisters[2] = 0x33;
      modbusTcpServer.holdingRegisters[3] = 0x44;
      
      modbusTcpServer.holdingRegisters.readUInt16BE(0)                           //returns 0x1122
      modbusTcpServer.holdingRegisters.readUInt16BE(1)                           //returns 0x2233
      modbusTcpServer.getWordFromBuffer(modbusTcpServer.holdingRegisters, 0)        //returns Buffer:[0x11, 0x22]
      modbusTcpServer.getWordFromBuffer(modbusTcpServer.holdingRegisters, 1)        //returns Buffer:[0x33, 0x44]


Method: modbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <boolean>: Value to write.
* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to write.
* **offset** <number>: A number with value's offset inside the buffer.


This method write a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

     modbusTcpServer.getBoolFromBuffer(true, modbusTcpServer.coils, 5) 
     console.log(modbusTcpServer.coils[1])  //now second byte is 0x75 (0111 0101)


Method: modbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])
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
      modbusTcpServer.setWordToBuffer(register1, modbusTcpServer.holdingRegisters, 1);
      modbusTcpServer.setWordToBuffer(register2, modbusTcpServer.holdingRegisters, 2);

      //instead this write pi value in bytes 1, 2, 3, 4
      modbusTcpServer.holdingRegisters.writefloatBE(3.14, 1) //alignment problem


Method: modbusTcpServer.validateMbapHeader(mbapBuffer)
------------------------------------------------------

* **mbapBuffer** <Buffer>: adu's header buffer.
* **Return** <boolean>: True if is a valid header otherwise false.


This method return tru if header's buffer has 7 bytes length and the protocol's field is 0.


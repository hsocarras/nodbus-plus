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

new nodbusTcpServer([netType], [options])
------------------------------------------

* **netType** <Class>: This argument define the constructor for the net layer. See :ref:`NetServer Class <nodbus_net_server>`

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

  * port <number>: TCP port on which the server will listen. Default 502

  * maxConnections <number>: Simultaneous conextions allowed by the server. Default 32.  

  * udpType <string>: Define the type of udp socket id udp net type is configured. Can take two values 'ud4' and 'usp6'. Default 'udp4'.

* **Returns:** <NodbusTcpServer>

NodbusPlus expose the function createTcpServer([netConstructor], [options]) to create new instances for NodbusTcpClass.

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

However new NodbusTcpServer instance can be created with customs :ref:`NetServer <nodbus_net_server>` importing the NodbusTcpServer Class.

.. code-block:: javascript

      const NodbusTcpServer = require('nodbus-plus').NodbusTcpServer;
      const NetServer = require('custom\net\custome_server.js');  //this is a example file for a user net server, it do not exist on nodbus-plus library

      let config = {};
      let nodbusTcpServer = new NodbusTcpServer(NetServer, config);

     

NodbusTcpServer's Events
=========================


Event: 'closed'
----------------

Emitted when the server is closed.


Event: 'connection'
-------------------

* **socket** <Object>: A node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_

Emitted when a client connect. Only emmited when 'tcp' type layer is used.


Event: 'connection-closed'
---------------------------

Emitted when the client's socket is closed and destroyed.


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'data'
---------------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  
if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.
* **data** <Buffer>: Data received.

Emitted when the underlaying net server emit the data event.


Event: 'listening'
------------------

* **port** <number>: TCP port on which the server is listening.

Emitted when the server is listening.


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


Event: 'request'
----------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  
    if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 
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

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  
    if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.
* **res** <Buffer>: Server's response.

Emitted when the underlaying net server write data to the socket.


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


NodbusTcpServer's Atributes
===========================


Atribute: nodbusTcpServer._internalFunctionCode
--------------------------------------------

* <Map>

This property stores the Modbus functions codes supported by the server. 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      class NodbusTcpServerExtended extends NodbusTcpServer{
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
      


Atribute: nodbusTcpServer.coils
-------------------------------

* <Buffer>

This property is a Buffer that store the servers' digital coils. The byte 0 store the coils 0 to 7, byte 1 store coils 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: nodbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])>` 
and :ref:`setBooltoBuffer method <Method: nodbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])>`.



Atribute: nodbusTcpServer.holdingRegisters
-------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' holding registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: nodbusTcpServer.getWordFromBuffer(targetBuffer, [offset])>` and 
the :ref:`setWordtoBuffer method <Method: nodbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: nodbusTcpServer.inputRegisters
------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' input registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: nodbusTcpServer.getWordFromBuffer(targetBuffer, [offset])>` and 
the :ref:`setWordtoBuffer method <Method: nodbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])>`.


Atribute: nodbusTcpServer.inputs
---------------------------------

* <Buffer>

This property is a Buffer that store the servers' digital inputs. The byte 0 store the inputs 0 to 7, byte 1 store inputs 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: nodbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])>`
and :ref:`setBooltoBuffer method <Method: nodbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])>`.



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

Atribute: nodbusTcpServer.supportedFunctionCode
------------------------------------------------

* <iterator>

This is a getter that return an iterator object trhough nodbusTcpServer._internalFunctionCode keys. It's the same that call nodbusTcpServer._internalFunctionCode.keys().

.. code-block:: javascript

      //Example of getting all suported function code.       
      for(const functionCode of nodbusTcpServer.supportedFunctionCode){
         console.log(functionCode)
      }



NodbusTcpServer's Methods
=========================

See :ref:`ModbusTcpServer Class Methods <modbus_tcp_server_methods>` for all base class inherited methods.

Method: nodbusTcpServer.getBoolFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to read.
* **offset** <number>: A number with value's offset inside the buffer.
* **Return** <boolean>: value.


This method read a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

      nodbusTcpServer.inputs[0] = 0x44  //first byte 0100 0100
      nodbusTcpServer.coils[1] =  0x55 //second byte 0101 0101

      nodbusTcpServer.getBoolFromBuffer(nodbusTcpServer.inputs, 6) //return 1
      nodbusTcpServer.getBoolFromBuffer(nodbusTcpServer.coils, 5) //return 0


Method: nodbusTcpServer.getPdu(reqAduBuffer)
----------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the pdu.

This method return the pdu part of a modbus tcp adu.


Method: nodbusTcpServer.getMbapHeader(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the header.

This method return the header part of a modbus tcp adu.


Method: nodbusTcpServer.getWordFromBuffer(targetBuffer, [offset])
--------------------------------------------------------------

* **targetBuffer** <Buffer>: Buffer with the objetive 16 bits register to read.
* **offset** <number>: A number with register's offset inside the buffer.
* **Return** <Buffer>: A two bytes length buffer.


This method read two bytes from target buffer with 16 bits align. Offset 0 get bytes 0 and 1, offset 4 gets bytes 8 and 9

.. code-block:: javascript

      nodbusTcpServer.holdingRegisters[0] = 0x11;
      nodbusTcpServer.holdingRegisters[1] = 0x22;
      nodbusTcpServer.holdingRegisters[2] = 0x33;
      nodbusTcpServer.holdingRegisters[3] = 0x44;
      
      nodbusTcpServer.holdingRegisters.readUInt16BE(0)                           //returns 0x1122
      nodbusTcpServer.holdingRegisters.readUInt16BE(1)                           //returns 0x2233
      nodbusTcpServer.getWordFromBuffer(nodbusTcpServer.holdingRegisters, 0)        //returns Buffer:[0x11, 0x22]
      nodbusTcpServer.getWordFromBuffer(nodbusTcpServer.holdingRegisters, 1)        //returns Buffer:[0x33, 0x44]


Method: nodbusTcpServer.setBoolToBuffer(value, targetBuffer, [offset])
-------------------------------------------------------------------

* **value** <boolean>: Value to write.
* **targetBuffer** <Buffer>: Buffer with the objetive boolean value to write.
* **offset** <number>: A number with value's offset inside the buffer.


This method write a boolean value inside a buffer. The buffer's first byte store the 0-7 boolean values's offset. Example:

.. code-block:: javascript

     nodbusTcpServer.getBoolFromBuffer(true, nodbusTcpServer.coils, 5) 
     console.log(nodbusTcpServer.coils[1])  //now second byte is 0x75 (0111 0101)


Method: nodbusTcpServer.start()
------------------------------------------------

Start the server. The server will emit the event 'listening' whhen is ready for accept connections.


Method: nodbusTcpServer.setWordToBuffer(value, targetBuffer, [offset])
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
      nodbusTcpServer.setWordToBuffer(register1, nodbusTcpServer.holdingRegisters, 1);
      nodbusTcpServer.setWordToBuffer(register2, nodbusTcpServer.holdingRegisters, 2);

      //instead this write pi value in bytes 1, 2, 3, 4
      nodbusTcpServer.holdingRegisters.writefloatBE(3.14, 1) //alignment problem



Method: nodbusTcpServer.stop()
------------------------------------------------

Stop the server. The server will emit the event 'closed' when all connection are destroyed.
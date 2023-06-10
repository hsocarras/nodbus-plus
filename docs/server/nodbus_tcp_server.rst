.. _nodbus_tcp_server:

===========================
Class: NodbusTcpServer
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

       

The NodbusTcpServer class extends the :ref:`ModbusTcpServer Class <modbus_tcp_server>`. This class implements a fully funcional modbus tcp server.

Creating a NodbusTcpServer Instance
================================

new ModbusServer([options], [netType])
---------------------------

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

  * port <number>: TCP port on which the server will listen. Default 502

  * maxConnections <number>: Simultaneous conextions allowed by the server. Default 32.  

  * tcpCoalescingDetection <boolean>: If this option is active the nodbus server can handle more than one modbus tcp adu in the same tcp package, 
      otherwise only one adu per package will be accepted. Default true.

  * udpType <string>: Define the type of udp socket id udp net type is configured. Can take two values 'ud4' and 'usp6'. Default 'udp4'.

* **netType** <Class>: This argument define the constructor for the net layer. See :ref:`NetServer Class <nodbus_net_server>`

* **Returns:** <NodbusTcpServer>

NodbusPlus expose the function createServer([netConstructor], [options]) to create new instances for NodbusTcpClass

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

However new Nodbus plus instance can be created with customs :ref:`NetServer <nodbus_net_server>` importing the NodbusTcpServer Class.

.. code-block:: javascript

      const NodbusTcpServer = require('nodbus-plus').NodbusTcpServer;
      const NetServer = require('custom\net\custome_server.js');

      let config = {};
      let nodbusTcpServer = new NodbusTcpServer(config, NetServer);

     

NodbusTcpServer's Events
=========================

Event: 'connection'
--------------

* **socket** <Object>: A node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_

Emitted when a client connect. Is only emmited when 'tcp' type layer is used.


Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'data'
---------------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_.

* **data** <Buffer>: Data received.

Emitted when the underlaying net server emit the data event.


Event: 'request'
--------------

* **socket** <object>: Can be a node `net.Socket <https://nodejs.org/api/net.html#class-netsocket>`_  if tcp is used or datagram `message rinfo <https://nodejs.org/api/dgram.html#event-message>`_. 

* **request** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited after the data event and only if the data had been validate at net layer level (data's length greater than 7 and equal to header's length field plus 6).


NodbusTcpServer's Atributes
===========================

Atribute: modbusServer._internalFunctionCode
--------------------------------------------

* <Map>

This property stores the Modbus functions codes supported by the server. 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      class ModbusServerExtended extends ModbusServer{
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
      

Atribute: modbusServer.supportedFunctionCode
--------------------------------------------

* <iterator>

This is a getter that return an iterator object trhough modbusServer._internalFunctionCode keys. It's the same that call modbusServer._internalFunctionCode.keys().

.. code-block:: javascript

      //Example of getting all suported function code.       
      for(const functionCode of modbusServer.supportedFunctionCode){
         console.log(functionCode)
      }

Atribute: modbusServer.holdingRegisters
---------------------------------------

* <Buffer>

This property is a Buffer that store the servers' holding registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusServer.getWordFromBuffer(targetBuffer, [offset])>` and the :ref:`setWordtoBuffer method <Method: modbusServer.setWordToBuffer(value, targetBuffer, [offset])>`.

Atribute: modbusServer.inputRegisters
-------------------------------------

* <Buffer>

This property is a Buffer that store the servers' input registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the 
:ref:`getWordFromBuffer method <Method: modbusServer.getWordFromBuffer(targetBuffer, [offset])>` and the :ref:`setWordtoBuffer method <Method: modbusServer.setWordToBuffer(value, targetBuffer, [offset])>`.

Atribute: modbusServer.inputs
-----------------------------

* <Buffer>

This property is a Buffer that store the servers' digital inputs. The byte 0 store the inputs 0 to 7, byte 1 store inputs 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusServer.getBoolFromBuffer(targetBuffer, [offset])>` and :ref:`setBooltoBuffer method <Method: modbusServer.setBoolToBuffer(value, targetBuffer, [offset])>`.

Atribute: modbusServer.coils
-----------------------------

* <Buffer>

This property is a Buffer that store the servers' digital coils. The byte 0 store the coils 0 to 7, byte 1 store coils 8-15 and so on.

To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusServer.getBoolFromBuffer(targetBuffer, [offset])>` and :ref:`setBooltoBuffer method <Method: modbusServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


NodbusTcpServer's Methods
=========================

.. _modbus_server_methods:

Method: modbusServer.processReqPdu(reqPduBuffer)
------------------------------------------------

* **reqPduBuffer** <Buffer>: A buffer containind the data part from request pdu.
* **Returns** <Buffer>: Complete response pdu's buffer.

This is the server's main function. Receive a request pdu buffer, and return a response pdu that can be a normal response or exception response.

Method: modbusServer.makeExceptionResPdu(mbFunctionCode,  exceptionCode)
------------------------------------------------------------------------

* **mbFunctionCode** <number>: The function code that cause the exception.
* **exceptionCode** <number>: See available exception code on :ref:`Event: 'mb_exception'`
* **Returns** <Buffer>: Exception response pdu

This functions create a exception response pdu by add 0x80 to function code and appending the exception code.

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

     modbusServer.getBoolFromBuffer(true, modbusServer.coils, 5) 
     console.log(modbusServer.coils[1])  //now second byte is 0x75 (0111 0101)
    
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

      //writing pi value in bytes 2, 3, 4, 5
      modbusServer.setWordToBuffer(register1, modbusServer.holdingRegisters, 1);
      modbusServer.setWordToBuffer(register2, modbusServer.holdingRegisters, 2);

      //instead this write pi value in bytes 1, 2, 3, 4
      modbusServer.holdingRegisters.writefloatBE(3.14, 1) //alignment problem
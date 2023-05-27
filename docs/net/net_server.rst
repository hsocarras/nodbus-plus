.. _nodbus_net_server:

===========================
API: Net Server
===========================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

Modbus TCP or serial servers ready to use from Nodbus Plus use a netServer object to implement the network layer. This object can be one of the following types:

* **tcpServer**: A wrapper around node `net.Server <https://nodejs.org/api/net.html#class-netserver>`_ .

* **udpserver**: A wrapper around node `dgram.Socket <https://nodejs.org/api/dgram.html#class-dgramsocket>`_ .

* **serialServer**: A wrapper around serialport 


Creating a ModbusServer Instance
================================

nodbus-plus.createServer([options])
------------------------------------




Hooks
======

onDataHook
-----------

This atribute store the function that will be called when data arrives to net interface. the function will be called with folowing arguments:

* **socket** <object>: socket
* **data** <Buffer>: Raw data received.

onMbAduHook
-------------

This atribute holds the function 

* **index** <number>: id 
* **data** <Buffer>: Valid data received. Tcp coalesing.

Se emite cuando se verifica que el frame tiene una longitud mayor de 8 y menor que 252, adicionalmente se verifica el tcp coalesing.
Se asegura de enviar un adu correcto en cuanto a numero de bytes.

onListeningHook
----------------

onConnectionRequestHook
------------------------

Only for tcp server object

onConnectionAcceptedHook
-------------------------

Only for tcp server object

onErrorHook
------------

* **error** <object>

onServerCloseHook
------------------

onConnectionCloseHook
----------------------

onWriteHook
------------

Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'write'
--------------

* **register** <number> Indicate wich register was written. 

  * 0: Coils.

  * 4: Holding registers.

* **values** <Map>: A Map object.

  * *key* <number>: The register offset. An integer between 0 and 65535.
  
  * *value* <boolean|Buffer>: The register value, a boolean for coils or a buffer with a length of 2 bytes for holding registers.

  .. code-block:: javascript

      modbusServer.on('write', (reg, val) => {
         if (reg === 0) {
            // coil written
            for (const coil of val.entries()) {
               console.log('Coil 0x' + coil[0] + ' was modified by the client with a value of ' + coil[1]);
            }
         } else {
            // holding register written
            for (const holding of val.entries()) {
               console.log('Holding register 4x' + holding[0] + ' was modified by the client with a value of ' + holding[1].readUInt16BE());
            }
         }
      })


Atributes
==========

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


Methods
=======

.. _modbus_server_methods:

Method: netServer.Start()
------------------------------------------------

* **reqPduBuffer** <Buffer>: A buffer containind the data part from request pdu.
* **Returns** <Buffer>: Complete response pdu's buffer.

This is the server's main function. Receive a request pdu buffer, and return a response pdu that can be a normal response or exception response.

Method: netServer.Stop()
------------------------------------------------------------------------

* **mbFunctionCode** <number>: The function code that cause the exception.
* **exceptionCode** <number>: See available exception code on :ref:`Event: 'mb_exception'`
* **Returns** <Buffer>: Exception response pdu

This functions create a exception response pdu by add 0x80 to function code and appending the exception code.

Method: netServer.write(index, frame)
-------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.


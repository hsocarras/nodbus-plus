.. _modbus_tcp_master:

======================
Class: ModbusTcpClient
======================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusClient Class <modbus_master>`. It provides the basic functionalities to handle Modbus TCP Aplication Data Units (ADU).

.. Figure:: /images/tcp_adu.png

   *Modbus Tcp Aplication Data Unis*

Creating a ModbusTcpClient Instance
===================================

new ModbusTcpClient()
---------------------

* **Returns:** <ModbusTcpClient>

Constructor for new ModbusTcpClient instance.

.. code-block:: javascript

      const ModbusTcpClient = require('nodbus-plus').ModbusTcpClient;
      let modbusTcpClient = new ModbusTcpClient();


ModbusTcpClient's Events
========================

Event: 'req-timeout'
--------------------

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusTcpClient.setReqTimer(transactionId, [timeout])` ends without call 
:ref:`Method: modbusTcpClient.clearReqTimer(transactionId)`. The event listener receive the transaction id of the request that fires the timeout and the request adu buffer.

* **transactionId** <number>: Indicate wich request fires the timeout event. 
* **vreq** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      modbusTcpClient.on('req-timeout', (id, req) ->{
         console.log('Timeout error from request: ' + id + '\n');
      })



Event: 'transaction'
--------------------

* **req** <Buffer>: Modbus Tcp request adu. 
* **res** <Buffer>: Modbus Tcp request adu.  

This event is emmited when the :ref:`Method: modbusTcpClient.processResAdu(bufferAdu)` is called to manage a server response.

.. code-block:: javascript

      modbusTcpClient.on('transaction', (req, res) ->{
         console.log('Transaction completed: ' + req.transactionId + '\n');
      })


ModbusTcpClient's Atributes
===========================

Atribute: modbusTcpClient._transactionCount
--------------------------------------------

* <number>

This property stores the tcp client's transactions counter. It should be not us directly instead through the accessor property transactionCount. 

Atribute: modbusTcpClient.maxNumberOfTransaction
-------------------------------------------------

* <number>

This property stores the maximum value of simultaneously open transactions allowed for the client. Dafault value is 64.

.. code-block:: javascript

      modbusTcpClient.maxNumberOfTransaction = 100; //set max number of transaction to 100

Atribute: modbusTcpClient.reqPool
-----------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: Modbus Tcp Adu.

A map to store active request. Each request is stored with his transaction's id as key.

.. code-block:: javascript

      modbusTcpClient.reqPool.set(1, Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x01])); //store a request with transaction id 1

Atribute: modbusTcpClient.reqTimersPool
----------------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: timer's id.

A map to store active request's timer. Each request start a timeout timer when is sended to server. This map store the timer's id for each request using her transaction's id as key.


Atribute: modbusTcpClient.transactionCount
-------------------------------------------

* <number>
   
Accesor property to get and set the transaction counter.

.. code-block:: javascript

      console.log(modbusTcpClient.transactionCount); //get transaction count
      modbusTcpClient.transactionCount = 10; //set transaction count to 10


ModbusTcpClient's Methods
=========================

.. _modbus_tcp_client_methods:


See :ref:`ModbusClient Class Methods <modbus_client_methods>` for all base class inherited methods.


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

Method: modbusTcpClient.clearReqTimer(transactionId)
-------------------------------------------------------------

* **transactionId** <number>: Modbus reqest's transaction id for wich the timer is set.


This functions call the build in clearTimeout function to avoid emit the'req-timeout' event, and remove the entry timerId from :ref:`request timers pool <Atribute: modbusTcpClient.reqTimersPool>`.

.. code-block:: javascript

      modbusTcpClient.clearReqTimer(1); //clear timer for request with transaction id 1

Method: modbusTcpClient.makeHeader(unitId, pduLength)
---------------------------------------------------------

* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **pduLength** <number>: The pdu's buffer length
* **Returns** <Buffer>: return a 7 bytes buffer with modbus tcp header

This functions create a modbus tcp header's buffer. Example:

.. code-block:: javascript
      
      modbusTcpClient.transactionCount = 10;
      header = modbusTcpClient.makeMbapHeader(2, 5);
      console.log(header);
      //Output
      //<Buffer 0x00 0x0a 0x00 0x00 0x00 0x06, 0x02>

Method: modbusTcpClient.makeRequest(unitId, pdu)
---------------------------------------------------------

* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **pdu** <Buffer>: The pdu's buffer.
* **Returns** <Buffer>: return a tcp adu request's buffer

This functions first increment the transaction counter and create a modbus tcp request ready to be send to the client. Example:

.. code-block:: javascript
      
      modbusTcpClient.transactionCount = 10;
      let pdu = modbusTcpClient.readHoldingRegistersPdu(0, 1);
      let request = modbusTcpClient.makeRequest(2, pdu);
      console.log(request);
      //Output
      //<Buffer 0x00 0x0a 0x00 0x00 0x00 0x06, 0x02, 0x03, 0x00, 0x00, 0x00, 0x01>

Method: modbusTcpClient.parseHeader(bufferHeader)
---------------------------------------------------------

* **bufferHeader** <Buffer>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **Returns** <object>: return a object with header's fields as properties:
    * *transactionId* <number>: the transaction id.
    * *protocolId* <number>: Must be 0 for modbus tcp protocol.
    * *length* <number>: the number a bytes following the header including the unit id byte.
    * *unitId* <number>: The unit id field, using by gateways to transalte modbus tcp adu to modbus serial adu.

This functions create a modbus tcp header's object. It throws a TypeError if argument is not a buffer instance and throw a RangeError if his length is diferent than 7. Example:

.. code-block:: javascript
      
      let rawHeader = Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x07, 0x05]);
      let header = modbusTcpClient.parseHeader(rawHeader);
      console.log(header.transactionId);
      console.log(header.protocolId);
      console.log(header.length);
      console.log(header.unitId);
      //Output
      //16
      //0
      //7
      //5

Method: modbusTcpClient.processResAdu(bufferAdu)
---------------------------------------------------------

* **bufferAdu** <Buffer>: A modbus tcp adu response buffer.


This method is used to managed server response. It remove the request from :ref:`request Pool <Atribute: modbusTcpClient.reqPool>`, call 
the :ref:`Method: modbusTcpClient.clearReqTimer(transactionId)` to avoid emit 'req-timeout' event and emit the 'transaction' event.

.. code-block:: javascript

      modbusTcpClient.processResAdu(Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x07, 0x05, 0x03, 0x00, 0x00, 0x00, 0x01]));

Method: modbusTcpClient.setReqTimer(transactionId, [timeout])
-------------------------------------------------------------

* **transactionId** <number>: Modbus reqest's transaction id for wich the timer is set.
* **timeout** <number>: Number of milliseconds to await for a response or fire timeout event.
* **Returns** <number>: Timer's id to be use on clearTimeout.

This functions store a timerId in the :ref:`request timers pool <Atribute: modbusTcpClient.reqTimersPool>` if the request exist in request pool.

.. code-block:: javascript

      modbusTcpClient.setReqTimer(1, 5000); //set a timer for request with transaction id 1 with a timeout of 5 seconds

Method: modbusTcpClient.storeRequest(bufferReq)
---------------------------------------------------------

* **bufferReq** <Buffer>: A modbus tcp adu request buffer.
* **Returns** <bool>: return true if was succesfully stored, otherwise false

This functions store a adu request in the :ref:`request Pool <Atribute: modbusTcpClient.reqPool>` if the size of the pool is less than
:ref:`max number of transaction allowed simultaniously <Atribute: modbusTcpClient.maxNumberOfTransaction>`

.. code-block:: javascript

      let request = Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x07, 0x05, 0x03, 0x00, 0x00, 0x00, 0x01]);
      modbusTcpClient.storeRequest(request); //store the request in the request pool







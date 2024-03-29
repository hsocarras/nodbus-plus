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

* **transactionId** <number>: Indicate wich request fires the timeout event. 
* **vreq** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      modbusTcpClient.on('req-timeout', (id, req) ->{
         console.log('Timeout error from request: ' + id + '\n');
      })

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusTcpClient.setReqTimer(transactionId, [timeout])` ends without call 
:ref:`Method: modbusTcpClient.clearReqTimer(transactionId)`

Event: 'transaction'
--------------------

* **req** <Buffer>: Modbus Tcp request adu. 
* **res** <Buffer>: Modbus Tcp request adu.  

This event is emmited when the :ref:`Method: modbusTcpClient.processResAdu(bufferAdu)` is called to manage a server response.



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

Atribute: modbusTcpClient.reqPool
-----------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: Modbus Tcp Adu.

A map to store active request. Each request is stored with his transaction's id as key.

Atribute: modbusTcpClient.reqTimersPool
----------------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: timer's id.

A map to store active request's timer. Each request start a timeout timer when is sended to server. This map store the timers is for each request using her transaction's id as key.


Atribute: modbusTcpClient.transactionCount
-------------------------------------------

* <number>
   
Accesor property to get and set the transaction counter.


ModbusTcpClient's Methods
=========================

.. _modbus_tcp_client_methods:

See :ref:`ModbusClient Class Methods <modbus_client_methods>` for all base class inherited methods.


Method: modbusTcpClient.boolToBuffer(value)
---------------------------------------------------------------------

* **value** <boolean>
* **Return** <Buffer>: Two bytes length Buffer. 

This is a utitlity method. It gets a buffer with a boolean value encoded for use on forceSingleCoilPdu function as value argument. Example:

.. code-block:: javascript

    let value = modbusTcpClient.boolToBuffer(false);
    console.log(value); //Buffer:[0x00, 0x00]
    value = modbusTcpClient.boolToBuffer(true);
    console.log(value); //Buffer:[0xFF, 0x00]



Method: modbusTcpClient.getMaskRegisterBuffer(value)
---------------------------------------------------------------------

* **value** <Array>: An 16 numbers length array indicating how to mask the register.
* **Return** <Buffer>: Four bytes length Buffer. 

This is a utility method that return a four-byte length buffer with the AND_MASK and OR_MASK values encoded for use in the maskHoldingRegisterPdu function as the value argument. 

The value argument is a 16-number array, with each number representing the position of one bit inside the register. If the number is 1, then the corresponding bit will be set to 1. 
If the number is 0, then the corresponding bit will be set to 0. If the number is different from 0 or 1, then the corresponding bit will remain unchanged. For example:

.. code-block:: javascript

    let value = [-1, 0, 1, -1, -1, -1, 0, 0, 1, -1, -1, -1, -1, -1, 1, 1];
    maskBuffer = modbusTcpClient.getMaskRegisterBuffer(value);

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

Method: modbusTcpClient.boolsToBuffer(value)
---------------------------------------------------------------------

* **value** <Array>: A boolean array.
* **Return** <Buffer>: a buffer with binary representation of boolean array. 

This is a utility method that return a buffer from a boolean array for modbus function code 15. 

The value argument is a array of boolean with values to bu force to coils. For example:

.. code-block:: javascript

    let values = [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1]; //at 0 index stat LSB Byte
    valBuffer = modbusTcpClient.boolsToBuffer(values);

    //result valBuffer [0xC2 0x04]
    // calling force multiples colis
    let pdu = modbusTcpClient.forceMultipleCoilsPdu(valBuffer, 10, values.length)  //calling force multiples coils at coil 10 and 11 coils to force



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


Method: modbusTcpClient.makeRequest(unitId, pdu)
---------------------------------------------------------

* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **pdu** <Buffer>: The pdu's buffer.
* **Returns** <Buffer>: return a tcp adu request's buffer

This functions first increment the transaction counter and create a modbus tcp request ready to be send to the client.

Method: modbusTcpClient.storeRequest(bufferReq)
---------------------------------------------------------

* **bufferReq** <Buffer>: A modbus tcp adu request buffer.
* **Returns** <bool>: return true if was succesfully stored, otherwise false

This functions store a adu request in the :ref:`request Pool <Atribute: modbusTcpClient.reqPool>` if the size of the pool is less than
:ref:`max number of transaction allowed simultaniously <Atribute: modbusTcpClient.maxNumberOfTransaction>`

Method: modbusTcpClient.setReqTimer(transactionId, [timeout])
-------------------------------------------------------------

* **transactionId** <number>: Modbus reqest's transaction id for wich the timer is set.
* **timeout** <number>: Number of milliseconds to await for a response or fire timeout event.
* **Returns** <number>: Timer's id to be use on clearTimeout.

This functions store a timerId in the :ref:`request timers pool <Atribute: modbusTcpClient.reqTimersPool>` if the request exist in request pool.


Method: modbusTcpClient.clearReqTimer(transactionId)
-------------------------------------------------------------

* **transactionId** <number>: Modbus reqest's transaction id for wich the timer is set.


This functions call the build in clearTimeout function to avoid emit the'req-timeout' event, and remove the entry timerId from :ref:`request timers pool <Atribute: modbusTcpClient.reqTimersPool>`.


Method: modbusTcpClient.processResAdu(bufferAdu)
---------------------------------------------------------

* **bufferAdu** <Buffer>: A modbus tcp adu response buffer.


This method is used to managed server response. It remove the request from :ref:`request Pool <Atribute: modbusTcpClient.reqPool>`, call 
the :ref:`Method: modbusTcpClient.clearReqTimer(transactionId)` to avoid emit 'req-timeout' event and emit the 'transaction' event.



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


.. _nodbus_tcp_master:

======================
Class: NodbusTcpClient
======================

**Nodbus-Plus v1.0 Documentation**

.. contents:: Table of Contents
   :depth: 3

This class extends :ref:`ModbusTcpClient Class <modbus_tcp_master>`. It provides ready to use Modbus TCP Client.


Creating a NodbusTcpClient Instance
===================================

new NodbusTcpClient(channelClass)
-------------------------------------

* **channelClass:** <Class>: This argument define the constructor for the net layer. See :ref:`NetChannel Class <nodbus_net_channel>`.
* **Returns:** <NodbusTcpClient>

NodbusPlus expose the function createTcpClient([netConstructor]) to create new instances for NodbusTcpClient.

* **netConstructor** <string>: Can be 'tcp' or'udp'. Default 'tcp'.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      let nodbusTcpClient = nodbus.createTcpClient('tcp'); //default settings, net layer is tcp

However new NodbusTcpClient instance can be created with customs :ref:`NetChannel <nodbus_net_channel>` importing the NodbusTcpClient Class.

.. code-block:: javascript

      const NodbusTcpClient = require('nodbus-plus').NodbusTcpClient;
      const NetChannel = require('custom\net\custome_channel.js'); //this is a example  file for a user channel, it do not exist on nodbus-plus library

      
      let nodbusTcpClient = new NodbusTcpClient(NetChannel);     



NodbusTcpClient's Events
========================


Event: 'connection'
-------------------

* **id** <string>: Channel's name

Emitted when the client succesfully connect to a server. 

Event: 'connection-closed'
---------------------------

* **id** <string>: Channel's name

Emitted when the channel close the connection.


Event: 'data'
---------------------

* **id** <string>: Channel's name.

* **data** <Buffer>: Data received.

Emitted when the channel emit the data event.



Event: 'error'
--------------

* **e** <Error>: The error object.

Emitted when a error occurs.


Event: 'req-timeout'
--------------------

* **transactionId** <number>: Indicate wich request fires the timeout event. 
* **vreq** <Buffer>: Modbus request adu buffer.

  .. code-block:: javascript

      nodbusTcpClient.on('req-timeout', (id, req) ->{
         console.log('Timeout error from request: ' + id + '\n');
      })

This event is emmited when the number of milliseconds pass to :ref:`Method: modbusTcpClient.setReqTimer(transactionId, [timeout])` ends without call 
:ref:`Method: modbusTcpClient.clearReqTimer(transactionId)`


Event: 'request'
----------------

* **id** <string>: Channel's name.

* **request** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited after the client send data to the server.


Event: 'response'
----------------

* **id** <string>: Channel's name.

* **response** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited when data received fron server has been validated.


Event: 'transaction'
--------------------

* **req** <Buffer>: Modbus Tcp request adu. 
* **res** <Buffer>: Modbus Tcp request adu.  

This event is emmited when the :ref:`Method: modbusTcpClient.processResAdu(bufferAdu)` is called to manage a server response.


Event: 'write'
---------------------

* **id** <string>: Channel's name.

* **reqAdu** <Buffer>: Client request,  a modbus tcp adu.

Emited after the client send data to the server.


NodbusTcpClient's Atributes
===========================


Atribute: nodbusTcpClient._transactionCount
--------------------------------------------

* <number>

This property stores the tcp client's transactions counter. It should be not us directly instead through the accessor property transactionCount. 


Atribute: nodbusTcpClient.maxNumberOfTransaction
-------------------------------------------------

* <number>

This property stores the maximum value of simultaneously open transactions allowed for the client. Default value is 64.

Atribute: nodbusTcpClient.channelType
--------------------------------------

* <Map> Map with types of channels.
    * *key* <string> type id.
    * *value* <object>: A channel class. See :ref:`NetChannel Class <nodbus_net_channel>` to be used as constructor.

This property store the client's channel constructor. Built in channel for Nodbus-Plus tcp client are 'tcp1' and 'udp1'.

Atribute: nodbusTcpClient.channels
-------------------------------------

* <Map> Map with client's channel list.
    * *key* <string> Channel's id.
    * *value* <object>: A channel object. See :ref:`NetChannel Class <nodbus_net_channel>`


Atribute: nodbusTcpClient.reqPool
-----------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: Modbus Tcp Adu.

A map to store active request. Each request is stored with his transaction's id as key.


Atribute: nodbusTcpClient.reqTimersPool
----------------------------------------------

* <Map>
    * *key* <number>: Transaction ID
    * *value* <Buffer>: timer's id.

A map to store active request's timer. Each request start a timeout timer when is sended to server. This map store the timers is for each request using her transaction's id as key.


Atribute: nodbusTcpClient.transactionCount
-------------------------------------------

* <number>
   
Accesor property to get and set the transaction counter.


NodbusTcpClient's Methods
=========================


See :ref:`ModbusTcpClient Class Methods <modbus_tcp_client_methods>` for all base class inherited methods.



Method: nodbusTcpClient.addChannel(id, type, channelCfg)
---------------------------------------------------------

* **id** <String>: Channel's name. Must be unique for each channel.

* **type** <string>: Channel's constructor id stored on channelType property. Default value is 'tcp1'.

* **channelCfg** <object>: Configuration object for the channel with following properties:

  * *ip* <String>: Modbus server's ip address. Defaul 'localhost'.

  * *port* <number> Port where the modbus server's is listening.

  * *timeout* <number> Number of milliseconds to await for a response on the channel.

  This method create a channel from the channel's constructor and add to the channels list :ref:`Atribute: nodbusTcpClient.channels`.

.. code-block:: javascript
      
      let device1 = {
      ip: '127.0.0.1',  //server's ip address
      port: 502,        //tcp port
      timeout: 500}     // miliseconds for timeout event

      nodbusTcpClient.addChannel('device1', 'tcp1', device1);
      

Method: nodbusTcpClient.connect(id)
----------------------------------------

* **id** <String>: Channels's name.

  This method try to connect to the remote server configured on the channel.



Method: nodbusTcpClient.delChannel(id)
----------------------------------------

* **id** <String>: Channels's name.

  This method remove a channel from the channels list :ref:`Atribute: nodbusTcpClient.channels`.



Method: nodbusTcpClient.disconnect(id)
----------------------------------------

* **id** <String>: Channels's name.

This method send the FIN package to the remote server to close the connection.



Method: nodbusTcpClient.isChannelReady(id)
----------------------------------------

* **id** <String>: Channels's name.
* **return** <boolean>: true if channel is connected and ready to send data to the server, otherwise false.

  This method return true if channel is connected and ready to send data to the server.


Method: nodbusTcpClient.parseHeader(bufferHeader)
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
      let header = nodbusTcpClient.parseHeader(rawHeader);
      console.log(header.transactionId);
      console.log(header.protocolId);
      console.log(header.length);
      console.log(header.unitId);
      //Output
      //16
      //0
      //7
      //5


Method: nodbusTcpClient.makeRequest(unitId, pdu)
---------------------------------------------------------

* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **pdu** <Buffer>: The pdu's buffer.
* **Returns** <Buffer>: return a tcp adu request's buffer

This functions first increment the transaction counter and create a modbus tcp request ready to be send to the client.


Method: nodbusTcpClient.forceSingleCoil(value, channelId, unitId, startCoil)
--------------------------------------------------------------------------------------------

* **value** <boolean>: Value to force.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: Coil to force at 0 address.
* **Returns** <boolean>: true if success

This functions create the force coil (function 05) request and sended to server.

.. code-block:: javascript
      
      //forcing coil to 1 on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //coils 10.      
      successStatus = nodbusTcpClient.forceSingleCoil(1, 'device1', 255, 10);


Method: nodbusTcpClient.forceMultipleCoils(values, channelId, unitId, startCoil)
--------------------------------------------------------------------------------------------

* **value** <Array>: Array of booleans with values to force.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: First coil to force starting at 0 address.
* **Returns** <boolean>: true if success

This functions create the force multiples coils (function 15) request and sended to server.

.. code-block:: javascript
      
      //forcing 6 coils to desire values on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //starting at coil 10.  
      vals = [1, 0, 1, 1, 0, 1]    
      successStatus = nodbusTcpClient.forceMultipleCoils(val, 'device1', 255, 10);


Method: nodbusTcpClient.maskHoldingRegister(values, channelId, unitId, startRegister)
--------------------------------------------------------------------------------------------

* **values** <Array> An array of 16 numbers with values to force. Index 0 is de less significant bit.
                    A value off 1 force to 1 the corresponding bit, 0 force to 0, other values don't change the bit value.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **Returns** <boolean>: true if success

This functions create the mask holding register (function 22) request and sended to server.

.. code-block:: javascript
      
      //forcing register on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = [1, 0, 1, 0, 2, 2, 1, 1, 2, 2, 0, 0, 0, 1, 2, 2]
      successStatus = nodbusTcpClient.maskHoldingRegister(vals, 'device1', 255, 99);



Method: nodbusTcpClient.presetSingleRegister(value, channelId, unitId, startRegister)
--------------------------------------------------------------------------------------------

* **value** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **Returns** <boolean>: true if success

This functions create the preset single register (function 06) request and sended to server.

.. code-block:: javascript
      
      //forcing register on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let val = Buffer.alloc(2);
      val.writeInt16BE(4567);
      successStatus = nodbusTcpClient.presetSingleRegister(val, 'device1', 255, 99);

    
Method: nodbusTcpClient.presetMultiplesRegisters(values, channelId, unitId, startRegister)
--------------------------------------------------------------------------------------------

* **values** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Register to write at 0 address.
* **Returns** <boolean>: true if success

This functions create the preset multiple registers (function 16) request and sended to server. The amount ofregister to write is the
values's buffer half length.

.. code-block:: javascript
      
      //writing 3 registers on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = Buffer.alloc(6);
      let tempRegister = Buffer.alloc(2);
      tempRegister.writeUInt16BE(245);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 0);
      tempRegister.writeUInt16BE(8965);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 1);
      tempRegister.writeUInt16BE(1045);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 2);
      successStatus = nodbusTcpClient.presetMultipleRegisters(vals, 'device1', 255, 99);



Method: nodbusTcpClient.readCoils(channelId, unitId, startCoil, coilsCuantity)
------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startCoil** <number>: Starting coil to read at 0 address.
* **coilsCuantity** <number>: Number of coils to read.
* **Returns** <boolean>: true if success

This functions create the read coil  (function 01) request and sended to server.

.. code-block:: javascript
      
      //Reading coil on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //coils 10 startint at 0.
      //Read 14 coils
      successStatus = nodbusTcpClient.readCoils('device1', 255, 10, 14);


Method: nodbusTcpClient.readHoldingRegisters(channelId, unitId, startRegister, registersCuantity)
--------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of registers to read.
* **Returns** <boolean>: true if success

This functions create the read holding register (function 03) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 10 .
      //Read 4 register
      successStatus = nodbusTcpClient.readHoldingRegisters('device1', 255, 10, 4);



Method: nodbusTcpClient.readInputs(channelId, unitId, startInput, inputsCuantity)
---------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startInput** <number>: Starting input to read at 0 address.
* **inputsCuantity** <number>: Number of inputs to read.
* **Returns** <boolean>: true if success

This functions create the read inputs  (function 02) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //input 0 .
      //Read 6 inputs
      successStatus = nodbusTcpClient.readInputs('device1', 255, 0, 6);


Method: nodbusTcpClient.readInputRegisters(channelId, unitId, startRegister, registersCuantity)
--------------------------------------------------------------------------------------------------

* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **startRegister** <number>: Starting input to read at 0 address.
* **registerCuantity** <number>: Number of inputs to read.
* **Returns** <boolean>: true if success

This functions create the read input register (function 04) request and sended to server.

.. code-block:: javascript
      
      //Reading input on channel device1, unitId 255  define device itself.
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 10 .
      //Read 4 register
      successStatus = nodbusTcpClient.readInputRegisters('device1', 255, 10, 4);



Method: nodbusTcpClient.readWriteMultiplesRegisters(values, channelId, unitId, readStartingRegister, readRegisterCuantity, writeStartingRegister)
-----------------------------------------------------------------------------------------------------------------------------------------------------

* **values** <Buffer> a two Bytes length buffer.
* **channelId** <string>: Channels's name.
* **unitId** <number>: Legacy modbus address for being using for a gateway. Modbus spec recomend using 255.
* **readStartingRegister** <number>: Starting input to read at 0 address.
* **readRegisterCuantity** <number>: Number of registers to read.
* **writeStartingRegister** <number>: Register to write at 0 address.
* **Returns** <boolean>: true if success

This functions create the read and write holding registers (function 23) request and sended to server.

.. code-block:: javascript
      
      //writing 3 registers on channel device1, unitId 255  define device itself and reading five registers from register 10
      //If device is a modbus gateway then unitId define the modbus address for desire station.
      //register 99 startint at 0.
      
      let vals = Buffer.alloc(6);
      let tempRegister = Buffer.alloc(2);
      tempRegister.writeUInt16BE(245);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 0);
      tempRegister.writeUInt16BE(8965);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 1);
      tempRegister.writeUInt16BE(1045);
      nodbusTcpClient.setWordToBuffer(tempRegister, vals, 2);
      successStatus = nodbusTcpClient.readWriteMultiplesRegisters(vals, 'device1', 255, 10, 5, 99);


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

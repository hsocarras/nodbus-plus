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

new NodbusTcpClient()
-------------------------------

* **Returns:** <NodbusTcpClient>

NodbusPlus expose the function createTcpClient([channelName], [channelConstructor]) to create new instances for NodbusTcpClient.

* **channelName** <string>: The name of the channel to be created.
* **channelConstructor** <Class>: The constructor for the net layer. See :ref:`NetChannel Class <nodbus_net_channel>`.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      let nodbusTcpClient = nodbus.createTcpClient(); //default settings, net layer is tcp

However new NodbusTcpClient instance can be created with customs :ref:`NetChannel <nodbus_net_channel>` importing the NodbusTcpClient Class.

.. code-block:: javascript

      const nodbus = require('nodbus-plus');
      const NetChannel = require('custom\net\custome_channel.js'); //this is a example  file for a user channel, it do not exist on nodbus-plus library    
      let nodbusTcpClient = nodbus.createTcpClient('my_custom_channel', NetChannel);     



NodbusTcpClient's Events
========================

**Inherited Events**

The following events are inherited from :ref:`ModbusTcpClient Class <modbus_tcp_master>`:
* ``req-timeout`` - Emitted when a request times out before receiving a response.
* ``transaction`` - Emitted when a complete request/response pair has been processed.

Event: 'connection'
-------------------

* **id** <string>: Channel's name

Emitted when the client succesfully connect to a server. 

.. code-block:: javascript

      nodbusTcpClient.on('connection', (id) ->{
         console.log('Connected to server on channel: ' + id + '\n');
      })

Event: 'connection-closed'
---------------------------

* **id** <string>: Channel's name

Emitted when the channel close the connection.

.. code-block:: javascript

      nodbusTcpClient.on('connection-closed', (id) ->{
         console.log('Connection closed on channel: ' + id + '\n');
      })

Event: 'data'
---------------------

* **id** <string>: Channel's name.

* **data** <Buffer>: Data received.

Emitted when the channel emit the data event.

.. code-block:: javascript

      client.on('data', (id, data) => {
         console.log(`Raw data from ${id}:`, data);
      });


Event: 'error'
--------------

Emitted when the transport reports an error.

* **err** <Error>: Error object

.. code-block:: javascript

      client.on('error', (err) => {
         console.error('Client error:', err);
      });

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
-----------------

* **id** <string>: Channel's name.

* **response** <object>: A with following properties:

  * *timeStamp* <number>: A timestamp for the request.
  
  * *transactionId* <number>: The header's transaction id field value.

  * *unitId* <number>: The header's unit id field value.

  * *functionCode* <number>: The modbus request's function code.

  * *data* <Buffer>: The pdu's data.

  Emited when data received fron server has been validated.


Event: 'write'
---------------------

* **id** <string>: Channel's name.

* **reqAdu** <Buffer>: Client request,  a modbus tcp adu.

Emited after the client send data to the server.

.. code-block:: javascript

      client.on('write', (id, reqAdu) => {
         console.log(`Data written to ${id}:`, reqAdu);
      });


NodbusTcpClient's Atributes
===========================

**Inherited Attributes**

The following attributes are inherited from :ref:`ModbusTcpClient Class <modbus_tcp_master>`:

- ``_transactionCount`` — Internal 16-bit transaction counter (use the accessor ``transactionCount``).
- ``transactionCount`` — Accessor property for the transaction counter (getter/setter with wrap-around).
- ``maxNumberOfTransaction`` — Maximum number of concurrent transactions (default: 64).
- ``reqPool`` — Map of pending requests keyed by transaction ID (Map<number, Buffer>).
- ``reqTimersPool`` — Map of active timeout timers keyed by transaction ID (Map<number, Timeout>).


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

NodbusTcpClient's Methods
=========================


The following methods are inherited from the base classes and are available on `NodbusTcpClient`:

**Inherited Methods from ModbusTcpClient**

- ``transactionCount`` (getter/setter) — Accessor for the internal transaction counter (wrap-around at 65536).
- ``makeHeader(unitId, pduLength)`` — Creates the 7-byte MBAP header for Modbus TCP.
- ``parseHeader(bufferHeader)`` — Parses a 7-byte MBAP header and returns its fields.
- ``makeRequest(unitId, pdu)`` — Builds a complete Modbus TCP ADU (MBAP header + PDU).
- ``storeRequest(bufferReq)`` — Adds a pending request to the request pool keyed by transaction ID.
- ``setReqTimer(transactionId, timeout)`` — Sets a timeout timer for a pending request.
- ``clearReqTimer(transactionId)`` — Clears the timeout timer for a pending request.
- ``processResAdu(bufferAdu)`` — Matches a received response ADU to a stored request and emits a transaction.

**Inherited Methods from ModbusClient (PDU builders & utilities)**

- ``readCoilStatusPdu(startCoil, coilQuantity)``
- ``readInputStatusPdu(startInput, inputQuantity)``
- ``readHoldingRegistersPdu(startRegister, registerQuantity)``
- ``readInputRegistersPdu(startRegister, registerQuantity)``
- ``forceSingleCoilPdu(value, startCoil)``
- ``presetSingleRegisterPdu(value, startRegister)``
- ``forceMultipleCoilsPdu(values, startCoil, coilQuantity)``
- ``presetMultipleRegistersPdu(values, startRegister, registerQuantity)``
- ``maskHoldingRegisterPdu(values, startRegister)``
- ``readWriteMultipleRegistersPdu(values, readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite)``
- ``boolToBuffer(value)`` — Helper to convert a boolean to a 2-byte coil value buffer.
- ``getMaskRegisterBuffer(...)`` — Utility provided via prototype from utils.
- ``boolsToBuffer(...)`` — Utility provided via prototype from utils.

**Own Methods**

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
      nodbusTcpClient.addChannel('device2', 'udp1', {ip: '192.168.1.100', port: 503, timeout: 500});
      

Method: nodbusTcpClient.connect(id)
----------------------------------------

* **id** <String>: Channels's name.

  This method try to connect to the remote server configured on the channel.

.. code-block:: javascript
      
      nodbusTcpClient.connect('device1'); // connects to the server configured on channel 'device1'

Method: nodbusTcpClient.delChannel(id)
----------------------------------------

* **id** <String>: Channels's name.

  This method remove a channel from the channels list :ref:`Atribute: nodbusTcpClient.channels`.

.. code-block:: javascript
      
      nodbusTcpClient.delChannel('device1'); // removes channel 'device1' from the client     

Method: nodbusTcpClient.disconnect(id)
----------------------------------------

* **id** <String>: Channels's name.

This method send the FIN package to the remote server to close the connection.

.. code-block:: javascript
      
      nodbusTcpClient.disconnect('device1'); // disconnects channel 'device1' from the server

Method: nodbusTcpClient.isChannelReady(id)
-------------------------------------------

* **id** <String>: Channels's name.
* **return** <boolean>: true if channel is connected and ready to send data to the server, otherwise false.

  This method return true if channel is connected and ready to send data to the server.

.. code-block:: javascript
      
      let isReady = nodbusTcpClient.isChannelReady('device1');
      console.log(`Channel 'device1' ready: ${isReady}`);



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



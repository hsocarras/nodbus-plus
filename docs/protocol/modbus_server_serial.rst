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
     
    * *0* Mode auto, the server can process modbus rtu and modbust ascii request.

    * *1* Mode Rtu. The server only acept RTU transmition mode.

    * *2* Mode Ascii. The server only acept Ascii transmition mode.

* **Returns:** <ModbusSerialServer>

Constructor for new ModbusSerialServer instance.

.. code-block:: javascript

      const ModbusSerialServer = require('nodbus-plus').ModbusSerialServer;
      let modbusSerialServer = new ModbusSerialServer({inputs: 1024, coils: 512}); //new server with 1024 inputs, 512 coils and 2048 holding and inputs registers


Atributes
==========

Atribute: modbusSerialServer.address
------------------------------------

* <number>

Accessor property to get and set the modbus's address. Allowed values are any number between 1-247.


Atribute: modbusSerialServer._broadcastFunctionCode
---------------------------------------------------

* <Map>

This property stores the Modbus functions code suported by the server for a  broadcast request . 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      class ModbusSErialServerExtended extends ModbusSerialServer{
            constructor(mbServerCfg){
                  super(mbServerCfg)
                  //adding the new function code and the name of handler
                  this._internalFunctionCode.set(68, 'customService68');
                  //add to broadcast suport handler method
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

Atribute: modbusSerialServer.exceptionCoils
--------------------------------------------

* <Buffer>

This property is a Buffer that store the servers' 8 exception coils.
To read and write digital values to the buffer, the modbus server provides the methods :ref:`getBoolFromBuffer <Method: modbusServer.getBoolFromBuffer(targetBuffer, [offset])>` 
and :ref:`setBooltoBuffer method <Method: modbusServer.setBoolToBuffer(value, targetBuffer, [offset])>`.


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


Atribute: modbusSerialServer.transmitionMode
---------------------------------------------

* <number>

Accessor property to get and set the modbus's transmition mode. Allowed values are 0, 1 and 2 for auto, rtu and ascii mode.

Methods
=======

See :ref:`ModbusServer Class Methods <modbus_server_methods>` for base class inherited methods.

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


Method: modbusSerialServer.getAddress(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu serial adu.
* **Returns** <numkber>: Modbus Rtu address field.

This method return the address field on a modbus rtu request.


Method: modbusSerialServer.getChecksum(reqAduBuffer)
-----------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu serial adu.
* **Returns** <Buffer>: Modbus Rtu checksum field.

This method return the 2 bytes length buffer containing the adu checksum field.


Method: modbusSerialServer.getPdu(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu serial adu.
* **Returns** <Buffer>: Modbus Rtu pdu.

This method return the pdu on a modbus rtu request.


Method: modbusSerialServer.getResponseAdu(reqAduBuffer)
-------------------------------------------------------

* **reqAduBuffer** <Buffer>: A buffer containing a rtu serial adu.
* **Returns** <Buffer>: Modbus response adu.

This method make the response adu acording to transmition mode selected and return it.


Method: modbusSerialServer.processBroadcastReqPdu(reqPduBuffer)
---------------------------------------------------------------

* **reqPduBuffer** <Buffer>: A buffer containind the data part from request pdu.
* **Returns** <Buffer>: Complete response pdu's buffer.

This method is similar to processReqPdu method, but is only invoqued when a broadcast request (address 0) is processed.
Receive a request pdu buffer, and return a response pdu that can be a normal response or exception response.


Method: modbusServer.readExceptionCoilsService(pduReqData)
-----------------------------------------------------------

* **pduReqData** <Buffer>: buffer containig the pdu's data.
* **Return** <Buffer>: buffer with response pdu.

.. Figure:: /images/7.png

   *Modbus Read Exception Coils Request and Response*

This method execute the read exception coils indication on the server. This method is not intended to be called directly, but instead through the method processReqPdu when function code 07 is received.

Method: modbusSerialServer.resetCounters()
------------------------------------------------

This method set to 0 all diagnostic counter in the modbus serial server.


Method: modbusSerialServer.validateCheckSum(frame)
--------------------------------------------------

* **frame** <Buffer>: A serial adu request buffer received by server.
* **Returns** <bool>: true if checksum field is correct, otherwise false.

This method is similar calculate th checksum for he buffer request acording to transmitionMode property, then compare the calculated checksum with request's checksum field. If match
return true, otherwise return false.


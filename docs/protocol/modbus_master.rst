.. _modbus_master:

Class: ModbusClient
===========================

**Nodbus-Plus v1.0 Documentation**

This class is an EventEmitter. It provides the basic functionalities to make Modbus Protocol Data Units (PDU).

.. Figure:: /images/modbus_pdu.png

   *Modbus Protocol Data Unis*

new ModbusClient()
------------------

* **Returns:** <ModbusClient>

Constructor for new ModbusClient instance.

.. code-block:: javascript

      const ModbusClient = require('nodbus-plus').ModbusClient;
      let modbusClient = new ModbusClient();                


Method: modbusClient.readCoilStatusPdu([startCoil],[coilQuantity])
------------------------------------------------------------------

* **startCoil** <number>: First coil to read, starting at address 0. Default value is 0
* **coilQuantity** <number>: Number of coils to read. Default value is 1
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/01-readcoils.png

   *Modbus Read Coils Request and Response*

This method create the read coil status request pdu. Function code 01.

Method: modbusClient.readInputStatusPdu([startInput],[inputQuantity])
---------------------------------------------------------------------

* **startInput** <number>: First input to read, starting at address 0. Default value is 0
* **inputQuantity** <number>: Number of inputs to read. Default value is 1
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/02-readinputs.png

   *Modbus Read Inputs Request and Response*

This method create the read input status request pdu. Function code 02.

Method: modbusClient.readHoldingRegistersPdu([startRegister],[registerQuantity])
--------------------------------------------------------------------------------

* **startRegister** <number>: First register to read, starting at address 0. Default value is 0
* **registerQuantity** <number>: Number of registers to read. Default value is 1
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/03-readholding.png

   *Modbus Read Holding Registers Request and Response*

This method create the read holding register request pdu. Function code 03.

Method: modbusClient.readInputRegistersPdu([startRegister],[registerQuantity])
------------------------------------------------------------------------------

* **startRegister** <number>: First register to read, starting at address 0. Default value is 0
* **registerQuantity** <number>: Number of registers to read. Default value is 1
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/04-readinputsreg.png

   *Modbus Read Inputs Registers Request and Response*

This method create the read inputs register request pdu. Function code 04.


Method: modbusClient.forceSingleCoilPdu(value, [startCoil])
------------------------------------------------------------

* **value** <Buffer>: Two bytes length buffer. Valid values are [0x00, 0x00] for false and [0xFF, 0x00] for true.
* **startCoil** <number>: Coil to be writed. Default value is 0.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/05-writecoil.png

   *Modbus Write Single Coil Request and Response*

This method create the force single coil request pdu. Function code 05. If value is not a Buffer throw a TypeError and if value's length is diferent than 2 
throw a RangeError.


Method: modbusClient.presetSingleRegisterPdu(value, [startRegister])
--------------------------------------------------------------------

* **value** <Buffer>: Two bytes length buffer.
* **startRegister** <number>: Register's address to be writed. Default value is 0.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/06-writeregister.png

   *Modbus Write Single holding Register Request and Response*

This method create the preset single register request pdu. Function code 06. If value is not a Buffer throw a TypeError and if value's length is diferent than 2 
throw a RangeError.


Method: modbusClient.forceMultipleCoilsPdu(values, startCoil, coilQuantity)
---------------------------------------------------------------------------

* **values** <Buffer>: Buffer with coils values.
* **startCoil** <number>: First Coil starting address.
* **coilQuantity** <number>: Number of coils to write.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/15-writecoil.png

   *Modbus Write Multiple Coils Request and Response*

This method create the force multiples coils request pdu. Function code 15. If values is not a Buffer throw a TypeError and if value's length is higher than 246
throw a RangeError.

Method: modbusClient.presetMultipleRegistersPdu(values, startRegister, [registerQuantity])
-------------------------------------------------------------------------------------------

* **values** <Buffer>: Buffer with registers values.
* **startRegister** <number>: First register starting address.
* **registerQuantity** <number>: Number of registers to write. Default value is values.length/2.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/16.png

   *Modbus Write Multiple Registers Request and Response*

This method create the preset multiples registers request pdu. Function code 16. If values is not a Buffer throw a TypeError and if value's length is higher than 246
throw a RangeError.

Method: modbusClient.maskHoldingRegisterPdu(values, [startRegister])
---------------------------------------------------------------------

* **values** <Buffer>: Buffer with registers values.
* **startRegister** <number>: Register address to modify.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/22-mask.png

   *Modbus Mask Register Request and Response*

This method create the mask holding register request pdu. Function code 22. If values is not a Buffer throw a TypeError and if value's length is diferent than 4
throw a RangeError.

Method: modbusClient.readWriteMultipleRegistersPdu(values,  readStartingAddress, quantitytoRead, writeStartingAddress, quantityToWrite)
---------------------------------------------------------------------------------------------------------------------------------------

* **values** <Buffer>: Buffer with registers values to write.
* **readStartingAddress** <number>: First register's address to read.
* **quantitytoRead** <number>: Number of register to read.
* **writeStartingAddress** <number>: First register's address to write.
* **quantityToWrite** <number>: Number of registers to write.
* **Return** <Buffer>: buffer with req pdu.

.. Figure:: /images/23.png

   *Modbus Read and Write Multiple Registers Request and Response*

This method create the read and write holding register request pdu. Function code 23. If values is not a Buffer throw a TypeError and if value's length is greater than 243
throw a RangeError.


Method: modbusClient.boolToBuffer(value)
---------------------------------------------------------------------

* **value** <boolean>
* **Return** <Buffer>: Two bytes length Buffer. 

This is a utitlity method. It gets a buffer with a boolean value encoded for use on forceSingleCoilPdu function as value argument. Example:

.. code-block:: javascript

    let value = modbusClient.boolToBuffer(false);
    console.log(value); //Buffer:[0x00, 0x00]
    value = modbusClient.boolToBuffer(true);
    console.log(value); //Buffer:[0xFF, 0x00]

Method: modbusClient.getMaskRegisterBuffer(value)
---------------------------------------------------------------------

* **value** <Array>: An 16 numbers length array indicating how to mask the register.
* **Return** <Buffer>: Four bytes length Buffer. 

This is a utility method that return a four-byte length buffer with the AND_MASK and OR_MASK values encoded for use in the maskHoldingRegisterPdu function as the value argument. 

The value argument is a 16-number array, with each number representing the position of one bit inside the register. If the number is 1, then the corresponding bit will be set to 1. 
If the number is 0, then the corresponding bit will be set to 0. If the number is different from 0 or 1, then the corresponding bit will remain unchanged. For example:

.. code-block:: javascript

    let value = [-1, 0, 1, -1, -1, -1, 0, 0, 1, -1, -1, -1, -1, -1, 1, 1];
    maskBuffer = modbusClient.getMaskRegisterBuffer(value);

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
        
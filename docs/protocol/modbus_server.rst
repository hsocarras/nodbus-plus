.. _modbus_server:

Class: ModbusServer
===========================

**Nodbus-Plus v1.0 Documentation**

This class is an EventEmitter. It provides the basic functionalities to handle Modbus Protocol Data Units (PDU).

.. Figure:: /images/modbus_pdu.png

   *Modbus Protocol Data Unis*

new ModbusServer([options])
---------------------------

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

* **Returns:** <ModbusServer>

Constructor for ModbusServer instance.

.. code-block:: javascript

      const ModbusServer = require('nodbus-plus').ModbusServer;
      let modbusServer = new ModbusServer({inputs: 1024, coils: 512}); //new server with 1024 inputs, 512 coils and 2048 holding and inputs registers

Event: 'error'
--------------

* **e** <Error> Emitted when a error occurs.

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
   </table> 


Event: 'write'
--------------

* **register** <number> Indicate wich register was writed. 
  * 0: Coils.
  * 4: Holding registers.
* **values** <Map>: Map object.
  * *key* <number>: The register offset. An integer between 0 and 65535.
  * *value* <boolean|Buffer>: The register value, A boolean for coils or a buffer with 2 bytes length for holding registers.

  .. code-block:: javascript

      modbusServer.on('write', (reg, val) ->{
         if(reg == 0){
            //coil writed
            for(const coil of val.entries()){
               console.log('coil 0x' + coil[0] + 'was modified by client with ' + coil[1] + 'value');
            }
         }
         else{
            //holding register writed
            for(const holding of val.entries()){
               console.log('holding register 4x' + holding[0] + 'was modified by client with ' + holding[1].readUInt16BE() + 'value');
            }
         }
      })

Atribute: modbusServer._internalFunctionCode
--------------------------------------------

* <Map>

This property stores the Modbus functions code suported by the server. 
It's a map composed of an integer number with the Modbus function code as the key and the name of the method that will be invoked to resolve that code as the value.

.. code-block:: javascript

      //Example of how to add new custom modbus function code handle function
      modbusServer._internalFunctionCode.set(68, 'resolveFunctionCode68'); //new function code 68
      modbusServer.resolveFunctionCode68 = function(pduReqData){
         //handle function to resolve a pdu receive a Buffer with pdu's data
         //code here
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

To read or write values in the registers, you can use the buffer's methods (see Node.js documentation), but it is recommended to use the getRegister and setRegister properties.

Atribute: modbusServer.inputRegisters
-------------------------------------

* <Buffer>

This property is a Buffer that store the servers' input registers.
The Modbus protocol specifies the order in which bytes are sent and receive. Modbus Plus uses a big-endian encoding to send the content of 16-bit registers.
This means that byte[0] of the register will be considered the MSB and byte[1] the LSB. 

Each register starts at the even byte of the buffer.Therefore, register 0 starts at byte 0 and occupies bytes 0 and 1, register 1 starts at byte 2 and occupies bytes 2 and 3, and so on.

Atribute: modbusServer.inputs
-----------------------------

* <Buffer>

This property is a Buffer that store the servers' digital inputs. The byte 0 store the inputs 0 to 7, byte 1 store inputs 8-15 and so on.
To read and write digital values to the buffer, the modbus server provides the methods blabla1 y blabla2

Atribute: modbusServer.coils
-----------------------------

* <Buffer>

This property is a Buffer that store the servers' digital coils. The byte 0 store the coils 0 to 7, byte 1 store coils 8-15 and so on.

Method: modbusServer.processReqPdu(reqPduBuffer)
------------------------------------------------

* **reqPduBuffer** <Buffer>: A buffer containind the data part from request pdu.
* **Returns** <Buffer>: Complete response pdu's buffer.

This is the server's main function. Receive a request pdu buffer, and return a response pdu that can be a normal response or exception response.

Method: modbusServer.makeExceptionResPdu(mbFunctionCode,  exceptionCode)
------------------------------------------------------------------------
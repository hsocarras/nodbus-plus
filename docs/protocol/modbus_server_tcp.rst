.. _modbus_tcp__server:

Class: ModbusTcpServer
======================

**Nodbus-Plus v1.0 Documentation**

This class extends :ref:`ModbusServer Class <modbus_server>`. It provides the basic functionalities to handle Modbus TCP Aplication Data Units (ADU).

.. Figure:: /images/tcp_adu.png

   *Modbus Tcp Aplication Data Unis*

new ModbusTcpServer([options])
-------------------------------

* **options** <object>: Configuration object with following properties:

  * inputs <number>: The cuantity of inputs that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the inputs will share the same Buffer as the inputs registers. Default value is 2048.

  * coils <number>: The cuantity of coils that the server will have. It's an integer between 0 and 65535. If a value of 0 is entered, then the coils will share the same Buffer as holding registers. Default value is 2048.

  * holdingRegisters <number>: The cuantity of holding registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.
  
  * inputRegisters <number>: The cuantity of input registers that the server will have. It's an integer between 1 and 65535. Default value is 2048.

* **Returns:** <ModbusTcpServer>

Constructor for new ModbusTcpServer instance.

.. code-block:: javascript

      const ModbusTcpServer = require('nodbus-plus').ModbusTcpServer;
      let modbusTcpServer = new ModbusTcpServer({inputs: 1024, coils: 512}); //new server with 1024 inputs, 512 coils and 2048 holding and inputs registers


Method: modbusTcpServer.getPdu(reqAduBuffer)
----------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the pdu.

This method return the pdu part of a modbus tcp adu.


Method: modbusTcpServer.getMbapHeader(reqAduBuffer)
---------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: buffer with the header.

This method return the header part of a modbus tcp adu.


Method: modbusTcpServer.validateMbapHeader(mbapBuffer)
------------------------------------------------------

* **mbapBuffer** <Buffer>: adu's header buffer.
* **Return** <boolean>: True if is a valid header otherwise false.


This method return tru if header's buffer has 7 bytes length and the protocol's field is 0.


Method: modbusTcpServer.getResponseAdu(reqAduBuffer)
----------------------------------------------------

* **reqAduBuffer** <Buffer>: adu buffer containing the header and pdu.
* **Return** <Buffer>: Response Adu in a buffer object.


This method is the main TCP server's method. It receives a Modbus TCP request as an argument, processes it, and returns a buffer with the response ready to be send.
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


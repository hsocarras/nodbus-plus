.. _gstarting:

Getting Starting
=================

Nodbus Plus has been designed as a stack for the Modbus protocol. 
It can be used to create both your own Modbus client and server using its API,
or you can use its build in client or server and have an application with Modbus communication in just minutes.

Instalation
------------

Nodbus Plus can be easily installed using npm.

.. code-block:: console

      $ npm install nodbus-plus

Basic Usage and Tutorial
-------------------------

In the "samples" folder, you will find three example programs for creating a Modbus TCP or serial server and a Modbus serial client.
First Nodbus-Plus must be inported:

.. code-block:: javascript

      const nodbus = require('nodbus-plus');


* **Server**


Then the configuration object mus be created for server constructor and the function createTcpServer must be called.

.. code-block:: javascript

    //Basic config for tcp server. Default values.
    const cfg = {
        inputs : 2048, //total inputs
        coils : 2048,  //total coils
        holdingRegisters : 2048, //total holding register
        inputRegisters : 2048,  //total input register
        port : 502,    //port to listen to
    }

    let server = nodbus.createTcpServer('tcp', cfg);

The first argument is the type of transport layer used. The nodbus-plus tcp server suport 'tcp', 'udp4' and 'udp6'. To create a 
serial server the procedure is the same, but calling createSerialServer function instead.

.. code-block:: javascript

    //Basic config for tcp server. Default values.
    let cfg = {
        address : 1,
        transmitionMode: 0, //0-rtu, 1 - ascii
        inputs : 2048,
        coils : 2048,
        holdingRegisters : 2048,
        inputRegisters : 2048,  
        port : 502,    
    }

    let server = nodbus.createSerialServer('tcp', cfg);

The createSerialServer function can take the value 'serial' as fist argument as well, however the property port mus be a string
with the path to a serial port and adicional port configuration property may be needed. See nodbus-plus api for more details.

After instantiate the server, the user's app must add listener for server's event. Example of basic events

    .. code-block:: javascript

        //listenning event
        server.on('listening', function(port){
            console.log('Server listening on: ' + port);        
        });

        //event emited when a request are received
        server.on('request', function(sock, req){
            console.log('Request received')
            console.log(req)
        });

        //Event emited when server send a response to client
        server.on('response', function(sock, res){
            console.log('Responding')
            console.log(res)
        });

        server.on('error', function(err){
            console.log(err)
        });


A complete list of available events can be found on :ref:`Nodbus Server documentation <nodbus_serial_server>`.

 All the nodbus servers suports the following function codes:

    * 01-Read Coils Status
    * 02-Read Inputs Status
    * 03-Read holding registers
    * 04-Read Inputs registers
    * 05-Force Single Coil
    * 06-Preset Single Register
    * 15-Force Multiple Coils
    * 16-Force Multiples Registes
    * 22-Mask Register
    * 23-Read and Write Multiples Registers

Additionally a serial server also suports function code 07 Read Exception Coils. Se api :ref:`ModbusSerialServer documentation <modbus_serial_server>` for more details,

Finally the server must be started.

.. code-block:: javascript

    server.start();


* **Client**


To create a client the functions createTcpClient or createSerialClient are available.

.. code-block:: javascript

    let client = nodbus.createSerialClient();

After instantiate the client, the user's app must add listener for client's event. Example of basic events.

.. code-block:: javascript

    //emitted when the client stablish connection with the server
    client.on('connection', (id)=>{
        console.log('connection stablish')    
    })

    //emited when error occurs
    client.on('error', (e)=>{    
        console.log(e)    
    })

    //emitted when a request is sended to server
    client.on('request', (id, req)=>{
        console.log('request sended to device: ' + id);        
    })

    //emited when no response is received
    client.on('req-timeout', (id, adu)=>{
        console.log('timeout')        
    })

    //emited when a response is received
    client.on('response', (id, res)=>{
        console.log(res)        
    })

A complete list of available events can be found on :ref:`Nodbus Client documentation <nodbus_serial_client>`.

Then channels must be add to client. The client will create a connection per channel. The following example add a modbus serial over tcp server, and conect to it.


.. code-block:: javascript

    //channel
    channelCfg = {        
        ip:'127.0.0.1',
        port:502,
        timeout:250,
    }

    client.addChannel('device', 'tcp1', channelCfg);
    client.connect('device')


The function addChannel take three arguments, the first one is channel's id, the seconds is channel's type. Three types are build in 'tcp1', 'udp1', and 'serial1'. 
See Api docs for more details.

Once the client is connected, and event listener configured, data can be exchange using availables modbus function.

.. code-block:: javascript

    //reading from cannel 'device', modbus address 1, two coils from 0 coil's address
    client.readCoils('device', 1, 0, 2);
    
A list for all available functions can be found on Clients Documentation API. See :ref:`NodbusSerialClient <nodbus_serial_client>` or :ref:`NodbusTcpClient <nodbus_serial_client>`.

Conclusion
----------

We hope that this help has provided you with the necessary information to start using Nodbus-Plus. We look forward to receiving your feedback and contributions in the future.

Thank you for choosing Nodbus-Plus, and happy development!

.. Nodbus-Plus documentation master file, created by
   sphinx-quickstart on Sat Apr 29 11:08:38 2023.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

=======================================
Welcome to Nodbus-Plus's documentation!
=======================================

Nodbus-plus is a library written entirely in JavaScript for creating Modbus clients and servers applications.

It supports both Modbus TCP and Modbus Serial, as well as different transport protocols such as TCP, UDP and serial line communication.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   starting   
   protocol/modbus_master.rst
   protocol/modbus_master_serial.rst
   protocol/modbus_master_tcp.rst
   protocol/modbus_server.rst
   protocol/modbus_server_serial.rst
   protocol/modbus_server_tcp.rst
   server/nodbus_tcp_server.rst  
   server/nodbus_serial_server.rst
   client/nodbus_master_tcp.rst
   client/nodbus_master_serial.rst

The source code is available on `Github <https://github.com/hsocarras/nodbus-plus>`_ under MIT License.

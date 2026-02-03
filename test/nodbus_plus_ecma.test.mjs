import test from 'node:test';
import assert from 'node:assert/strict';

import nodbus from '../src/nodbus-plus.mjs';
import {MjsFlag} from '../src/nodbus-plus.mjs';

import NodbusTcpServer from '../src/server/nodbus_tcp_server.js';
import NodbusSerialServer from '../src/server/nodbus_serial_server.js';
import TcpServer from '../src/server/net/tcpserver.js';
import UdpServer from '../src/server/net/udpserver.js';
import SerialServer from '../src/server/net/serialserver.js';

import NodbusTcpClient from '../src/client/nodbus_tcp_client.js';
import NodbusSerialClient from '../src/client/nodbus_serial_client.js';
import TcpChannel from '../src/client/net/tcpchannel.js';
import UdpChannel from '../src/client/net/udpchannel.js';
import SerialChannel from '../src/client/net/serialchannel.js';

test('nodbus-plus exports - factory functions es modules', async (t) => {
    //MjsFlag must be defined
    assert.strictEqual(MjsFlag, true);

    //Testing server factories
    // create Modbus Tcp Server over tcp network
    await t.test('createTcpServer: tcp. NodbusTcpServer instance running over tcp on port 500', () => {
        const srv = nodbus.createTcpServer('tcp', { port: 500 });
        assert.ok(srv);
        assert.strictEqual(srv instanceof NodbusTcpServer, true);
        assert.strictEqual(srv.net instanceof TcpServer, true);        
        assert.equal(srv.net.port, 500);
    });
    // create Modbus Tcp Server over udp4 and udp6 networks
    await t.test('createTcpServer: udp4 and udp6 on port 500 and 600', () => {
        const cfg = {port: 500};
        const srv4 = nodbus.createTcpServer('udp4', cfg);
        assert.ok(srv4);
        assert.strictEqual(srv4 instanceof NodbusTcpServer, true);
        assert.strictEqual(srv4.net instanceof UdpServer, true);        
        assert.equal(srv4.net.port, 500);

        const cfg6 = {port: 600};
        const srv6 = nodbus.createTcpServer('udp6', cfg6);
        assert.ok(srv6);
        assert.strictEqual(srv6 instanceof NodbusTcpServer, true);
        assert.strictEqual(srv6.net instanceof UdpServer, true);        
        assert.equal(srv6.net.port, 600);
    });
    
    // create Modbus Serial Server over serial network
    await t.test('createSerialServer: serial uses NetSerialServer and returns NodbusSerialServer', () => {
        const srv = nodbus.createSerialServer('serial', { speed: 9, port: 'COM1' });
        assert.ok(srv);
        assert.strictEqual(srv instanceof NodbusSerialServer, true);
        assert.strictEqual(srv.net instanceof SerialServer, true); 
        assert.equal(srv.net.port,'COM1');
        assert.equal(srv.net.coreServer.baudRate, 57600); // speed 9 -> 57600
    });

    // create Modbus Serial Server over tcp network
    await t.test('createSerialServer: serial uses NetSerialServer and returns NodbusSerialServer', () => {
        const srv = nodbus.createSerialServer('tcp', { port: 501 });
        assert.ok(srv);
        assert.strictEqual(srv instanceof NodbusSerialServer, true);
        assert.strictEqual(srv.net instanceof TcpServer, true); 
        assert.equal(srv.net.port, 501);       
    });
    // create Modbus Serial Server over udp4 and udp6 networks
    await t.test('createSerialServer: udp4/udp6 set serverCfg.udpType and use NetUdpServer', () => {
        const cfg = {port: 500};
        const srv4 = nodbus.createSerialServer('udp4', cfg);
        assert.ok(srv4);
        assert.strictEqual(srv4 instanceof NodbusSerialServer, true);
        assert.strictEqual(srv4.net instanceof UdpServer, true); 
        assert.equal(srv4.net.port, 500); 

        const cfg6 = {port: 600};
        const srv6 = nodbus.createSerialServer('udp6', cfg6);
        assert.ok(srv6);
        assert.strictEqual(srv6 instanceof NodbusSerialServer, true);
        assert.strictEqual(srv6.net instanceof UdpServer, true); 
        assert.equal(srv6.net.port, 600); 
    });
    //Testing client factories
    // create Modbus Tcp Client
    await t.test('createTcpClient: returns NodbusTcpClient', () => {
        const clientTcp = nodbus.createTcpClient('tcp');
        assert.ok(clientTcp);
        assert.strictEqual(clientTcp instanceof NodbusTcpClient, true);
        assert.strictEqual(clientTcp.channelType.get('tcp1') === TcpChannel, true);
        assert.strictEqual(clientTcp.channelType.get('udp1') === UdpChannel, true);

        class CustomChannel extends TcpChannel {}
        const clientCustom = nodbus.createTcpClient('customTcp', CustomChannel);
        assert.ok(clientCustom);
        assert.strictEqual(clientCustom instanceof NodbusTcpClient, true);
        assert.strictEqual(clientCustom.channelType.get('customTcp') === CustomChannel, true);
    });
    
    
    await t.test('createSerialClient: returns NodbusSerialClient', () => {

        const clientTcp = nodbus.createSerialClient('tcp');
        assert.ok(clientTcp);
        assert.strictEqual(clientTcp instanceof NodbusSerialClient, true);
        assert.strictEqual(clientTcp.channelType.get('tcp1') === TcpChannel, true);
        assert.strictEqual(clientTcp.channelType.get('udp1') === UdpChannel, true);
        assert.strictEqual(clientTcp.channelType.get('serial1') === SerialChannel, true);

        class CustomSerialChannel extends SerialChannel {}
        const clientCustom = nodbus.createSerialClient('customSerial', CustomSerialChannel);
        assert.ok(clientCustom);
        assert.strictEqual(clientCustom instanceof NodbusSerialClient, true);
        assert.strictEqual(clientCustom.channelType.get('customSerial') === CustomSerialChannel, true);
    });
});
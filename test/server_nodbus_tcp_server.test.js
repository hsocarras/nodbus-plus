const net = require('node:net');
const dgram = require('node:dgram');
const assert = require('node:assert/strict');
const test = require('node:test');
const Nodbus = require('../src/nodbus-plus');
const NodbusTcpServer = require('../src/server/nodbus_tcp_server');
const { on, once } = require('node:events');


// Helper utilities
function onceEvent(emitter, event) {
    return new Promise((resolve) => emitter.once(event, (...args) => resolve(args)));
}

test('CreateTcpServer API and basic construction', async (t) => {


    const serverCfg1 = {
        inputs: 524,
        coils: 0,
        holdingRegisters: 512,
        inputRegisters: 256,
        port: 1502,
    };
    const server1 = Nodbus.createTcpServer('tcp');
    const server2 = Nodbus.createTcpServer('tcp', serverCfg1);
    const server3 = Nodbus.createTcpServer('udp');
    assert.ok(server1 instanceof NodbusTcpServer);
    assert.ok(server2 instanceof NodbusTcpServer);
    assert.ok(server3 instanceof NodbusTcpServer);
    //server 1 default config
    assert.strictEqual(server1.net.port, 502);
    assert.strictEqual(server1.holdingRegisters.length, 2 * 2048);
    //server 2 custom config
    assert.strictEqual(server2.net.port, 1502);
    assert.strictEqual(server2.holdingRegisters.length, 2 * 512);
    //server 3 default config
    assert.strictEqual(server3.net.port, 502);
    assert.strictEqual(server3.holdingRegisters.length, 2 * 2048);

    //cleanup
    server1.stop();
    await onceEvent(server1, 'closed');
    assert.strictEqual(server1.isListening, false);
    server2.stop();
    await onceEvent(server2, 'closed');
    assert.strictEqual(server2.isListening, false);
    server3.stop();  
    await onceEvent(server3, 'closed');
    assert.strictEqual(server3.isListening, false);
});

test('tcp server real client exercises', async (t) => {


    const server = Nodbus.createTcpServer('tcp');

    // track events emitted by server
    const recieved = { data: [], req: [], res: [], writes: [] };
    server.on('data', (sock, frame) => recieved.data.push({ sock, frame }));
    server.on('request', (sock, req) => recieved.req.push({ sock, req }));
    server.on('response', (sock, res) => recieved.res.push({ sock, res }));
    server.on('write', (sock, frame) => recieved.writes.push({ sock, frame }));

    // Start server and wait listening
    server.start();
    await onceEvent(server, 'listening'); // NodbusSerialServer emits 'listening' with port
    assert.strictEqual(server.isListening, true);

    // get actual port (server.port should be set)
    const port = server.port;
    assert.strictEqual(port, 502);

    // create TCP client
    const client = net.createConnection({ port: 502, host: '127.0.0.1' });
    await onceEvent(client, 'connect');

    // Prepare ADUs to send 
    const adu1 = Buffer.from([0x00, 0x01, 0x00, 0x02, 0x00, 0x06, 0x01, 0x03, 0x00, 0x00, 0x00, 0x01]); //wrong header
    const adu2 = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x01, 0x33, 0x00, 0x00, 0x00, 0x01]); // invalid function
    const adu3 = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x01, 0x03, 0x00, 0x00, 0x00, 0x01]); // valid read request

    // Collect data events from server side and response received by client
    const clientResponses = [];
    client.on('data', (data) => clientResponses.push(data));

    // Send the frames with short spacing (server should handle them)
    client.write(adu1);
    await new Promise((r) => setTimeout(r, 50));
    client.write(adu2);
    await new Promise((r) => setTimeout(r, 50));
    client.write(adu3);

    // Give server time to process and respond
    await new Promise((r) => setTimeout(r, 300));

    // Basic assertions: server recorded data and request/response events
    assert.strictEqual(recieved.data.length, 3); // all frames reach server
    // There should be at least 2 valid request
    assert.strictEqual(recieved.req.length, 2);
    // the client should have received at least one response (for good ADU)
    assert.strictEqual(clientResponses.length, 2);

    // cleanup
    client.destroy();
    server.stop();
    await onceEvent(server, 'closed');
    assert.strictEqual(server.isListening, false);
});

test('udp server real client exercises', async (t) => {

    const server = Nodbus.createTcpServer('udp6');

    // track events emitted by server
    const recieved = { data: [], req: [], res: [], writes: [] };
    server.on('data', (sock, frame) => recieved.data.push({ sock, frame }));
    server.on('request', (sock, req) => recieved.req.push({ sock, req }));
    server.on('response', (sock, res) => recieved.res.push({ sock, res }));
    server.on('write', (sock, frame) => recieved.writes.push({ sock, frame }));

    // Start server and wait listening
    server.start();
    await onceEvent(server, 'listening'); // NodbusSerialServer emits 'listening' with port
    assert.strictEqual(server.isListening, true);

    // get actual port (server.port should be set)
    const port = server.port;
    assert.strictEqual(port, 502);

    // create TCP client
    const client = dgram.createSocket('udp6');
    client.connect(502);
    await onceEvent(client, 'connect');

    // Prepare ADUs to send 
    const adu1 = Buffer.from([0x00, 0x01, 0x00, 0x02, 0x00, 0x06, 0x01, 0x03, 0x00, 0x00, 0x00, 0x01]); //wrong header
    const adu2 = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x01, 0x33, 0x00, 0x00, 0x00, 0x01]); // invalid function
    const adu3 = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x01, 0x03, 0x00, 0x00, 0x00, 0x01]); // valid read request

    // Collect data events from server side and response received by client
    const clientResponses = [];
    client.on('message', (data) => clientResponses.push(data));

    // Send the frames with short spacing (server should handle them)
    client.send(adu1);
    await new Promise((r) => setTimeout(r, 50));
    client.send(adu2);
    await new Promise((r) => setTimeout(r, 50));
    client.send(adu3);

    // Give server time to process and respond
    await new Promise((r) => setTimeout(r, 300));

    // Basic assertions: server recorded data and request/response events
    assert.strictEqual(recieved.data.length, 3); // all frames reach server
    // There should be at least 2 valid request
    assert.strictEqual(recieved.req.length, 2);
    // the client should have received at least one response (for good ADU)
    assert.strictEqual(clientResponses.length, 2);

    // cleanup - fully close the UDP socket so the test runner can exit
    client.close();
    await onceEvent(client, 'close');
    server.stop();
    await onceEvent(server, 'closed');
    assert.strictEqual(server.isListening, false);
});



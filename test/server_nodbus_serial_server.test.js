const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { setImmediate } = require('timers');
const Nodbus = require('../src/nodbus-plus');
const NodbusSerialServer = require('../src/server/nodbus_serial_server');

// Helper utilities
function onceEvent(emitter, event) {
    return new Promise((resolve) => emitter.once(event, (...args) => resolve(args)));
}

function waitTick() {
    return new Promise((r) => setImmediate(r));
}

test('CreateSerialServer API and basic construction', async (t) => {
    
    await t.test('createSerialServer returns configured server instances', () => {

        const serverCfg1 = {
            inputs: 524,
            coils: 0,
            holdingRegisters: 512,
            inputRegisters: 256,
            port: 'com0',
            speed: 7,
            address: 10,
            transmitionMode: 0,
        };

        const server1 = Nodbus.createSerialServer('tcp');
        const server2 = Nodbus.createSerialServer('serial', serverCfg1);
        const server3 = Nodbus.createSerialServer('udp4');
        assert.ok(server1 instanceof NodbusSerialServer);
        assert.ok(server2 instanceof NodbusSerialServer);
        assert.ok(server3 instanceof NodbusSerialServer);

        //server 1 default config
        assert.strictEqual(server1.net.port, 502);
        assert.strictEqual(server1.address, 1);
        //server 2 custom config
        assert.strictEqual(server2.net.port, 'com0');
        assert.strictEqual(server2.address, 10);
        assert.strictEqual(server2.transmitionMode, 0);
        //server 3 default config
        assert.strictEqual(server3.net.port, 502);
        assert.strictEqual(server3.address, 1);
    
    });
});

test('RTU server integration (TCP) - real client exercises requests/responses', async (t) => {
    // server configuration for RTU (transmitionMode 0)
    const serverCfg1 = {
        inputs: 524,
        coils: 0,
        holdingRegisters: 512,
        inputRegisters: 256,
        speed: 7,
        address: 1,
        transmitionMode: 0,
        port: 0, // Use dynamic port assignment
    };

    const server = Nodbus.createSerialServer('tcp', serverCfg1);

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
    assert.ok(port > 0, 'Server port should be dynamically assigned');

    // create TCP client using the dynamically assigned port
    const client = net.createConnection({ port, host: '127.0.0.1' });
    await onceEvent(client, 'connect');

    // Prepare ADUs to send (RTU) - broadcast, wrong address, wrong CRC, good
    const aduBroadcast = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x45, 0xD8]);
    const aduWrongAddr = Buffer.from([0x0A, 0x03, 0x00, 0x00, 0x00, 0x04, 0x45, 0x72]);
    const aduBadCrc = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x04, 0x44, 0x19]); // intentionally bad CRC
    const aduGood = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x04, 0x44, 0x09]);

    // Collect data events from server side and response received by client
    const clientResponses = [];
    client.on('data', (data) => clientResponses.push(data));

    // Send the frames with short spacing (server should handle them)
    client.write(aduBroadcast);
    await new Promise((r) => setTimeout(r, 50));
    client.write(aduWrongAddr);
    await new Promise((r) => setTimeout(r, 50));
    client.write(aduBadCrc);
    await new Promise((r) => setTimeout(r, 50));
    client.write(aduGood);

    // Give server time to process and respond
    await new Promise((r) => setTimeout(r, 300));

    // Basic assertions: server recorded data and request/response events
    assert.strictEqual(recieved.data.length, 4); // all frames reach server
    // There should be at least one 'request' and one 'response' emitted (for the good ADU)
    assert.strictEqual(recieved.req.length, 2);
    // the client should have received at least one response (for good ADU)
    assert.strictEqual(clientResponses.length, 1);

    // cleanup
    client.destroy();
    server.stop();
    await onceEvent(server, 'closed');
    assert.strictEqual(server.isListening, false);
});

test('ASCII server integration (TCP) - real client exercises ASCII flows', async (t) => {

    const serverCfg2 = {
        inputs: 524,
        coils: 0,
        holdingRegisters: 512,
        inputRegisters: 256,
        port: 0, // Use dynamic port assignment
        address: 1,
        transmitionMode: 1, // ASCII
        tcpCoalescingDetection: true,
    };

    const server = Nodbus.createSerialServer('tcp', serverCfg2);    

    // track events emitted by server
    const recieved = { data: [], req: [], res: [], writes: [] };
    server.on('data', (sock, frame) => recieved.data.push({ sock, frame }));
    server.on('request', (sock, req) => recieved.req.push({ sock, req }));
    server.on('response', (sock, res) => recieved.res.push({ sock, res }));
    server.on('write', (sock, frame) => recieved.writes.push({ sock, frame }));

    server.start();
    await onceEvent(server, 'listening');
    
    const port = server.port;
    assert.ok(port > 0, 'Server port should be dynamically assigned');
    
    // create TCP client using the dynamically assigned port
    const client = net.createConnection({ port, host: '127.0.0.1' });
    await onceEvent(client, 'connect');
        
    // ASCII ADUs (strings represented as Buffer)
    const adu1 = Buffer.from(':000300000003FA\r\n'); // broadcast
    const adu2 = Buffer.from(':0A03000000044572\r\n'); // wrong address
    const adu4 = Buffer.from(':010300000003F2\r\n'); // potentially bad LRC (kept short)
    const adu3 = Buffer.from(':010300000003F9\r\n'); // a valid-like frame (content depends on implementation)

    const responses = [];
    client.on('data', (d) => responses.push(d));

    client.write(adu1);
    await new Promise((r) => setTimeout(r, 100));
    client.write(adu2);
    await new Promise((r) => setTimeout(r, 100));
    client.write(adu4);
    await new Promise((r) => setTimeout(r, 100));
    client.write(adu3);
    await new Promise((r) => setTimeout(r, 300));

    // Expect client to have some responses (ASCII responses start with ':' character)
    assert.strictEqual(recieved.data.length == 4, true); // all frames reach server
    assert.strictEqual(recieved.req.length == 2, true); // only two frame are valid requests
    assert.strictEqual(responses.length == 1, true);    // broadcast and wrong address get no response
    assert.strictEqual(recieved.res.length == 1, true);    // broadcast and wrong address get no response
    assert.strictEqual(recieved.writes.length == 1, true); // ASCII ':' character

    // cleanup
    client.destroy();
    server.stop();
    await onceEvent(server, 'closed');
    assert.strictEqual(server.isListening, false);
});

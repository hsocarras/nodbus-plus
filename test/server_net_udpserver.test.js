const test = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('node:dgram');
const { setImmediate } = require('timers');

const UdpServer = require('../src/server/net/udpserver');

function onceEvent(emitter, event) {
    return new Promise((resolve) => emitter.once(event, (...args) => resolve(args)));
}

test('UdpServer integration tests using real udp client (no mocks)', async (t) => {

    await t.test('constructor defaults and custom config', () => {
        const defaultSrv = new UdpServer();
        assert.strictEqual(defaultSrv.port, 502);
        assert.strictEqual(defaultSrv.maxConnections, 32);
        assert.strictEqual(defaultSrv.accessControlEnable, false);
        assert.strictEqual(defaultSrv.tcpCoalescingDetection, false);
        assert.strictEqual(defaultSrv.isListening, false);

        const custom = new UdpServer({ port: 1502, udpType: 'udp4' });
        assert.strictEqual(custom.port, 1502);
        assert.strictEqual(custom.isListening, false);
    });
    
    await t.test('start() and stop() lifecycle and listening hook', async () => {
        const srv = new UdpServer({ port: 0 }); // let OS pick port
        let listeningCalled = false;
        srv.onListeningHook = () => { listeningCalled = true; };

        srv.start();
        await onceEvent(srv.coreServer, 'listening');

        assert.strictEqual(srv.isListening, true);
        assert.strictEqual(listeningCalled, true);

        let closeCalled = false;
        srv.onServerCloseHook = () => { closeCalled = true; };
        srv.stop();
        await onceEvent(srv.coreServer, 'close');

        assert.strictEqual(srv.isListening, false);
        assert.strictEqual(closeCalled, true);
    });
    
    await t.test('message handling: onDataHook and onMbAduHook when validateFrame true', async () => {
        const srv = new UdpServer({ port: 0 });
        const msgs = [];
        const adus = [];

        srv.onDataHook = (rinfo, msg) => msgs.push({ rinfo, msg });
        srv.onMbAduHook = (rinfo, msg) => adus.push({ rinfo, msg });
        srv.validateFrame = (buf) => {if (buf.length > 5) return true; return false; };

        srv.start();
        await onceEvent(srv.coreServer, 'listening');
        const { port } = srv.coreServer.address();
        
        // client to send UDP
        const client = dgram.createSocket('udp4');
        
        // send a test message
        let msgPromise1 = onceEvent(srv.coreServer, 'message');
        const testMsg = Buffer.from('hello-udp');        
        client.send(testMsg, port, '127.0.0.1');
        await msgPromise1; 
        assert.ok(msgs.length >= 1, 'onDataHook should be called at least once');
        assert.ok(adus.length >= 1, 'onMbAduHook should be called when validateFrame true');
        
        // send a short message that should fail validateFrame
        let msgPromise2 = onceEvent(srv.coreServer, 'message');
        const shortMsg = Buffer.from('bad');
        client.send(shortMsg, port, '127.0.0.1');
        await msgPromise2;
        assert.ok(msgs.length >= 2, 'onDataHook should be called for every message');
        assert.strictEqual(adus.length, 1, 'onMbAduHook should not be called for invalid frame');
        
        client.close();
        srv.stop();
        await onceEvent(srv.coreServer, 'close');
        assert.strictEqual(srv.isListening, false);
    });
     
    await t.test('write() sends datagram back to client and triggers onWriteHook', async () => {
        const srv = new UdpServer({ port: 0 });
        let writeHookCalled = false;
        srv.onWriteHook = (rinfo, frame) => { writeHookCalled = true; };

        // receive response on client
        const client = dgram.createSocket('udp4');
        const received = [];

        client.on('message', (msg, rinfo) => {
            received.push(msg);
        });

        srv.onDataHook = (rinfo) => {
            // echo back via server.write
            const frame = Buffer.from('pong');
            srv.write(rinfo, frame);
        };

        srv.validateFrame = () => true;
        srv.start();
        await onceEvent(srv.coreServer, 'listening');
        const { port } = srv.coreServer.address();

        // send a ping from client
        let msgPromise1 = onceEvent(srv.coreServer, 'message');    
        let clientMsgPromise = onceEvent(client, 'message');    
        client.send(Buffer.from('ping'), port, '127.0.0.1');
        await msgPromise1;
        // wait for server to respond
        await clientMsgPromise;
        
        assert.ok(received.length >= 1, 'client should receive server write');
        assert.strictEqual(writeHookCalled, true);

        client.close();
        srv.stop();
        await onceEvent(srv.coreServer, 'close');
    });
    
    await t.test('onErrorHook invoked when coreServer emits error', async () => {
        const srv = new UdpServer({ port: 0 });
        let captured = null;
        srv.onErrorHook = (e) => { captured = e; };

        srv.start();
        await onceEvent(srv.coreServer, 'listening');

        // simulate error
        srv.coreServer.emit('error', new Error('simulated udp error'));
        await new Promise((r) => setImmediate(r));

        assert.ok(captured instanceof Error);

        srv.stop();
        await onceEvent(srv.coreServer, 'close');
    });
});
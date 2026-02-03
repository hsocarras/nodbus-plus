

const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { setImmediate } = require('timers');

const TcpServer = require('../src/server/net/tcpserver');

/// Helper to await a single event once
function onceEvent(emitter, event) {
    return new Promise((resolve) => {
        emitter.once(event, (...args) => resolve(args));
    });
}

test('TcpServer integration tests using real tcp clients (no mocking)', async (t) => {

    await t.test('testing default constructor and custom constructor', () => {
        //default configuration
        const serverDefault = new TcpServer();
        assert.strictEqual(serverDefault.port, 502);
        assert.strictEqual(serverDefault.maxConnections, 32);
        assert.strictEqual(serverDefault.accessControlEnable, false);
        assert.strictEqual(serverDefault.tcpCoalescingDetection, false);
        //custom configuration
        const customCfg = { port: 1502, maxConnections: 10, accessControlEnable: true, tcpCoalescingDetection: true };
        const serverCustom = new TcpServer(customCfg);
        assert.strictEqual(serverCustom.port, 1502);
        assert.strictEqual(serverCustom.maxConnections, 10);
        assert.strictEqual(serverCustom.accessControlEnable, true);
        assert.strictEqual(serverCustom.tcpCoalescingDetection, true);
    });

    await t.test('testing server start and stop methods and listening hook function', async () => {
        const server = new TcpServer({ port: 500 }); // port 0 to auto-assign
        assert.strictEqual(server.isListening, false);
        // Track hook calls
        let listeningCalled = false;
        server.onListeningHook = () => { listeningCalled = true; };

        // Start server
        const listeningPromise = onceEvent(server.coreServer, 'listening');
        server.start();
        await listeningPromise;
        assert.strictEqual(server.isListening, true);
        assert.strictEqual(listeningCalled, true);
        // Stop server
        let serverCloseCalled = false;
        server.onServerCloseHook = () => { serverCloseCalled = true; };
        const closePromise = onceEvent(server.coreServer, 'close');
        server.stop();
        await closePromise;
        assert.strictEqual(server.isListening, false);
        assert.strictEqual(serverCloseCalled, true);
    });

    await t.test('testing connection acceptance, add sockets to pool, and server close', async () => {

        let connectionAccepted = 0;
        let connectionClosed = 0;
        const server = new TcpServer({ port: 500, maxConnections: 5 });
        server.onConnectionAcceptedHook = () => { connectionAccepted += 1; };
        server.onConnectionCloseHook = (hadError) => { connectionClosed += 1; };

        // Start server
        const listeningPromise = onceEvent(server.coreServer, 'listening');
        server.start();
        await listeningPromise;
        assert.strictEqual(server.isListening, true);

        // Connect a client
        let conecctionPromise = onceEvent(server.coreServer, 'connection');
        let client = net.createConnection({ port: 500, host: '127.0.0.1' });
        await conecctionPromise;
        await onceEvent(client, 'connect');
        assert.strictEqual(connectionAccepted, 1);
        assert.strictEqual(server.activeConnections.length, 1);

        //Close client        
        const conecctionClosePromise = onceEvent(server.activeConnections[0], 'close');
        client.end();
        await conecctionClosePromise;
        assert.strictEqual(connectionClosed, 1);
        assert.strictEqual(server.activeConnections.length, 0);
        assert.strictEqual(server.isListening, true);

        //Second connection
        let conecctionPromise2 = onceEvent(server.coreServer, 'connection');
        let client2 = net.createConnection({ port: 500, host: '127.0.0.1' });
        await conecctionPromise2;
        await onceEvent(client2, 'connect');
        assert.strictEqual(connectionAccepted, 2);
        assert.strictEqual(server.activeConnections.length, 1);

        // Stop server
        const closePromise = onceEvent(server.coreServer, 'close');
        server.stop();
        await closePromise;
        assert.strictEqual(server.isListening, false);
    });
    
    await t.test('testing data reception and hooks', async () => {
        const server = new TcpServer({ port: 500 });
        let dataCalls = [];
        let aduCalls = [];
        server.onDataHook = (socket, data) => { dataCalls.push({ socket, data }); };
        server.onMbAduHook = (socket, data) => { aduCalls.push({ socket, data }); };    
        // Acept buffer larger than 5 bytes as valid for test
        server.validateFrame = (buffer) => buffer.length >= 5;  
        // Start server
        const listeningPromise = onceEvent(server.coreServer, 'listening');
        server.start();
        await listeningPromise;
        assert.strictEqual(server.isListening, true);

        // Connect a client
        // Connect a client        
        let conecctionPromise = onceEvent(server.coreServer, 'connection');
        let client = net.createConnection({ port: 500, host: '127.0.0.1' });
        await conecctionPromise;
        await onceEvent(client, 'connect');

        // Send data from client -> should invoke onDataHook and onMbAduHook
        let dataPromise = onceEvent(server.activeConnections[0], 'data');
        let msg = Buffer.from('hello world');
        client.write(msg);

        // allow events to propagate        
        await dataPromise;        
        assert.strictEqual(dataCalls.length, 1);
        assert.strictEqual(dataCalls[0].data.equals(msg), true);
        assert.strictEqual(aduCalls.length, 1);
        assert.strictEqual(aduCalls[0].data.equals(msg), true);

        // Send short data from client -> should invoke only onDataHook
        let shortDataPromise = onceEvent(server.activeConnections[0], 'data');
        let shortMsg = Buffer.from('hey');
        client.write(shortMsg);
        // allow events to propagate
        await shortDataPromise;        
        assert.strictEqual(dataCalls.length, 2);
        assert.strictEqual(dataCalls[1].data.equals(shortMsg), true);
        assert.strictEqual(aduCalls.length, 1); // no new ADU call

        // Stop server
        const closePromise = onceEvent(server.coreServer, 'close');
        server.stop();
        await closePromise;
        assert.strictEqual(server.isListening, false);
    });
    
    await t.test('testing server write method', async () => {
        const server = new TcpServer({ port: 500 });
        // Start server
        const listeningPromise = onceEvent(server.coreServer, 'listening');
        server.start();
        await listeningPromise;
        assert.strictEqual(server.isListening, true);

        // Connect a client
        let conecctionPromise = onceEvent(server.coreServer, 'connection');
        let client = net.createConnection({ port: 500, host: '127.0.0.1' });
        await conecctionPromise;
        await onceEvent(client, 'connect');
        assert.strictEqual(server.activeConnections.length, 1);
        
        // Test server.write: send data from server to client and assert client receives it
        const receivedByClient = [];
        const clientDataPromise = onceEvent(client, 'data');        
        client.on('data', (d) => receivedByClient.push(d));
        const response = Buffer.from('server-pong');

        // use the server-side socket reference from activeConnections pool
        const serverSocket = server.activeConnections[0];
        assert.ok(serverSocket, 'server should have at least one active socket');
        server.write(serverSocket, response);

        // wait a tick for data to be delivered
        await clientDataPromise;
        
        // Stop server
        const closePromise = onceEvent(server.coreServer, 'close');
        server.stop();
        await closePromise;
        assert.strictEqual(server.isListening, false);

        assert.strictEqual(receivedByClient.length == 1, true);
        assert.ok(receivedByClient.some((b) => b.equals(response)));
    });
    
    await t.test('testing error hook', async () => {

        const server = new TcpServer({ port: 500 });
        // Start server
        const listeningPromise = onceEvent(server.coreServer, 'listening');
        server.start();
        await listeningPromise;
        assert.strictEqual(server.isListening, true);

        // Connect a client
        let conecctionPromise = onceEvent(server.coreServer, 'connection');
        let client = net.createConnection({ port: 500, host: '127.0.0.1' });
        await conecctionPromise;
        await onceEvent(client, 'connect');

        // Test onErrorHook: emit an error on server-side socket and ensure hook invoked
        let errorSeen = null;   
        server.onErrorHook = (err) => { errorSeen = err; };
        
        // simulate error on the server socket
        const serverSocket = server.activeConnections[0];
        serverSocket.emit('error', new Error('simulated'));
        await new Promise((r) => setImmediate(r));
        assert.ok(errorSeen instanceof Error);
        // Stop server
        const closePromise = onceEvent(server.coreServer, 'close');
        server.stop();
        await closePromise;
        assert.strictEqual(server.isListening, false);
    });
    
});
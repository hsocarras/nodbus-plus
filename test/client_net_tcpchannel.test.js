const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const TcpChannel = require('../src/client/net/tcpchannel');

const DEFAULT_CFG = {
    name: 'test-tcp',
    ip: '127.0.0.1',
};


/// Helper to await a single event once
function onceEvent(emitter, event) {
    return new Promise((resolve) => {
        emitter.once(event, (...args) => resolve(args));
    });
}

test.describe('TcpChannel (node:test)', () => {

    test('constructor sets defaults and coreChannel exists', (t) => {
        const cfg = Object.assign({}, DEFAULT_CFG, { port: 15000 });
        const ch = new TcpChannel(cfg);
        assert.equal(ch.name, cfg.name);
        assert.equal(ch.ip, cfg.ip);
        assert.equal(ch.port, cfg.port);
        assert.equal(ch.tcpCoalescingDetection, false);
        assert.ok(ch.coreChannel);
        assert.equal(ch.coreChannel instanceof net.Socket, true);
        assert.equal(typeof ch.onDataHook, 'function');
    });
    
    test('connect resolves and isConnected reflects state', async () => {

        const s = net.createServer();
        s.on('error', (err) => {
            //console.error('Server error:', err);
        });
        s.on('listening', () => {
            //console.log(`Server listening on port ${s.address().port}`);
        });
        s.listen(500);
        s.on('connection', (socket) => {
            //console.log('Server: client connected');
            socket.on('end', () => {
                //console.log('Server: client disconnected');
            });
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
        });
        await onceEvent(s, 'listening');

        const cfg = Object.assign({}, DEFAULT_CFG, { port: 500 });
        const ch = new TcpChannel(cfg);        
        ch.coreChannel.on('error', (err) => {
            console.error('Client socket error:', err);
        });
        ch.connect();
        await onceEvent(ch.coreChannel, 'connect');
        // accept connection        
        assert.equal(ch.isConnected(), true);

        ch.disconnect();
        await onceEvent(ch.coreChannel, 'close');
        assert.equal(ch.isConnected(), false);        
        s.close();
        await onceEvent(s, 'close');
    });
    
    test('connect rejects when no server listening', async () => {
        // pick an ephemeral port by starting and closing a server
        const s = net.createServer();
        await new Promise((res) => s.listen(500, '127.0.0.1', res));
        const port = s.address().port;
        s.close();

        const cfg = Object.assign({}, DEFAULT_CFG, { port });
        const ch = new TcpChannel(cfg);

        await assert.rejects(() => ch.connect());
        assert.equal(ch.isConnected(), false);
    });
    
    test('write returns false when not connected', () => {
        const ch = new TcpChannel(Object.assign({}, DEFAULT_CFG, { port: 1025 }));
        const ok = ch.write(Buffer.from([0x01]));
        assert.equal(ok, false);
    });
    
    test('write sends data to real server and onWriteHook is invoked', async () => {

        // setup server and capture data
        const s = net.createServer();
        s.on('error', (err) => {
            //console.error('Server error:', err);
        });
        s.on('listening', () => {
            //console.log(`Server listening on port ${s.address().port}`);
        });
        s.listen(502);
        let received = [];
        s.on('connection', (socket) => {
            //console.log('Server: client connected');
            socket.on('end', () => {
                //console.log('Server: client disconnected');
            });
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
            socket.on('data', d => received.push(d));
        });
        await onceEvent(s, 'listening');
        
        const ch = new TcpChannel(DEFAULT_CFG);
        let connected;
        ch.onConnectHook = () => { connected = true; }; // dummy
        ch.connect();
        await onceEvent(ch.coreChannel, 'connect');
        assert.equal(connected, true);
        assert.equal(ch.isConnected(), true);
        
        let called = false;
        ch.onWriteHook = (frame) => { called = true; };        
        const frame = Buffer.from([0xAA, 0xBB, 0xCC]);
        const res = ch.write(frame);
        

        // allow data to arrive        
        await new Promise((r) => setTimeout(r, 20));   
        assert.equal(res, true);
        assert.equal(called, true);     
        assert.ok(received.length == 1);
        assert.deepEqual(received[0], frame);
        
        ch.disconnect();
        await onceEvent(ch.coreChannel, 'close');
        assert.equal(ch.isConnected(), false);
        s.close();
        await onceEvent(s, 'close');

    });
    
    test('data event triggers onDataHook and onMbAduHook (no coalescing)', async () => {
        // setup server and capture data
        const s = net.createServer();
        s.on('error', (err) => {
            //console.error('Server error:', err);
        });
        s.on('listening', () => {
            //console.log(`Server listening on port ${s.address().port}`);
        });
        s.listen(502);
        let received = [];
        s.on('connection', (socket) => {
            //console.log('Server: client connected');
            socket.on('end', () => {
                //console.log('Server: client disconnected');
            });
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
            socket.on('data', (d) => {
                socket.write(d);
                //console.log('Server received data:', d);
            });
        });
        await onceEvent(s, 'listening');

        
        const ch = new TcpChannel(DEFAULT_CFG);
        ch.connect();
        await onceEvent(ch.coreChannel, 'connect');

        let onDataCalled = false;
        let onMbCalled = false;
        ch.onDataHook = () => { onDataCalled = true; };
        ch.onMbAduHook = () => { onMbCalled = true; };
        ch.validateFrame = (frame) => { if (frame.length > 3) return true; return false; };

        const payload = Buffer.from([0x10, 0x20, 0x30, 0x40, 0x50]);
        ch.write(payload);
        await new Promise((r) => setTimeout(r, 20));

        assert.equal(onDataCalled, true);
        assert.equal(onMbCalled, true);

        ch.disconnect();
        await onceEvent(ch.coreChannel, 'close');
        s.close();
        await onceEvent(s, 'close');
    });
    
    test('tcpCoalescingDetection splits concatenated messages and triggers onMbAduHook per message', async () => {

        // setup server and capture data
        const s = net.createServer();
        s.on('error', (err) => {
            console.error('Server error:', err);
        });
        s.on('listening', () => {
            //console.log(`Server listening on port ${s.address().port}`);
        });
        s.listen(503);
        let received = [];
        s.on('connection', (socket) => {
            //console.log('Server: client connected');
            socket.on('end', () => {
                //console.log('Server: client disconnected');
            });
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
            socket.on('data', (d) => {
                socket.write(d);
                //console.log('Server received data:', d);
            });
        });
        await onceEvent(s, 'listening');

        const cfg = Object.assign({}, DEFAULT_CFG, { port: 503, tcpCoalescingDetection: true });
        const ch = new TcpChannel(cfg);
        ch.connect();
        await onceEvent(ch.coreChannel, 'connect');

        let count = 0;
        ch.onMbAduHook = () => { count += 1; };
        ch.validateFrame = (frame) => { if (frame.length > 3) return true; return false; };

        // create two simple MBAP-like messages and concatenate
        function buildMsg(transId) {
            const pdu = Buffer.from([0x03, 0x00]);
            const buf = Buffer.alloc(7 + pdu.length);
            buf.writeUInt16BE(transId, 0); // transaction
            buf.writeUInt16BE(0, 2); // protocol
            buf.writeUInt16BE(pdu.length + 1, 4); // length (unitId + pdu = 1)
            buf.writeUInt8(0x01, 6); // unit id / pdu
            return buf;
        }

        const m1 = buildMsg(1);
        const m2 = buildMsg(2);
        const combined = Buffer.concat([m1, m2]);

        ch.write(combined);
        await new Promise((r) => setTimeout(r, 20));

        assert.equal(count, 2);

        ch.disconnect();
        await onceEvent(ch.coreChannel, 'close');
        s.close();
        await onceEvent(s, 'close');
    });
    
});
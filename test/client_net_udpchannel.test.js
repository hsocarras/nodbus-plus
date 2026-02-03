const test = require('node:test');
const assert = require('node:assert/strict');
const dgram = require('node:dgram');
const UdpChannel = require('../src/client/net/udpchannel');

/// Helper to await a single event once
function onceEvent(emitter, event) {
    return new Promise((resolve) => {
        emitter.once(event, (...args) => resolve(args));
    });
}


test('constructor applies defaults and creates coreChannel with hooks', () => {
    const ch = new UdpChannel({});    
    assert.ok(ch);
    assert.ok(ch.coreChannel);
    assert.equal(ch.coreChannel instanceof dgram.Socket, true);
    assert.equal(ch.name, 'udp');
    assert.equal(ch.ip, '127.0.0.1');
    assert.equal(ch.port, 502);
    assert.equal(ch.tcpCoalescingDetection, false);
    assert.equal(ch.coreChannel.type, 'udp4');
    assert.equal(typeof ch.onMbAduHook, 'function');
    assert.equal(typeof ch.onDataHook, 'function');
    assert.equal(typeof ch.onConnectHook, 'function');
    assert.equal(typeof ch.onErrorHook, 'function');
    assert.equal(typeof ch.onCloseHook, 'function');
    assert.equal(typeof ch.onWriteHook, 'function');
    assert.equal(typeof ch.validateFrame, 'function');
});

test('connect/disconnect with real UDP server', async () => {
    const srv = dgram.createSocket('udp4');
    srv.on('error', (err) => {
        console.error(`Server error:\n${err.stack}`);
        srv.close();
    });
    srv.on('close', () => {
        //console.log('Server closed');
    });
    srv.on('listening', () => {
        //console.log(`Server listening ${JSON.stringify(srv.address())}`);
    });
    srv.bind(505, '127.0.0.1');
    await onceEvent(srv, 'listening');
    const port = srv.address().port;
    
    const ch = new UdpChannel({ ip: '127.0.0.1', port, udpType: 'udp4' });
    let connected = false;
    ch.onConnectHook = () => { connected = true; };
    let closed = false;
    ch.onCloseHook = () => { closed = true; };
    
    
    connPromise = ch.connect();
    await connPromise;
    assert.equal(connected, true);
    assert.equal(ch.isConnected(), true);
    ch.disconnect();
    await onceEvent(ch.coreChannel, 'close');
    assert.equal(closed, true);
    assert.equal(ch.isConnected(), false);
        
    srv.close();
    await onceEvent(srv, 'close');
});

test('write sends to server and triggers hooks', async () => {
    const received = [];
    const srv = dgram.createSocket('udp4');
    srv.on('error', (err) => {
        console.error(`Server error:\n${err.stack}`);
        srv.close();
    });
    srv.on('close', () => {
        //console.log('Server closed');
    });
    srv.on('listening', () => {
        //console.log(`Server listening ${JSON.stringify(srv.address())}`);
    });
    srv.on('message', (msg, rinfo) => {
        //console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
        received.push(msg);
        //echo
        srv.send(msg, rinfo.port, rinfo.address);
    });
    srv.bind(502, '127.0.0.1');
    await onceEvent(srv, 'listening');
    const port = srv.address().port;
    
    const ch = new UdpChannel();    
    let writed = [];
    let datas = [];
    let mb = [];
    const onMb = function (frame) {
        //console.log(`onMbAduHook: received MB ADU of ${frame.length} bytes`);
        mb.push(frame);
    };
    const onWrite = function (frame) {
        //console.log(`onWriteHook: wrote ${frame.length} bytes`);
        writed.push(frame);
    };
    const onData = function (data) {
        datas.push(data);
    };
    ch.onWriteHook = onWrite;
    ch.onDataHook = onData;
    ch.onMbAduHook = onMb;
    ch.validateFrame = (frame) => { if (frame.length > 5) return true; else return false;};
    
    await ch.connect();
    let frame = Buffer.from([0xAA, 0xBB, 0xCC]);
    const res = ch.write(frame);
    assert.equal(res, true);
    await new Promise(r => setTimeout(r, 50));
    
    assert.equal(received.length == 1, true);
    assert.equal(datas.length == 1, true);
    assert.equal(mb.length == 0, true); //frame too short for validateFrame
    assert.equal(writed.length == 1, true);
    assert.deepEqual(received[0], frame);
    assert.deepEqual(writed[0], frame);
    
    frame = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
    ch.write(frame);
    await new Promise(r => setTimeout(r, 50));
    assert.equal(received.length == 2, true);
    assert.equal(datas.length == 2, true);
    assert.equal(mb.length == 1, true);
    assert.equal(writed.length == 2, true);
    assert.deepEqual(received[1], frame);
    assert.deepEqual(mb[0], frame);
    assert.deepEqual(writed[1], frame);
    
    await ch.disconnect();
    srv.close();
    await onceEvent(srv, 'close');
});

test('resolveTcpCoalescing splits concatenated TCP ADUs correctly', () => {
    const ch = new UdpChannel({ tcpCoalescingDetection: true });
    const makeMsg = (txId) => {
        const mbap = Buffer.alloc(7);
        mbap.writeUInt16BE(txId, 0);
        mbap.writeUInt16BE(0x0000, 2);
        mbap.writeUInt16BE(3, 4);
        mbap.writeUInt8(0x11, 6);
        const pdu = Buffer.from([0x03 , 0x00]);
        return Buffer.concat([mbap, pdu]);
    };
    const m1 = makeMsg(0x0001);
    const m2 = makeMsg(0x0002);
    const coalesced = Buffer.concat([m1, m2]);

    const parts = ch.resolveTcpCoalescing(coalesced);
    assert.ok(Array.isArray(parts));
    assert.equal(parts.length, 2);
    assert.equal(parts[0].length, m1.length);
    assert.equal(parts[1].length, m2.length);
    assert.equal(parts[0].readUInt16BE(0), 0x0001);
    assert.equal(parts[1].readUInt16BE(0), 0x0002);
});

test('tcpCoalescingDetection true processes concatenated messages sent by server', async () => {
    const received = [];
    const srv = dgram.createSocket('udp4');
    srv.on('error', (err) => {
        console.error(`Server error:\n${err.stack}`);
        srv.close();
    });
    srv.on('close', () => {
        //console.log('Server closed');
    });
    srv.on('listening', () => {
        //console.log(`Server listening ${JSON.stringify(srv.address())}`);
    });
    srv.on('message', (msg, rinfo) => {
        //console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
        received.push(msg);
        //echo
        srv.send(msg, rinfo.port, rinfo.address);
    });
    srv.bind(502, '127.0.0.1');
    await onceEvent(srv, 'listening');
    const port = srv.address().port;

    const cfg = { ip: '127.0.0.1', port, tcpCoalescingDetection: true, udpType: 'udp4' };
    const ch = new UdpChannel(cfg);

    let writed = [];
    let datas = [];
    let mb = [];
    const onMb = function (frame) {
        //console.log(`onMbAduHook: received MB ADU of ${frame.length} bytes`);
        mb.push(frame);
    };
    const onWrite = function (frame) {
        //console.log(`onWriteHook: wrote ${frame.length} bytes`);
        writed.push(frame);
    };
    const onData = function (data) {
        datas.push(data);
    };
    ch.onWriteHook = onWrite;
    ch.onDataHook = onData;
    ch.onMbAduHook = onMb;
    ch.validateFrame = (frame) => { if (frame.length > 5) return true; else return false;};
    await ch.connect();

    const makeMsg = (txId, pduByte) => {
        const mbap = Buffer.alloc(7);
        mbap.writeUInt16BE(txId, 0);
        mbap.writeUInt16BE(0x0000, 2);
        const lengthField = 2;
        mbap.writeUInt16BE(lengthField, 4);
        mbap.writeUInt8(0x11, 6);
        const pdu = Buffer.from([pduByte]);
        return Buffer.concat([mbap, pdu]);
    };

    const m1 = makeMsg(1, 0x05);
    const m2 = makeMsg(2, 0x06);
    const coalesced = Buffer.concat([m1, m2]);

    const clientAddr = ch.coreChannel.address();
    srv.send(coalesced, clientAddr.port, clientAddr.address);

    await new Promise(r => setTimeout(r, 50));

    assert.equal(datas.length == 1, true);  
    assert.deepEqual(datas[0], coalesced);  
    assert.equal(mb.length == 2, true);
    assert.deepEqual(mb[0], m1);
    assert.deepEqual(mb[1], m2);

    await ch.disconnect();
    srv.close();
    await onceEvent(srv, 'close');
});
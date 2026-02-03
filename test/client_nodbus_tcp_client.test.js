
const test = require('node:test');
const assert = require('node:assert/strict');
const Nodbus = require('../src/nodbus-plus');

// Helper to await a one-time event
function onceEvent(emitter, event) {
    return new Promise((resolve) => emitter.once(event, (...args) => resolve(args)));
}

// Server configurations
const serverCfg = {
    inputs: 524,
    coils: 100,
    holdingRegisters: 512,
    inputRegisters: 256,
    udpType: 'udp6',
    port: 0, // let OS pick an available port
};

const serverCfg2 = {
    inputs: 524,
    coils: 100,
    holdingRegisters: 512,
    inputRegisters: 256,
    udpType: 'udp4',
    port: 0,
};

test.describe('NodbusTcpClient (integration)', () => {

    test('tcp client performs full request/response sequence', async () => {
        const server = Nodbus.createTcpServer('tcp', Object.assign({}, serverCfg));
        const client = Nodbus.createTcpClient();

        // wait for server to start
        server.on('data', (sock, data) => {
            // echo back data as response
            //console.log('Server received data for processing:', data);
        });
        server.start();
        await onceEvent(server, 'listening');
        const currentport = server.port;

        client.addChannel('server1', 'tcp1', { ip: '127.0.0.1', port: currentport });

        let tCounter = 0;

        const regs = Buffer.alloc(6);
        let temp = Buffer.alloc(2);
        temp.writeUInt16BE(123);
        client.setWordToBuffer(temp, regs, 0);
        temp.writeUInt16BE(1234);
        client.setWordToBuffer(temp, regs, 1);
        
        client.on('error', (err) => {
            console.error('Client error:', err);
        });
        client.on('data', (endpoint, data) => {
            //console.log('Client received data:', data);
        });

        client.on('transaction', (req, res) => {
            const reqId = req.readUInt16BE(0);
            const resId = res.readUInt16BE(0);
            const unitId = req[6];
            const functionCode = req[7];
            assert.equal(reqId, resId);
            assert.equal(unitId, 255);
            
            switch (functionCode) {
                case 0x01:
                    assert.equal(res.length, 10);
                    tCounter++;
                    client.readInputs('server1', 255, 0, 2);
                    break;
                case 0x02:
                    assert.equal(res.length, 10);
                    tCounter++;
                    client.readHoldingRegisters('server1', 255, 0, 2);
                    break;
                case 0x03:
                    assert.equal(res.length, 13);
                    tCounter++;
                    client.readInputRegisters('server1', 255, 0, 2);
                    break;
                case 0x04:
                    assert.equal(res.length, 13);
                    tCounter++;
                    client.forceSingleCoil(true, 'server1', 255, 5);
                    break;
                case 0x05:
                    assert.equal(res.length, 12);
                    assert.equal(res[10], 0xFF);
                    tCounter++;
                    const valBuffer = Buffer.from([0x00, 0x45]);
                    client.presetSingleRegister(valBuffer, 'server1', 255, 10);
                    break;
                case 0x06:
                    assert.equal(res.length, 12);
                    assert.equal(res[9], 10);
                    assert.equal(res[11], 0x45);
                    tCounter++;
                    const coils = [1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0];
                    client.forceMultipleCoils(coils, 'server1', 255, 12);
                    break;
                case 0x0f:
                    assert.equal(res.length, 12);
                    assert.equal(res[11], 12);
                    tCounter++;
                    client.presetMultiplesRegisters(regs, 'server1', 255, 20);
                    break;
                case 0x10:                    
                    assert.equal(res.length, 12);
                    assert.equal(res[11], 3);
                    tCounter++;
                    const registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
                    client.maskHoldingRegister(registerMask, 'server1', 255, 22);
                    break;
                case 0x16:
                    assert.equal(res.length, 14);
                    assert.equal(res[9], req[9]);
                    assert.equal(res[11], req[11]);
                    assert.equal(res[13], req[13]);
                    tCounter++;
                    client.readWriteMultiplesRegisters(regs, 'server1', 255, 10, 3, 20);
                    break;
                case 0x17:                    
                    assert.equal(res.length, 15);
                    assert.equal(res[8], 6);
                    tCounter++;
                    // after final transaction disconnect
                    client.disconnect('server1');
                    break;
                default:
                    client.disconnect('server1');
            }
        });

        client.on('connection', (id) => {
            assert.equal(id, 'server1');
            assert.equal(client.isChannelReady('server1'), true);
            // start sequence of requests
            client.readCoils('server1', 255, 0, 2);
        });

        // connect
        client.connect('server1');

        // wait for client disconnect and server to close
        await onceEvent(client, 'connection-closed');
        server.stop();
        await onceEvent(server, 'closed');

        // should have seen all expected transactions
        assert.equal(tCounter, 10);
    });
    
    test('udp client performs full request/response sequence', async () => {
        const server = Nodbus.createTcpServer('udp4', serverCfg2);
        const client = Nodbus.createTcpClient();
        
        server.on('listening', (port) => {
            //const address = server.coreServer.address();
            console.log(`UDP Server listeninggggg on port ${server.port}`);
        });
        server.on('error', (err) => {
            console.error('Server error:', err);
        });
        // wait for server to start
        server.start();
        await onceEvent(server, 'listening');
        const currentPort = server.port;

        client.addChannel('server2', 'udp1', { ip: '127.0.0.1', port:currentPort, udpType: 'udp4' });

        let tCounter = 0;

        const regs = Buffer.alloc(6);
        let temp = Buffer.alloc(2);
        temp.writeUInt16BE(123);
        client.setWordToBuffer(temp, regs, 0);
        temp.writeUInt16BE(1234);
        client.setWordToBuffer(temp, regs, 1);

        client.on('transaction', (req, res) => {
            const reqId = req.readUInt16BE(0);
            const resId = res.readUInt16BE(0);
            const unitId = req[6];
            const functionCode = req[7];

            assert.equal(reqId, resId);
            assert.equal(unitId, 255);

            switch (functionCode) {
                case 0x01:
                    assert.equal(res.length, 10);
                    tCounter++;
                    client.readInputs('server2', 255, 0, 2);
                    break;
                case 0x02:
                    assert.equal(res.length, 10);
                    tCounter++;
                    client.readHoldingRegisters('server2', 255, 0, 2);
                    break;
                case 0x03:
                    assert.equal(res.length, 13);
                    tCounter++;
                    client.readInputRegisters('server2', 255, 0, 2);
                    break;
                case 0x04:
                    assert.equal(res.length, 13);
                    tCounter++;
                    client.forceSingleCoil(true, 'server2', 255, 5);
                    break;
                case 0x05:
                    assert.equal(res.length, 12);
                    assert.equal(res[10], 0xFF);
                    tCounter++;
                    const valBuffer = Buffer.from([0x00, 0x45]);
                    client.presetSingleRegister(valBuffer, 'server2', 255, 10);
                    break;
                case 0x06:
                    assert.equal(res.length, 12);
                    assert.equal(res[9], 10);
                    assert.equal(res[11], 0x45);
                    tCounter++;
                    const coils = [1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0];
                    client.forceMultipleCoils(coils, 'server2', 255, 12);
                    break;
                case 0x0f:
                    assert.equal(res.length, 12);
                    assert.equal(res[11], 12);
                    tCounter++;
                    client.presetMultiplesRegisters(regs, 'server2', 255, 20);
                    break;
                case 0x10:                    
                    assert.equal(res.length, 12);
                    assert.equal(res[11], 3);
                    tCounter++;
                    const registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
                    client.maskHoldingRegister(registerMask, 'server2', 255, 22);
                    break;
                case 0x16:
                    assert.equal(res.length, 14);
                    assert.equal(res[9], req[9]);
                    assert.equal(res[11], req[11]);
                    assert.equal(res[13], req[13]);
                    tCounter++;
                    client.readWriteMultiplesRegisters(regs, 'server2', 255, 10, 3, 20);
                    break;
                case 0x17:                    
                    assert.equal(res.length, 15);
                    assert.equal(res[8], 6);
                    tCounter++;
                    // after final transaction disconnect
                    client.disconnect('server2');
                    break;
                default:
                    client.disconnect('server2');
            }
        });

        client.on('connection', (id) => {
            assert.equal(id, 'server2');
            assert.equal(client.isChannelReady('server2'), true);
            console.log('Client connected to server2');
            client.readCoils('server2', 255, 0, 2);            
        });

        // connect and run
        client.connect('server2');

        await onceEvent(client, 'connection-closed');
        server.stop();
        await onceEvent(server, 'closed');
        assert.equal(tCounter, 10);
    });
    
});
const test = require('node:test');
const assert = require('node:assert/strict');
const Nodbus = require('../src/nodbus-plus');
const { on } = require('node:events');

/// Helper to await a single event once
function onceEvent(emitter, event) {
    return new Promise((resolve) => {
        emitter.once(event, (...args) => resolve(args));
    });
}

test.describe('NodbusSerialClient (RTU Mode)', () => {
    
    test('Construction and defaults', () => {
        const client = Nodbus.createSerialClient();
        const NodbusSerialClient = require('../src/client/nodbus_serial_client.js')
        assert.ok(client instanceof NodbusSerialClient);
        assert.equal(client.channels.size, 0);
        // default hooks and validateFrame
        client.addChannel('test', 'serial1', { port: 'COM1' });
        assert.equal(client.channels.size, 1);
        const ch = client.channels.get('test');
        const SerialChannel = require('../src/client/net/serialchannel')
        assert.ok(ch instanceof SerialChannel);
        assert.equal(typeof ch.onMbAduHook, 'function');
        assert.equal(typeof ch.onDataHook, 'function');
        assert.equal(typeof ch.onConnectHook, 'function');
        assert.equal(typeof ch.onErrorHook, 'function');
        assert.equal(typeof ch.onCloseHook, 'function');
        assert.equal(typeof ch.onWriteHook, 'function');

        assert.equal(client.isIdle, true);
    });
    
    test.describe('basic connection and requests', () => {
        
        test('connects to server and performs read coils request', async () => {

            const serverCfg = {
                inputs: 524,
                coils: 0,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 0, // RTU mode
                port: 0, // Random port
            };

            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();

            let transactionCount = 0;
            let lastFunctionCode = null;

            // Set up server            
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;

            // Set up client
            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });
            const channel = client.channels.get('server');
            client.on('error', (id, err) => {
                console.error(`Client error on channel ${id}:`, err);
            });
            assert.ok(channel);
            assert.equal(channel.isConnected(), false);
            
            let connectionEventFired = false;
            client.on('connection', (id) => {
                connectionEventFired = true;
                assert.equal(id, 'server');
                assert.equal(client.isChannelReady('server'), true);
            });

            client.on('transaction', (req, res) => {
                transactionCount++;
                lastFunctionCode = req[1];
                if (transactionCount === 1) {
                    assert.equal(lastFunctionCode, 0x01); // Read coils
                }
            });
            ;
            // Connect and start first request
            client.connect('server');
            await onceEvent(client, 'connection');
            assert.equal(connectionEventFired, true);
            assert.equal(channel.isConnected(), true);

            client.readCoils('server', 1, 0, 2);
            
            // Wait for transaction and cleanup
            await onceEvent(client, 'transaction');
            assert.ok(transactionCount > 0);
            client.disconnect('server');
            await onceEvent(client, 'connection-closed');
            assert.equal(channel.isConnected(), false);
            server.stop();
            await onceEvent(server, 'closed');


        });
        
        test('performs multiple function codes in sequence', async () => {
            const serverCfg = {
                inputs: 524,
                coils: 2,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 0,
                port: 0,
            };
            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();
            server.on('response', (sock, adu) => {
                //console.log('Server response ADU:', adu);
            });
            const functionCodesReceived = [];

            // Set up server
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;


            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });

            client.on('connection', (id) => {
                // Start sequence of requests
                client.readCoils('server', 1, 0, 2);
            });

            client.on('transaction', (req, res) => {
                const fc = req[1];
                functionCodesReceived.push(fc);
                switch (fc) {
                    case 0x01: // Read coils                        
                        client.readInputs('server', 1, 0, 2);
                        break;
                    case 0x02: // Read inputs                        
                        client.readHoldingRegisters('server', 1, 0, 2);
                        break;
                    case 0x03: // Read holding registers                        
                        client.readInputRegisters('server', 1, 0, 2);
                        break;
                    case 0x04: // Read input registers                        
                        client.disconnect('server');
                        break;
                }

            });

            client.connect('server');
            await onceEvent(client, 'connection-closed');
            assert.equal(functionCodesReceived.length, 4);
            assert.deepEqual(functionCodesReceived, [0x01, 0x02, 0x03, 0x04]);
            server.stop();
            await onceEvent(server, 'closed');

        });
        
        test('handles write operations (force single coil)', async () => {
            const serverCfg = {
                inputs: 524,
                coils: 100,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 0,
                port: 0,
            };

            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();

            const transactionFCs = [];

            // Set up server
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;            
            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });

            client.on('connection', (id) => {
                client.readCoils('server', 1, 0, 2);
            });

            client.on('transaction', (req, res) => {
                const fc = req[1];
                transactionFCs.push(fc);

                if (fc === 0x01) {
                    // After read coils, send force single coil
                    client.forceSingleCoil(true, 'server', 1, 5);
                } else if (fc === 0x05) {
                    // After force single coil, disconnect
                    client.disconnect('server');
                }
            });

            client.connect('server');
            await onceEvent(client, 'connection-closed');    
            assert.ok(transactionFCs.includes(0x01)); // Read coils
            assert.ok(transactionFCs.includes(0x05)); // Force single coil
            server.stop();
            await onceEvent(server, 'closed');
        });
        
        test('handles register operations (preset single register)', async () => {
            const serverCfg = {
                inputs: 524,
                coils: 0,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 0,
                port: 0,
            };

            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();

            const transactionFCs = [];

            // Set up server
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;
            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });

            client.on('connection', () => {
                client.readHoldingRegisters('server', 1, 0, 2);
            });

            client.on('transaction', (req, res) => {
                const fc = req[1];
                transactionFCs.push(fc);

                if (fc === 0x03) {
                    // After read holding registers, preset single register
                    const valBuffer = Buffer.alloc(2);
                    valBuffer.writeUInt16BE(0x1234);
                    client.presetSingleRegister(valBuffer, 'server', 1, 10);
                } else if (fc === 0x06) {
                    // After preset, disconnect
                    client.disconnect('server');
                }
            });

            client.connect('server');
            await onceEvent(client, 'connection-closed');
            assert.ok(transactionFCs.includes(0x03)); // Read holding registers
            assert.ok(transactionFCs.includes(0x06)); // Preset single register
            server.stop();
            await onceEvent(server, 'closed');
        });
    });
    
    test.describe('error handling', () => {
        test('handles connection error when server is not available', async () => {
            const client = Nodbus.createSerialClient();
            client.on('error', (id, err) => {
                //console.log(`Client error on channel ${id}:`, err);
            });
            client.addChannel('unavailable', 'tcp', { ip: '127.0.0.1', port: 9999 });

            let connectionErrorFired = false;
            

            
            const connectPromises = client.connect('unavailable');
            connectPromises.then(null,(conn) => {                connectionErrorFired = true;
                assert.equal(conn.ip, '127.0.0.1');
                assert.equal(conn.port, 9999);
            });

            await new Promise((r) => setTimeout(r, 100));
            assert.equal(connectionErrorFired, true);
            assert.equal(client.isChannelReady('unavailable'), false);
        });
    });
});

test.describe('NodbusSerialClient (ASCII Mode)', () => {
    
    test.describe('basic connection and requests in ASCII mode', () => {

        test('connects to server in ASCII mode and performs requests', async () => {
            const serverCfg = {
                inputs: 524,
                coils: 0,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 1, // ASCII mode
                port: 0,
            };

            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();

            let transactionCount = 0;
            let lastFunctionCode = null;
            
            // Set up server
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;            
            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });

            client.on('connection', (id) => {
                assert.equal(id, 'server');
                assert.equal(client.isChannelReady('server'), true);
                client.readCoils('server', 1, 0, 2, true); // true for ASCII mode                
            });

            client.on('transaction', (req, res) => {
                transactionCount++;
                lastFunctionCode = req[2];
                
                if (transactionCount === 1) {
                    assert.equal(lastFunctionCode, 49); // Read coils  character 1
                    assert.equal(res[0], 0x3A);                  
                }
            });

            client.connect('server');
            await onceEvent(client, 'connection');

            // Wait for completion            
            await onceEvent(client, 'transaction');
            assert.equal(transactionCount, 1);
            client.disconnect('server');
            await onceEvent(client, 'connection-closed');
            assert.equal(client.isChannelReady('server'), false);
            server.stop();
            await onceEvent(server, 'closed');
            
        });
        
        test('performs multiple operations in ASCII mode', async () => {
            const serverCfg = {
                inputs: 524,
                coils: 100,
                holdingRegisters: 512,
                inputRegisters: 256,
                transmitionMode: 1,
                port: 0,
            };

            const server = Nodbus.createSerialServer('tcp', serverCfg);
            const client = Nodbus.createSerialClient();

            const functionCodesReceived = [];

            // Set up server
            server.start();
            await onceEvent(server, 'listening');
            const currentPort = server.port;            
            client.addChannel('server', 'tcp', { ip: '127.0.0.1', port: currentPort });
            client.on('connection', (id) => {
                assert.equal(id, 'server');
                assert.equal(client.isChannelReady('server'), true);
                client.readCoils('server', 1, 0, 2, true);
            });

            client.on('transaction', (req, res) => {
                const fc = client.aduAsciiToRtu(req)[1];
                functionCodesReceived.push(fc);
                if (functionCodesReceived.length <= 3) {
                    switch (fc) {
                        case 0x01:                            
                            client.readInputs('server', 1, 0, 2, true);
                            break;
                        case 0x02:                            
                            client.forceSingleCoil(true, 'server', 1, 5, true);
                            break;
                        case 0x05:
                            client.disconnect('server');
                            break;
                    }
                }
            });

            client.connect('server');

            // Wait for completion
            await onceEvent(client, 'connection-closed');
            assert.equal(functionCodesReceived.length, 3);
            assert.deepEqual(functionCodesReceived, [0x01, 0x02, 0x05]);
            assert.equal(client.isChannelReady('server'), false);
            server.stop();
            await onceEvent(server, 'closed');            
        });
        
    });
    
});

test.describe("ascii client", () => {

    let serverCfg2 = {
        inputs: 524,
        coils: 100,
        holdingRegisters: 512,
        inputRegisters: 256,
        transmitionMode: 1, // ASCII mode
        port: 522,
    };

    let server2 = Nodbus.createSerialServer('tcp', serverCfg2);      
    let client = Nodbus.createSerialClient();
    client.addChannel('server2', 'tcp1', {ip:'127.0.0.1', port: 522})
    assert.equal(client.isChannelReady('server2'),false);
    
    test("functions", async () => {

        assert.equal(client.isChannelReady('server2'),false);       

        client.on('transaction', (req, res) =>{
            let reqAddress = req[0];
            let resAddress = res[0];           
            let functionCode = req[1];
            let valBuffer  = Buffer.alloc(2);
            
           assert.equal(reqAddress, resAddress);
            
           
            switch(functionCode){
                case 0x01:                    
                    assert.equal(res.length, 6);
                    client.readInputs('server2', 1, 0, 2, true);                                        
                    break;
                case 0x02:
                    assert.equal(res.length, 6);
                    client.readHoldingRegisters('server2', 1, 0, 2, true);                 
                    break
                case 0x03:
                    assert.equal(res.length, 9);
                    client.readInputRegisters('server2', 1, 0, 2, true);                    
                    break
                case 0x04:
                    assert.equal(res.length, 9);
                    client.forceSingleCoil(true, 'server2', 1, 5, true);
                    break;
                case 0x05:
                    assert.equal(res.length, 8);
                    assert.equal(res[3], 5);
                    assert.equal(res[5], 0xFF);
                    valBuffer[0] = 0x00;                    
                    valBuffer[1] = 0x45;
                    client.presetSingleRegister(valBuffer, 'server2', 1, 10, true);                    
                    break;
                case 0x06:
                    assert.equal(res.length, 8)
                    assert.equal(res[3], 6);
                    assert.equal(res[5], 0x00);
                    client.readCoils('server2', 1, 0, 12, true); 
                    break;
                    assert.equal(res[5], 0x45);
                    let coils = [1, 1, 0, 0 , 1, 0, 0, 0, 1, 1, 1, 0];
                    client.forceMultipleCoils(coils, 'server2', 1, 12, true); 
                    break
                case 0x0f:
                    assert.equal(res.length, 8);
                    assert.equal(res[5], 12);
                    valBuffer = Buffer.alloc(5);
                    let tempRegister = Buffer.alloc(2);
                    tempRegister.writeUint16BE(123);
                    client.setWordToBuffer(tempRegister, valBuffer, 0);
                    tempRegister.writeUint16BE(1234);
                    client.setWordToBuffer(tempRegister, valBuffer, 1);
                    client.presetMultiplesRegisters(valBuffer, 'server2', 1, 20, true);
                    break;
                case 0x10:
                    assert.equal(res.length, 8)                   
                    assert.equal(res[5], 2);
                    registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
                    client.maskHoldingRegister(registerMask, 'server2', 1, 22, true);   
                    break;
                case 0x16:
                    assert.equal(res.length, 10)                   
                    assert.equal(res[3], req[3]);
                    assert.equal(res[5], req[5]);
                    assert.equal(res[7], req[7]);
                    client.readWriteMultiplesRegisters(valBuffer, 'server2', 1, 10, 3, 20, true);
                    break
                case 0x17:
                    assert.equal(res.length, 11)                   
                    assert.equal(res[2], 6);                    
                    client.disconnect('server2');
                    break;
                default:
                    client.disconnect('server2');
            }

           
        })

        client.on('connection-closed', ()=>{
            //console.log('stopping server')
            server2.stop()
        })

        client.on('connection', (id)=>{
            //console.log('client connected')
            let channel = client.channels.get(id);
            assert.ok(channel);                
            assert.equal(channel.ip, '127.0.0.1');
            assert.equal(channel.port, 522);
            assert.equal(client.isChannelReady(id), true);
            
            client.readCoils('server2', 1, 0, 2, true);
            
            
        })

        server2.on('listening', (port)=>{
            //console.log('server listenning')
            let connectPromise = client.connect('server2');
        })
        
       
        server2.on('closed', ()=>{
            assert.equal(server2.isListening, false);            
        })

        server2.on('connection', (sock)=>{
            //console.log('server say connection')
        })

        server2.on('data', (sock, data) => {
           // console.log(data)
        })

        server2.on('write', (sock, data)=>{
           // console.log(data)
        })

        server2.start(); 
        await onceEvent(server2, 'closed');        

    });        
    
});


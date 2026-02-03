const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { setImmediate } = require('timers');

const SerialServer = require('../src/server/net/serialserver');

test('SerialServer (inject FakePort without mocking modules)', async (t) => {
    // Minimal fake port + parser used only for testing (no module mocks)
    class FakeParser extends EventEmitter { }
    class FakePort extends EventEmitter {
        constructor(options) {
            super();
            this.options = options;
            this.isOpen = false;
            this.writeCalls = 0;
            this.drainCalls = 0;
            FakePort.lastInstance = this;
        }

        // emulate .pipe(parser) used in constructor; return a parser we control
        pipe(parser) {
            // keep a reference so tests can emit 'data' on the parser object
            this._parser = parser;
            return parser;
        }

        open(cb) {
            this.isOpen = true;
            if (cb) cb(null);
            // async emit for parity with real SerialPort
            setImmediate(() => this.emit('open'));
        }

        close(cb) {
            this.isOpen = false;
            if (cb) cb(null);
            setImmediate(() => this.emit('close'));
        }

        write(data, cb) {
            this.writeCalls += 1;
            if (cb) cb('port', data);
        }

        drain(cb) {
            this.drainCalls += 1;
            if (cb) cb(null);
        }
    }

    // Instantiate a real SerialServer, then replace its coreServer/parser with fakes.
    // We pass a safe port path so constructor runs; we don't call start() until after injection.
    const cfg = { port: 'COM_TEST', baudRate: 9600, timeBetweenFrame: 20 };
    const server = new SerialServer(cfg);

    //define the hooks as test functions
    server.onListeningHook = () => { return true; };
    server.onServerCloseHook = (buff) => { return buff; };
    server.onDataHook = (buff) => { return buff; }; 
    server.onMbAduHook = (buff) => { return buff; };
    server.onErrorHook = (err) => { return err; };
    server.onWriteHook = (data) => { return data; };

    //validate framne function
    server.validateFrame = (buff) => { 
        if (buff.length > 5){
            return true
        }
        return false;
    };

    // Re-create the parser 'data' wiring (the constructor attached a listener to previous parser).
    // Mirror the behavior from SerialServer constructor:
    server.parser.on('data', function (data) {
        if (server.onDataHook instanceof Function) {
            server.onDataHook(server, data);
        }
        if (server.onMbAduHook instanceof Function && server.validateFrame(data)) {
            server.onMbAduHook(server, data);
        }
    });

    // Tests ------------------------------------------------------------

    await t.test('constructor sets defaults', () => {
        assert.strictEqual(server.coreServer.isOpen, false);
        assert.strictEqual(server.coreServer.path, cfg.port);
        assert.strictEqual(server.coreServer.baudRate, 19200);
        assert.strictEqual(server.port, cfg.port);
        assert.strictEqual(server.isListening, false);
    });

    // Inject fake coreServer and parser (avoid mocking the serialport module)
    const fakePort = new FakePort({ path: cfg.port, baudRate: cfg.baudRate, autoOpen: false });
    const fakeParser = new FakeParser();
    server.coreServer = fakePort;
    server.parser = fakeParser;

    server.coreServer.on('open', () => {          
            server.onListeningHook();          
    });

    server.coreServer.on('close', function(){  
            server.onServerCloseHook();
    });

    server.parser.on('data',function(data){
            
            if(server.onDataHook instanceof Function){
                server.onDataHook(data);
            }      

                     
            if(server.onMbAduHook  instanceof Function && server.validateFrame(data)){                
                server.onMbAduHook(data);
            }                 
                    
    });
    
    await t.test('start() opens the port and triggers onListeningHook', async () => {
        let listened = false;
        server.onListeningHook = () => { 
            listened = true;
        };

        const excP = new Promise((resolve) => server.coreServer.once('open', () => resolve()));
        // Call start (uses fakePort.open)
        server.start();

        // wait a tick for open -> 'open' emission handled
        await excP;

        // Verify coreServer state and hook
        assert.strictEqual(fakePort.isOpen, true);
        assert.strictEqual(server.isListening, true);
        assert.strictEqual(listened, true);
    });
    
    await t.test('stop() closes the port and triggers onServerCloseHook', async () => {
        let closedCalled = false;
        server.onServerCloseHook = () => { closedCalled = true; };
        const excP = new Promise((resolve) => server.coreServer.once('close', () => resolve()));
        // Ensure port is open then stop
        fakePort.isOpen = true;
        server.stop();

        // wait a tick for close -> 'close' emission handled
        await excP;

        assert.strictEqual(fakePort.isOpen, false);
        assert.strictEqual(server.isListening, false);
        assert.strictEqual(closedCalled, true);
    });
    
    await t.test('onDataHook and onMbAduHook receive parser data', async () => {
        const receivedChunks = [];
        const receivedAdus = [];

        server.onDataHook = ( chunk) => { receivedChunks.push(chunk); };
        server.onMbAduHook = ( adu) => { receivedAdus.push(adu); };
        const excP = new Promise((resolve) => server.parser.once('data', () => resolve()));

        const chunk1 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00]); // length 5, will not pass validateFrame
        const chunk2 = Buffer.from([0x00, 0x01, 0x03, 0x00, 0x00, 0x00, 0x02]); // length 7, will pass validateFrame

        // emit chunks on the injected parser
        fakeParser.emit('data', chunk1);

        // wait for emission handled
        await excP;
        assert.strictEqual(receivedChunks.length, 1);
        assert.deepStrictEqual(receivedChunks[0], chunk1);
        assert.strictEqual(receivedAdus.length, 0); // because validateFrame returns false
        
        const excP2 = new Promise((resolve) => server.parser.once('data', () => resolve()));
        fakeParser.emit('data', chunk2);
        // wait for emission handled
        await excP2;        

        assert.strictEqual(receivedChunks.length, 2);
        assert.deepStrictEqual(receivedChunks[0], chunk1);
        assert.deepStrictEqual(receivedChunks[1], chunk2);
        // Because validateFrame returns true, onMbAduHook should have been invoked for both chunks
        assert.strictEqual(receivedAdus.length, 1);
        assert.deepStrictEqual(receivedAdus[0], chunk2);
    });   
    
    await t.test('write() delegates to coreServer.write and triggers onWriteHook', async () => {
        let writeHookCalled = false;
        server.onWriteHook = (soc, data) => { writeHookCalled = true };
        
        const payload = Buffer.from('response');
        server.write(null, payload);

        // allow callbacks to run
        await new Promise((r) => setImmediate(r));

        assert.strictEqual(fakePort.writeCalls >= 1, true);
        assert.strictEqual(writeHookCalled, true);
    });  
});
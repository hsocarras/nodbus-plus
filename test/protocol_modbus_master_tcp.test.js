
const test = require('node:test');
const assert = require('node:assert/strict');

const { ModbusTcpClient } = require('../src/nodbus-plus.js');
const { EventEmitter } = require('events');

test('ModbusTcpClient Constructor', (t) => {
    t.test('instantiates with default properties', () => {
        const client = new ModbusTcpClient();

        assert.strictEqual(client.transactionCount, 0);
        assert.strictEqual(client.maxNumberOfTransaction, 64);
        assert.ok(client.reqPool instanceof Map);
        assert.strictEqual(client.reqPool.size, 0);
        assert.ok(client.reqTimersPool instanceof Map);
        assert.strictEqual(client.reqTimersPool.size, 0);

        // Check that it's an instance of EventEmitter (from parent)
        assert.ok(client instanceof EventEmitter);
    });
});

test('ModbusTcpClient transactionCount setter', async (t) => {
    let client = new ModbusTcpClient();

    await t.test('sets transactionCount to a valid number', () => {
        client.transactionCount = 1234;
        assert.strictEqual(client.transactionCount, 1234);
    });

    await t.test('handles wrap-around for values larger than 65535', () => {
        client.transactionCount = 65537; // 65536 (0x10000) + 1
        assert.strictEqual(client.transactionCount, 1);
    });

    await t.test('handles the maximum 16-bit value', () => {
        client.transactionCount = 65535;
        assert.strictEqual(client.transactionCount, 65535);
    });

    await t.test('does not change transactionCount if input is not a number', () => {
        client.transactionCount = 50; // Set an initial value
        client.transactionCount = 'invalid';
        assert.strictEqual(client.transactionCount, 50);
        client.transactionCount = null;
        assert.strictEqual(client.transactionCount, 50);
    });
});

test('makeHeader method', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);
    const pdu2 = Buffer.from([0x01, 0x00, 0x48, 0x00, 0x0A, 0x05]);

    await t.test('generates correct header 1', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 1;
        const header = testMaster.makeHeader(2, pdu1.length);

        assert.strictEqual(header[0], 0);
        assert.strictEqual(header[1], 1);
        assert.strictEqual(header[3], 0);
        assert.strictEqual(header[5], 6);
        assert.strictEqual(header[6], 2);
        assert.strictEqual(header.length, 7);
    });

    await t.test('generates correct header 2', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;
        const header = testMaster.makeHeader(20, pdu2.length);

        assert.strictEqual(header[0], 0);
        assert.strictEqual(header[1], 10);
        assert.strictEqual(header[3], 0);
        assert.strictEqual(header[5], 7);
        assert.strictEqual(header[6], 20);
        assert.strictEqual(header.length, 7);
    });
});

test('parseHeader method', async (t) => {
    const header1 = [0x01, 0x01, 0x00, 0x00, 0x00, 0x05, 0x02];
    const header2 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x03]);
    const header3 = Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x07, 0x05]);

    const testMaster = new ModbusTcpClient();

    await t.test('throws TypeError if header is not a Buffer', () => {
        assert.throws(
            () => testMaster.parseHeader(header1),
            TypeError,
            'Error: Header must be a buffer instance'
        );
    });

    await t.test('throws RangeError if header is not 7 bytes long', () => {
        assert.throws(
            () => testMaster.parseHeader(header2),
            RangeError,
            'Error: Header must be 7 bytes long'
        );
    });

    await t.test('parses a valid header correctly', () => {
        const header = testMaster.parseHeader(header3);

        assert.strictEqual(header.transactionId, 16);
        assert.strictEqual(header.protocolId, 0);
        assert.strictEqual(header.length, 7);
        assert.strictEqual(header.unitId, 5);
    });
});

test('makeRequest method', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);
    const pdu2 = [0x01, 0x00, 0x48, 0x00, 0x0A, 0x05];

    await t.test('returns null for invalid unitId or pdu', () => {
        const testMaster = new ModbusTcpClient();

        const req1 = testMaster.makeRequest(10, pdu2); // unitId out of range
        const req2 = testMaster.makeRequest(258, pdu1); // unitId out of range
        assert.strictEqual(req1, null);
        assert.strictEqual(req2, null);
    });

    await t.test('creates a valid request buffer', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        assert.ok(req1 !== null);
        assert.strictEqual(req1[1], 11); // transactionCount incremented
        assert.strictEqual(req1[5], 6); // length
        assert.strictEqual(req1[6], 2); // unitId
        assert.strictEqual(req1[7], 1); // first PDU byte
        assert.strictEqual(req1[11], 3); // last PDU byte
        assert.strictEqual(req1.length, 12);
    });
});

test('storeRequest method', (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);

    t.test('stores request in pool by transactionId', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        const stored = testMaster.storeRequest(req1);

        assert.strictEqual(stored, true);
        assert.strictEqual(testMaster.reqPool.has(11), true);

        const pooledReq = testMaster.reqPool.get(11);
        assert.strictEqual(pooledReq[1], 11);
        assert.strictEqual(pooledReq[11], 3);
    });
});

test('setReqTimer and clearReqTimer methods', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);

    await t.test('sets a timer for a valid transaction', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.storeRequest(req1);
        assert.strictEqual(testMaster.reqPool.has(11), true);

        const timerId = testMaster.setReqTimer(11, 1500);
        assert.ok(timerId !== -1);
        assert.strictEqual(testMaster.reqTimersPool.has(11), true);
        assert.strictEqual(testMaster.reqTimersPool.get(11), timerId);
    });

    await t.test('returns -1 for invalid transactionId', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.storeRequest(req1);

        // Try to set timer for non-existent transaction
        const timerId = testMaster.setReqTimer(10, 1500);
        assert.strictEqual(timerId, -1);
    });

    await t.test('returns -1 if timeout is 0 or invalid', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.storeRequest(req1);

        const timerId = testMaster.setReqTimer(11, 0);
        assert.strictEqual(timerId, -1);
    });

    await t.test('clears a timer from the pool', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.storeRequest(req1);

        const timerId = testMaster.setReqTimer(11, 1500);
        assert.strictEqual(testMaster.reqTimersPool.has(11), true);

        testMaster.clearReqTimer(11);
        assert.strictEqual(testMaster.reqTimersPool.has(11), false);
    });

    await t.test('clearReqTimer does nothing if timer does not exist', () => {
        const testMaster = new ModbusTcpClient();
        // Should not throw
        testMaster.clearReqTimer(99);
        assert.strictEqual(testMaster.reqTimersPool.has(99), false);
    });
});

test('processResAdu method', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);

    await t.test('processes a response and removes timers/requests from pools', () => {
        const testMaster = new ModbusTcpClient();
        testMaster.transactionCount = 10;

        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.storeRequest(req1);
        assert.strictEqual(testMaster.reqPool.has(11), true);

        const timerId = testMaster.setReqTimer(11, 1500);
        assert.strictEqual(testMaster.reqTimersPool.has(11), true);

        // Process response ADU
        const res = Buffer.from([0x00, 0x0B, 0x00, 0x00, 0x00, 0x06, 0x02, 0x01, 0x00, 0x00, 0x00, 0x03]);
        testMaster.processResAdu(res);

        // After processing, timer and request should be cleared
        assert.strictEqual(testMaster.reqTimersPool.has(11), false);
        assert.strictEqual(testMaster.reqPool.has(11), false);
    });

    await t.test('emits transaction event with request and response', (t) => {
        return new Promise((resolve) => {
            const testMaster = new ModbusTcpClient();
            testMaster.transactionCount = 10;

            const req1 = testMaster.makeRequest(2, pdu1);
            testMaster.storeRequest(req1);
            testMaster.setReqTimer(11, 1500);

            testMaster.once('transaction', (req, res) => {
                assert.strictEqual(req[1], 11);
                assert.strictEqual(req[11], 3);
                assert.strictEqual(res[1], 11);
                assert.strictEqual(res[11], 3);
                resolve();
            });

            const res = Buffer.from([0x00, 0x0B, 0x00, 0x00, 0x00, 0x06, 0x02, 0x01, 0x00, 0x00, 0x00, 0x03]);
            testMaster.processResAdu(res);
        });
    });
});
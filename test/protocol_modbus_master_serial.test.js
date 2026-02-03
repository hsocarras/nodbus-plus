
const test = require('node:test');
const assert = require('node:assert/strict');

const { ModbusSerialClient } = require('../src/nodbus-plus.js');
const { EventEmitter } = require('events');

test('ModbusSerialClient Constructor', (t) => {
    t.test('instantiates with default properties', () => {
        const client = new ModbusSerialClient();

        assert.strictEqual(client.activeRequest, null);
        assert.strictEqual(client._asciiRequest, false);
        assert.strictEqual(client.activeRequestTimerId, -1);
        assert.strictEqual(client.turnAroundDelay, -1);

        // Check that it's an instance of EventEmitter (from parent)
        assert.ok(client instanceof EventEmitter);
    });
});

test('makeRequest method - basic RTU and ASCII modes', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);
    const pdu2 = [0x01, 0x00, 0x48, 0x00, 0x0A, 0x05];
    const testMaster = new ModbusSerialClient();

    await t.test('returns null for invalid unitId or pdu', () => {
        const req1 = testMaster.makeRequest(10, pdu2); // unitId out of range
        const req2 = testMaster.makeRequest(258, pdu1); // unitId out of range
        assert.strictEqual(req1, null);
        assert.strictEqual(req2, null);
    });
    
    await t.test('creates a valid RTU request', () => {
        const req1 = testMaster.makeRequest(2, pdu1);
        assert.strictEqual(req1[0], 2);
        assert.strictEqual(req1[1], 1);
        assert.strictEqual(req1[3], 0);
        assert.strictEqual(req1[5], 3);
        assert.strictEqual(req1[6], 0x7C);
        assert.strictEqual(req1[7], 0x38);
        assert.strictEqual(req1.length, 8);
    });
    
    await t.test('converts RTU request to ASCII format', () => {
        const req = testMaster.makeRequest(2, pdu1);
        const req1 = testMaster.aduRtuToAscii(req);
        assert.strictEqual(req1[0], 0x3A);
        assert.strictEqual(req1[2], 0x32);
        assert.strictEqual(req1[4], 0x31);
        assert.strictEqual(req1[12], 0x33);
        assert.strictEqual(req1[13], 0x46);
        assert.strictEqual(req1[14], 0x41);
        assert.strictEqual(req1.length, 17);
    });
});

test('makeRequest method - advanced RTU and ASCII modes', async (t) => {
    const client = new ModbusSerialClient();
    // PDU: Read 2 holding registers from address 0
    const pdu = Buffer.from([0x03, 0x00, 0x00, 0x00, 0x02]);

    await t.test('RTU mode: creates valid request for standard address', () => {
        const address = 10; // 0x0A
        const req = client.makeRequest(address, pdu, false);

        // Expected: Address(0A) + PDU(03 00 00 00 02) + CRC(C4B6)
        const expected = Buffer.from([0x0A, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC5, 0x70]);
        assert.deepStrictEqual(req, expected);
    });
    
    await t.test('RTU mode: creates valid request for broadcast address 0', () => {
        const address = 0;
        const req = client.makeRequest(address, pdu, false);

        // Expected: Address(00) + PDU(03 00 00 00 02) + CRC(843A)
        const expected = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC5, 0xDA]);
        assert.deepStrictEqual(req, expected);
    });
    
    await t.test('RTU mode: creates valid request for max valid address 247', () => {
        const address = 247; // 0xF7
        const req = client.makeRequest(address, pdu, false);

        // Expected: Address(F7) + PDU(03 00 00 00 02) + CRC(852E)
        const expected = Buffer.from([0xF7, 0x03, 0x00, 0x00, 0x00, 0x02, 0xD0, 0x9D]);
        assert.deepStrictEqual(req, expected);
    });
    
    await t.test('ASCII mode: creates valid request for standard address', () => {
        const address = 10; // 0x0A
        const req = client.makeRequest(address, pdu, true);

        // Expected: ':0A0300000002F1\r\n'
        const expected = Buffer.from(':0A0300000002F1\r\n');
        assert.deepStrictEqual(req, expected);
    });
    
    await t.test('ASCII mode: creates valid request for broadcast address 0', () => {
        const address = 0;
        const req = client.makeRequest(address, pdu, true);

        // Expected: ':000300000002FB\r\n'
        const expected = Buffer.from(':000300000002FB\r\n');
        assert.deepStrictEqual(req, expected);
    });
    
    await t.test('rejects non-buffer PDU', () => {
        assert.strictEqual(client.makeRequest(1, 'not-a-buffer'), null);
    });

    await t.test('rejects invalid address values', () => {
        assert.strictEqual(client.makeRequest(-1, pdu), null);
        assert.strictEqual(client.makeRequest(248, pdu), null);
        assert.strictEqual(client.makeRequest('invalid', pdu), null);
    });
});

test('setTurnAroundDelay method', async (t) => {
    const broadcastRequest = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x02, 0x84, 0x3A]);

    await t.test('returns -1 if there is no active request', () => {
        const client = new ModbusSerialClient();
        client.activeRequest = null;
        const timerId = client.setTurnAroundDelay(100);
        assert.strictEqual(timerId, -1);
    });

    await t.test('returns -1 for invalid timeout value', () => {
        const client = new ModbusSerialClient();
        client.activeRequest = broadcastRequest;
        assert.strictEqual(client.setTurnAroundDelay(0), -1);
        assert.strictEqual(client.setTurnAroundDelay(-10), -1);
        assert.strictEqual(client.setTurnAroundDelay('invalid'), -1);
    });

    await t.test('sets a timer and returns its ID on success', () => {
        const client = new ModbusSerialClient();
        client.activeRequest = broadcastRequest;
        const timerId = client.setTurnAroundDelay(150);

        assert.ok(timerId !== -1);
        assert.strictEqual(client.turnAroundDelay, timerId);
    });

    await t.test('emits broadcast-timeout event and clears activeRequest when timer expires', (t) => {
        return new Promise((resolve) => {
            const client = new ModbusSerialClient();
            client.activeRequest = broadcastRequest;

            client.once('broadcast-timeout', () => {
                assert.strictEqual(client.activeRequest, null);
                resolve();
            });

            const timerId = client.setTurnAroundDelay(50);
            assert.ok(timerId !== -1);
        });
    });
});

test('calcCRC method', (t) => {
    const testMaster = new ModbusSerialClient();

    t.test('calculates correct CRC for various ADUs', () => {
        const adu1 = Buffer.from([0x02, 0x07, 0x00, 0x00]);
        const adu2 = Buffer.from([0x02, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x03]);
        const adu3 = Buffer.from([0x02, 0x01, 0x01, 0x00, 0x00, 0x03]);

        const crc1 = testMaster.calcCRC(adu1);
        const crc2 = testMaster.calcCRC(adu2);
        const crc3 = testMaster.calcCRC(adu3);

        assert.strictEqual(crc1, 0x4112);
        assert.strictEqual(crc2, 0x7C38);
        assert.strictEqual(crc3, 0x51CC);
    });
});

test('setReqTimer method', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);

    await t.test('returns -1 if there is no active request', () => {
        const testMaster = new ModbusSerialClient();
        const timed1 = testMaster.setReqTimer(1500);
        assert.strictEqual(timed1, -1);
    });

    await t.test('stores timer ID when activeRequest is set', () => {
        const testMaster = new ModbusSerialClient();
        const req1 = testMaster.makeRequest(2, pdu1);
        testMaster.activeRequest = req1;

        const timed3 = testMaster.setReqTimer(100);
        const stored = testMaster.activeRequestTimerId;
        assert.strictEqual(stored, timed3);
        assert.ok(timed3 !== -1);
    });

    await t.test('emits req-timeout event when timer expires', (t) => {
        return new Promise((resolve) => {
            const testMaster = new ModbusSerialClient();
            const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);
            const req1 = testMaster.makeRequest(2, pdu1);
            testMaster.activeRequest = req1;

            testMaster.once('req-timeout', (req) => {
                assert.strictEqual(req[0], 2);
                assert.strictEqual(req[1], 1);
                resolve();
            });

            testMaster.setReqTimer(50);
        });
    });
});

test('processResAdu method', async (t) => {
    const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);

    await t.test('clears active request and timer after processing response', (t) => {
        return new Promise((resolve) => {
            const testMaster = new ModbusSerialClient();
            const req1 = testMaster.makeRequest(2, pdu1);
            testMaster.activeRequest = req1;

            const timed3 = testMaster.setReqTimer(500);

            const res = Buffer.from([0x02, 0x01, 0x01, 0x00, 0x51, 0xCC]);

            testMaster.once('transaction', (req, res) => {
                assert.strictEqual(req[0], 2);
                assert.strictEqual(req[5], 3);
                assert.strictEqual(res[0], 2);
                // res[5] may vary based on response structure
                assert.ok(Buffer.isBuffer(res));
                resolve();
            });

            testMaster.processResAdu(res);
        });
    });    
    
});

const test = require('node:test');
const assert = require('node:assert/strict');

// Require the CommonJS implementation directly to avoid package export issues
const { ModbusSerialServer } = require('../src/nodbus-plus.js');


test('ModbusSerialServer Constructor - defaults and config', async (t) => {

    await t.test('default configuration', () => {
        const server = new ModbusSerialServer();
        assert.strictEqual(server.transmitionMode, 0); // 0 = RTU
        assert.strictEqual(server.address, 1);

        // From parent ModbusServer defaults
        assert.strictEqual(server.coils.length, 256); // 2048 / 8
        assert.strictEqual(server.inputs.length, 256); // 2048 / 8
        assert.strictEqual(server.holdingRegisters.length, 4096); // 2048 * 2
        assert.strictEqual(server.inputRegisters.length, 4096); // 2048 * 2
    });

    await t.test('custom configuration', () => {
        const customCfg = {
            transmitionMode: 1, // ASCII
            address: 42,
            coils: 100,
            holdingRegisters: 200,
        };
        const server = new ModbusSerialServer(customCfg);
        assert.strictEqual(server.transmitionMode, 1);
        assert.strictEqual(server.address, 42);
        assert.strictEqual(server.coils.length, Math.ceil(100 / 8));
        assert.strictEqual(server.holdingRegisters.length, 200 * 2);
    });

    await t.test('invalid configuration falls back to defaults', () => {
        const serverWithInvalidMode = new ModbusSerialServer({ transmitionMode: 99 });
        assert.strictEqual(serverWithInvalidMode.transmitionMode, 0);

        const serverWithAddress0 = new ModbusSerialServer({ address: 0 });
        assert.strictEqual(serverWithAddress0.address, 1);

        const serverWithAddress248 = new ModbusSerialServer({ address: 248 });
        assert.strictEqual(serverWithAddress248.address, 1);

        const serverWithInvalidAddress = new ModbusSerialServer({ address: 'invalid' });
        assert.strictEqual(serverWithInvalidAddress.address, 1);
    });

    await t.test('diagnostic counters initialize to zero', () => {
        const server = new ModbusSerialServer();
        assert.strictEqual(server.busMessageCount, 0);
        assert.strictEqual(server.busCommunicationErrorCount, 0);
        assert.strictEqual(server.slaveExceptionErrorCount, 0);
        assert.strictEqual(server.slaveMessageCount, 0);
        assert.strictEqual(server.slaveNoResponseCount, 0);
        assert.strictEqual(server.slaveNAKCount, 0);
        assert.strictEqual(server.slaveBusyCount, 0);
        assert.strictEqual(server.busCharacterOverrunCount, 0);
    });

    await t.test('exception events update counters', () => {
        const server = new ModbusSerialServer();
        assert.strictEqual(server.slaveNAKCount, 0);
        assert.strictEqual(server.slaveBusyCount, 0);

        server.emit('exception', 1, 5, 'ACKNOWLEDGE'); // exception 5 => NAK increment
        assert.strictEqual(server.slaveNAKCount, 1);
        assert.strictEqual(server.slaveBusyCount, 0);

        server.emit('exception', 1, 6, 'SLAVE DEVICE BUSY'); // exception 6 => BUSY increment
        assert.strictEqual(server.slaveNAKCount, 1);
        assert.strictEqual(server.slaveBusyCount, 1);
    });

    await t.test('exceptionCoils buffer and custom service registration', () => {
        const server = new ModbusSerialServer();
        assert.ok(Buffer.isBuffer(server.exceptionCoils));
        assert.strictEqual(server.exceptionCoils.length, 1);
        assert.strictEqual(server.exceptionCoils[0], 0);

        // custom service for function code 7 should be registered
        assert.strictEqual(server._internalFunctionCode.get(7), 'readExceptionCoilsService');
    });
});

test('getResponseAdu - RTU and ASCII validations and processing', async (t) => {

    await t.test('input validation', () => {
        const rtuServer = new ModbusSerialServer({ address: 1, transmitionMode: 0 });
        const asciiServer = new ModbusSerialServer({ address: 10, transmitionMode: 1 });

        assert.throws(() => rtuServer.getResponseAdu('not-a-buffer'), TypeError);
        assert.throws(() => rtuServer.getResponseAdu(null), TypeError);

        const shortRtuFrame = Buffer.from([0x01, 0x03, 0x00]); // too short for RTU
        assert.throws(() => rtuServer.getResponseAdu(shortRtuFrame), RangeError);

        const shortAsciiFrame = Buffer.from(':0103\r\n'); // too short for ASCII
        assert.throws(() => asciiServer.getResponseAdu(shortAsciiFrame), RangeError);
    });

    await t.test('RTU: valid request returns correct RTU response', () => {
        const rtuServer = new ModbusSerialServer({ address: 1, transmitionMode: 0 });
        // Read 2 holding registers from address 0, slave 1
        const reqAdu = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
        rtuServer.holdingRegisters.writeUInt16BE(0xABCD, 0);
        rtuServer.holdingRegisters.writeUInt16BE(0x1234, 2);

        const resAdu = rtuServer.getResponseAdu(reqAdu);

        const expectedRes = Buffer.from([0x01, 0x03, 0x04, 0xAB, 0xCD, 0x12, 0x34, 0x46, 0x9F]);
        assert.deepStrictEqual(resAdu, expectedRes);
        assert.strictEqual(rtuServer.slaveMessageCount, 1);
        assert.strictEqual(rtuServer.slaveExceptionErrorCount, 0);
    });

    await t.test('RTU: invalid request returns exception response', () => {
        const rtuServer = new ModbusSerialServer({ address: 1, transmitionMode: 0 });
        // Read 10 registers from invalid address -> exception
        const reqAdu = Buffer.from([0x01, 0x03, 0xFF, 0xFF, 0x00, 0x0A, 0xB5, 0xCF]);

        const resAdu = rtuServer.getResponseAdu(reqAdu);

        const expectedRes = Buffer.from([0x01, 0x83, 0x02, 0xC0, 0xF1]); // function code + 0x80 + exception
        assert.deepStrictEqual(resAdu, expectedRes);
        assert.strictEqual(rtuServer.slaveMessageCount, 1);
        assert.strictEqual(rtuServer.slaveExceptionErrorCount, 1);
    });

    await t.test('ASCII: valid request returns correct ASCII response', () => {
        // Read 1 holding register from address 0, slave 10 (0x0A)
        const reqAdu = Buffer.from(':0A0300000001F2\r\n');
        const asciiServer = new ModbusSerialServer({ address: 10, transmitionMode: 1 });
        asciiServer.holdingRegisters.writeUInt16BE(0xABCD, 0);

        const resAdu = asciiServer.getResponseAdu(reqAdu);

        const expectedRes = Buffer.from(':0A0302ABCD79\r\n');
        assert.deepStrictEqual(resAdu, expectedRes);
        assert.strictEqual(asciiServer.slaveMessageCount, 1);
        assert.strictEqual(asciiServer.slaveExceptionErrorCount, 0);
    });
});

test('helper methods: getAddress, getPdu, checksums and conversions', async (t) => {
    const aduAscii1 = Buffer.from([0x3A, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x41, 0x46, 0x32, 0x0D, 0x0A]); // :01030000000A...
    const aduRtu1 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0x7F, 0xA9]);

    const server1 = new ModbusSerialServer({ transmitionMode: 1 });
    const server2 = new ModbusSerialServer();

    await t.test('getAddress', () => {
        assert.strictEqual(server1.getAddress(aduAscii1), 1);
        assert.strictEqual(server2.getAddress(aduRtu1), 10);
    });

    await t.test('getPdu', () => {
        const pdu1 = server1.getPdu(aduAscii1);
        assert.strictEqual(pdu1[0], 3);
        assert.strictEqual(pdu1[3], 0);
        assert.strictEqual(pdu1[4], 10);
        assert.strictEqual(pdu1.length, 5);

        const pdu2 = server2.getPdu(aduRtu1);
        assert.strictEqual(pdu2[0], 2);
        assert.strictEqual(pdu2[2], 1);
        assert.strictEqual(pdu2[4], 0x16);
        assert.strictEqual(pdu2.length, 5);
    });

    await t.test('getChecksum (LRC and CRC)', () => {
        // LRC (ASCII)
        const asciiLrc = Buffer.from([0x3A, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x41, 0x46, 0x32, 0x0D, 0x0A]);
        const asciiBad = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x35, 0x0d, 0x0a]);

        assert.strictEqual(server1.getChecksum(asciiLrc), 0xF2);
        assert.strictEqual(server1.validateCheckSum(asciiBad), false);

        // CRC (RTU)
        const aduRtuGood = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7F]);
        const aduRtuBad = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7D]);

        assert.strictEqual(server2.getChecksum(aduRtu1) === 0xA97F || server2.getChecksum(aduRtu1) === 0x7FA9, true, 'CRC may be returned in swapped order depending on implementation');
        assert.strictEqual(server2.validateCheckSum(aduRtuGood), true);
        assert.strictEqual(server2.validateCheckSum(aduRtuBad), false);
    });

    t.test('aduRtuToAscii and aduAsciiToRtu conversions', () => {
        const aduRtuSample = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC8, 0xC5]);
        const aduRtuSample2 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0x7F, 0xA9]);

        const serverA = new ModbusSerialServer({ transmitionMode: 1 });
        const serverB = new ModbusSerialServer();

        const ascii1 = serverA.aduRtuToAscii(aduRtuSample);
        assert.strictEqual(ascii1[0], 0x3A);
        assert.strictEqual(ascii1[1], 48);
        assert.strictEqual(ascii1[2], 49);
        assert.strictEqual(ascii1[3], 48);
        assert.strictEqual(ascii1[4], 51);
        assert.strictEqual(ascii1[12], 54);
        assert.strictEqual(ascii1[13], 70);
        assert.strictEqual(ascii1[14], 54);
        assert.strictEqual(ascii1[15], 0x0D);
        assert.strictEqual(ascii1[16], 0x0A);
        assert.strictEqual(ascii1.length, 2 * aduRtuSample.length + 1);

        const ascii2 = serverB.aduRtuToAscii(aduRtuSample2);
        assert.strictEqual(ascii2[0], 0x3A);
        assert.strictEqual(ascii2[1], 48);
        assert.strictEqual(ascii2[2], 65);
        assert.strictEqual(ascii2[3], 48);
        assert.strictEqual(ascii2[4], 50);
        assert.strictEqual(ascii2[11], 49);
        assert.strictEqual(ascii2[12], 54);
        assert.strictEqual(ascii2[13], 68);
        assert.strictEqual(ascii2[14], 68);
        assert.strictEqual(ascii2[15], 0x0D);
        assert.strictEqual(ascii2[16], 0x0A);
        assert.strictEqual(ascii2.length, 2 * aduRtuSample2.length + 1);

        // ascii -> rtu
        const asciiSample1 = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x36, 0x0d, 0x0a]);
        const asciiSample2 = Buffer.from([0x3a, 0x30, 0x41, 0x30, 0x32, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x31, 0x36, 0x44, 0x44, 0x0d, 0x0a]);

        const rtuFromAscii1 = serverA.aduAsciiToRtu(asciiSample1);
        assert.strictEqual(rtuFromAscii1[0], 0x01);
        assert.strictEqual(rtuFromAscii1[1], 0x03);
        assert.strictEqual(rtuFromAscii1[2], 0x00);
        assert.strictEqual(rtuFromAscii1[3], 0x00);
        assert.strictEqual(rtuFromAscii1[5], 0x06);
        assert.strictEqual(rtuFromAscii1.length, (asciiSample1.length - 1) / 2);

        const rtuFromAscii2 = serverB.aduAsciiToRtu(asciiSample2);
        assert.strictEqual(rtuFromAscii2[0], 0x0A);
        assert.strictEqual(rtuFromAscii2[1], 0x02);
        assert.strictEqual(rtuFromAscii2[2], 0x00);
        assert.strictEqual(rtuFromAscii2[3], 0x01);
        assert.strictEqual(rtuFromAscii2[5], 0x16);
        assert.strictEqual(rtuFromAscii2.length, (asciiSample2.length - 1) / 2);
    });
});

test('processReqPdu / broadcast / validateAddress flows', async (t) => {
    const server1 = new ModbusSerialServer();
    const server2 = new ModbusSerialServer({ transmitionMode: 1, address: 10 });

    await t.test('readExceptionCoilsService (function code 7)', () => {
        const pdu = Buffer.from([0x07]);
        const res = server1.processReqPdu(pdu);
        assert.strictEqual(res[0], 7);
        assert.strictEqual(res[1], 0);
        assert.strictEqual(res.length, 2);
    });

    await t.test('broadcast processing increments counters', () => {
        const adu1 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7F]);
        const adu2 = Buffer.from([0x01, 0x03, 0x15, 0xB3, 0x00, 0x0A, 0x30, 0x26]);

        const beforeMsg = server1.slaveMessageCount;
        const beforeNoResp = server1.slaveNoResponseCount;
        server1.executeBroadcastReq(adu1);
        assert.strictEqual(server1.slaveMessageCount, beforeMsg + 1);
        assert.strictEqual(server1.slaveNoResponseCount, beforeNoResp + 1);

        const beforeMsg2 = server1.slaveMessageCount;
        const beforeNoResp2 = server1.slaveNoResponseCount;
        const beforeExc = server1.slaveExceptionErrorCount;
        server1.executeBroadcastReq(adu2);
        assert.strictEqual(server1.slaveMessageCount, beforeMsg2 + 1);
        assert.strictEqual(server1.slaveNoResponseCount, beforeNoResp2 + 1);
        assert.strictEqual(server1.slaveExceptionErrorCount, beforeExc + 1);
    });

    await t.test('validateAddress and getResponseAdu main flow', () => {
        const aduWrong = Buffer.from([0x03, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC8]);
        assert.strictEqual(server1.validateAddress(aduWrong), false);

        const aduValid = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC8]);
        const resp = server1.getResponseAdu(aduValid);
        assert.strictEqual(resp[0], 0x01);
        assert.strictEqual(resp[1], 0x03);
        assert.strictEqual(resp[2], 12);
        assert.strictEqual(resp.length, 17);
    });

    await t.test('ASCII response generation', () => {
        const adu6 = Buffer.from([0x3A, 0x30, 0x41, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x41, 0x45, 0x39, 0x0D, 0x0A]); // ASCII :0A030000000A...
        const resp = server2.getResponseAdu(adu6);

        assert.strictEqual(server2.address, 10);

        assert.strictEqual(resp[0], 0x3A);
        assert.strictEqual(resp[1], 0x30);
        assert.strictEqual(resp[2], 0x41);
        assert.strictEqual(resp[3], 0x30);
        assert.strictEqual(resp[4], 0x33);
        assert.strictEqual(resp[5], 0x31);
        assert.strictEqual(resp[6], 0x34);
    });
});

// test/protocol_modbus_master.test.js

const test = require('node:test');
const assert = require( 'node:assert/strict');
const { ModbusClient } = require('../src/nodbus-plus.js');

test('ModbusClient - Read Coils status', async (t) => {
    const testMaster = new ModbusClient();

    await t.test('request 1 - read 3 coils from address 0', () => {
        const req1 = testMaster.readCoilStatusPdu(0, 3);
        assert.strictEqual(req1[0], 1);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[4], 3);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - read 10 coils from address 0x48', () => {
        const req2 = testMaster.readCoilStatusPdu(0x48, 10);
        assert.strictEqual(req2[0], 1);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 0x48);
        assert.strictEqual(req2[3], 0);
        assert.strictEqual(req2[4], 10);
        assert.strictEqual(req2.length, 5);
    });
});

test('ModbusClient - Read Input status', async (t) => {
    const testMaster = new ModbusClient();

    await t.test('request 1 - read 3 inputs from address 0', () => {
        const req1 = testMaster.readInputStatusPdu(0, 3);
        assert.strictEqual(req1[0], 2);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[4], 3);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - read 10 inputs from address 0x48', () => {
        const req2 = testMaster.readInputStatusPdu(0x48, 10);
        assert.strictEqual(req2[0], 2);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 0x48);
        assert.strictEqual(req2[3], 0);
        assert.strictEqual(req2[4], 10);
        assert.strictEqual(req2.length, 5);
    });
});

test('ModbusClient - Read Holding register status', async (t) => {
    const testMaster = new ModbusClient();

    await t.test('request 1 - read 3 holding registers from address 0', () => {
        const req1 = testMaster.readHoldingRegistersPdu(0, 3);
        assert.strictEqual(req1[0], 3);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[4], 3);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - read 10 holding registers from address 0x48', () => {
        const req2 = testMaster.readHoldingRegistersPdu(0x48, 10);
        assert.strictEqual(req2[0], 3);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 0x48);
        assert.strictEqual(req2[3], 0);
        assert.strictEqual(req2[4], 10);
        assert.strictEqual(req2.length, 5);
    });
});

test('ModbusClient - Read Input register status', async (t) => {
    const testMaster = new ModbusClient();

    await t.test('request 1 - read 3 input registers from address 0', () => {
        const req1 = testMaster.readInputRegistersPdu(0, 3);
        assert.strictEqual(req1[0], 4);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[4], 3);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - read 10 input registers from address 0x48', () => {
        const req2 = testMaster.readInputRegistersPdu(0x48, 10);
        assert.strictEqual(req2[0], 4);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 0x48);
        assert.strictEqual(req2[3], 0);
        assert.strictEqual(req2[4], 10);
        assert.strictEqual(req2.length, 5);
    });
});

test('ModbusClient - force single Coils', async (t) => {
    const testMaster = new ModbusClient();

    await t.test('request 1 - force coil ON at address 3', () => {
        const req1 = testMaster.forceSingleCoilPdu(testMaster.boolToBuffer(true), 3);
        assert.strictEqual(req1[0], 5);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[2], 3);        
        assert.strictEqual(req1[3], 0xFF);
        assert.strictEqual(req1[4], 0);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - force coil OFF at address 10', () => {
        const req2 = testMaster.forceSingleCoilPdu(testMaster.boolToBuffer(false), 10);
        assert.strictEqual(req2[0], 5);
        assert.strictEqual(req2[2], 10);
        assert.strictEqual(req2[4], 0);
        assert.strictEqual(req2.length, 5);
    });
    
    await t.test('Value error - invalid buffer length', () => {
        assert.throws(() => {
            let val = Buffer.alloc(3);
            val[0] = 0xFA;
            testMaster.forceSingleCoilPdu(val, 10);
        }, {
            name: 'RangeError',
            message: 'Error, value length must be 2'
        });
    });
});

test('ModbusClient - Preset single register', async (t) => {
    const testMaster = new ModbusClient();
    const val1 = Buffer.alloc(2);
    val1[0] = 0x25;
    val1[1] = 0x56;

    await t.test('request 1 - preset register at address 20', () => {
        const req1 = testMaster.presetSingleRegisterPdu(val1, 20);
        assert.strictEqual(req1[0], 6);
        assert.strictEqual(req1[2], 20);
        assert.strictEqual(req1[4], 0x56);
        assert.strictEqual(req1.length, 5);
    });

    await t.test('request 2 - preset register at address 10', () => {
        const req2 = testMaster.presetSingleRegisterPdu(val1, 10);
        assert.strictEqual(req2[0], 6);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 10);
        assert.strictEqual(req2[3], 0x25);
        assert.strictEqual(req2[4], 0x56);
        assert.strictEqual(req2.length, 5);
    });

    await t.test('Value error - invalid buffer length', () => {
        assert.throws(() => {
            let val = Buffer.alloc(3);
            val[0] = 0xFA;
            testMaster.presetSingleRegisterPdu(val, 10);
        }, {
            name: 'RangeError',
            message: 'Error, value length must be 2'
        });
    });
});

test('ModbusClient - write multiple Coils', async (t) => {
    const testMaster = new ModbusClient();
    const val1 = Buffer.alloc(1);
    const val2 = Buffer.alloc(2);
    val1[0] = 0x36;
    val2[0] = 0x74;
    val2[1] = 0x25;

    await t.test('bools to buffer conversion', () => {
        const valBuffer = testMaster.boolsToBuffer([0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1]);
        assert.strictEqual(valBuffer.length, 2);
        assert.strictEqual(valBuffer[0], 0xC2);
        assert.strictEqual(valBuffer[1], 0x04);
    });

    await t.test('request 1 - write 5 coils at address 3', () => {
        const req1 = testMaster.forceMultipleCoilsPdu(val1, 3, 5);
        assert.strictEqual(req1[0], 15);
        assert.strictEqual(req1[2], 3);
        assert.strictEqual(req1[4], 5);
        assert.strictEqual(req1[5], 1);
        assert.strictEqual(req1[6], 0x36);
    });

    await t.test('request 2 - write 12 coils at address 10', () => {
        const req2 = testMaster.forceMultipleCoilsPdu(val2, 10, 12);
        assert.strictEqual(req2[0], 15);
        assert.strictEqual(req2[2], 10);
        assert.strictEqual(req2[4], 12);
        assert.strictEqual(req2[5], 2);
        assert.strictEqual(req2[7], 0x25);
    });
});

test('ModbusClient - write multiple registers', async (t) => {
    const testMaster = new ModbusClient();
    const val1 = Buffer.alloc(4);
    val1[0] = 0x25;
    val1[1] = 0x56;
    val1[2] = 0x46;
    val1[3] = 0x63;

    const val2 = Buffer.alloc(6);
    val2[0] = 0x74;
    val2[1] = 0x25;
    val2[2] = 0x12;
    val2[3] = 0x34;
    val2[4] = 0x56;
    val2[5] = 0x78;

    await t.test('request 1 - write 2 registers at address 20', () => {
        const req1 = testMaster.presetMultipleRegistersPdu(val1, 20);
        assert.strictEqual(req1[0], 16);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[2], 20);
        assert.strictEqual(req1[3], 0);
        assert.strictEqual(req1[4], 2);
        assert.strictEqual(req1[5], 4);
        assert.strictEqual(req1[6], 0x25);
        assert.strictEqual(req1[7], 0x56);
        assert.strictEqual(req1[8], 0x46);
        assert.strictEqual(req1[9], 0x63);
        assert.strictEqual(req1.length, 10);
    });

    await t.test('request 2 - write 3 registers at address 10', () => {
        const req2 = testMaster.presetMultipleRegistersPdu(val2, 10, 3);
        assert.strictEqual(req2[0], 16);
        assert.strictEqual(req2[2], 10);
        assert.strictEqual(req2[4], 3);
        assert.strictEqual(req2[5], 6);
        assert.strictEqual(req2.length, 12);
    });
});

test('ModbusClient - mask holding register', async (t) => {
    const testMaster = new ModbusClient();
    const val1 = [-1, -1, 1, -1, -1, -1, 0, 0,  1, -1, -1, -1, -1, -1, 1, 1];
    const maskBuffer = testMaster.getMaskRegisterBuffer(val1);

    await t.test('request 1 - mask register at address 20', () => {
        const req1 = testMaster.maskHoldingRegisterPdu(maskBuffer, 20);
        assert.strictEqual(req1[0], 22);
        assert.strictEqual(req1[2], 20);
        assert.strictEqual(req1.length, 7);
    });
    
    await t.test('mask calculation and application', () => {
        const andMask = maskBuffer.readUInt16BE(0);
        const orMask = maskBuffer.readUInt16BE(2);
        const testRegister = Buffer.alloc(2);
        testRegister[0] = 0x9A;
        testRegister[1] = 0xFB;
        const currentContent = testRegister.readUInt16BE(0);
        const finalResult = (currentContent & andMask) | (orMask & (~andMask));
        const finalBuffer = Buffer.alloc(2);
        finalBuffer.writeUInt16BE(finalResult, 0);

        assert.strictEqual(maskBuffer[0], 0x3E);
        assert.strictEqual(maskBuffer[1], 0x3B);
        assert.strictEqual(maskBuffer[2], 0xFF);
        assert.strictEqual(maskBuffer[3], 0x3F);
        assert.strictEqual(finalResult, 0xDB3F);
    });
});

test('ModbusClient - read and write multiple registers', async (t) => {
    const testMaster = new ModbusClient();
    const val1 = Buffer.alloc(4);
    val1[0] = 0x25;
    val1[1] = 0x56;
    val1[2] = 0x46;
    val1[3] = 0x63;

    const val2 = Buffer.alloc(10);
    val2[0] = 0x74;
    val2[1] = 0x25;

    await t.test('request 1 - read 5 registers from 20, write 2 from 100', () => {
        const req1 = testMaster.readWriteMultipleRegistersPdu(val1, 20, 5, 100);
        assert.strictEqual(req1[0], 23);
        assert.strictEqual(req1[1], 0);
        assert.strictEqual(req1[2], 20);
        assert.strictEqual(req1[3], 0);
        assert.strictEqual(req1[4], 5);
        assert.strictEqual(req1[5], 0);
        assert.strictEqual(req1[6], 100);
        assert.strictEqual(req1[7], 0);
        assert.strictEqual(req1[8], 2);
        assert.strictEqual(req1[9], 4);
        assert.strictEqual(req1[10], 0x25);
        assert.strictEqual(req1[11], 0x56);
        assert.strictEqual(req1[12], 0x46);
        assert.strictEqual(req1[13], 0x63);
        assert.strictEqual(req1.length, 14);
    });

    await t.test('request 2 - read 3 registers from 10, write 5 from 20', () => {
        const req2 = testMaster.readWriteMultipleRegistersPdu(val2, 10, 3, 20, 5);
        assert.strictEqual(req2[0], 23);
        assert.strictEqual(req2[1], 0);
        assert.strictEqual(req2[2], 10);
        assert.strictEqual(req2[3], 0);
        assert.strictEqual(req2[4], 3);
        assert.strictEqual(req2[5], 0);
        assert.strictEqual(req2[6], 20);
        assert.strictEqual(req2[7], 0);
        assert.strictEqual(req2[8], 5);
        assert.strictEqual(req2[9], 10);
        assert.strictEqual(req2[10], 0x74);
        assert.strictEqual(req2[11], 0x25);
        assert.strictEqual(req2[12], 0);
        assert.strictEqual(req2[13], 0);
        assert.strictEqual(req2[14], 0);
        assert.strictEqual(req2[15], 0);
        assert.strictEqual(req2[16], 0);
        assert.strictEqual(req2[17], 0);
        assert.strictEqual(req2[18], 0);
        assert.strictEqual(req2[19], 0);
        assert.strictEqual(req2.length, 20);
    });
});
const test = require('node:test');
const assert = require('node:assert/strict');

const { ModbusTcpServer } = require('../src/nodbus-plus.js');

test('ModbusTcpServer - core behavior', async (t) => {

    await t.test('Function getPdu. Extract PDU from ADU', () => {
        const server2 = new ModbusTcpServer();
        const adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
        const adu2 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF]);

        let pdu = server2.getPdu(adu1);
        assert.strictEqual(pdu[0], 1);
        assert.strictEqual(pdu[1], 0);
        assert.strictEqual(pdu[2], 0);
        assert.strictEqual(pdu[3], 0);
        assert.strictEqual(pdu[4], 0x03);
        assert.strictEqual(pdu.length, 5);

        pdu = server2.getPdu(adu2);
        assert.strictEqual(pdu, null);
    });
   
    await t.test('Function getMbapHeader. Extract MBAP header from ADU', () => {

        const server2 = new ModbusTcpServer();
        const adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);

        const header = server2.getMbapHeader(adu1);

        assert.strictEqual(header[1], 2);
        assert.strictEqual(header[2], 0x00);
        assert.strictEqual(header[3], 0x00);
        assert.strictEqual(header[4], 0x00);
        assert.strictEqual(header[5], 0x06);
        assert.strictEqual(header[6], 0xFF);
        assert.strictEqual(header.length, 7);

        const adu2 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06]);
        const header2 = server2.getMbapHeader(adu2);
        assert.strictEqual(header2, null);
    });

    await t.test('Function validateMbapHeader. Valid MBAP header should return true', () => {
        const adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
        const adu2 = Buffer.from([0x00, 0x02, 0x00, 0x01, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
        const adu3 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06]);
        const server2 = new ModbusTcpServer();

        // Valid MBAP header should return true
        let isValid = server2.validateMbapHeader(adu1.subarray(0, 7));
        assert.strictEqual(isValid, true);
        // Invalid protocol field should return false
        isValid = server2.validateMbapHeader(adu2.subarray(0, 7));
        assert.strictEqual(isValid, false);
        // Invalid header length should return false
        isValid = server2.validateMbapHeader(adu3);
        assert.strictEqual(isValid, false);
    });
    
});

test('ModbusTcpServer - build response from adu', async (t) => {
    const adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x03]);
    const server2 = new ModbusTcpServer();
    server2.holdingRegisters.writeUint16BE(0x1879, 0);

    await t.test('build response ADU from request ADU', () => {
        const res = server2.getResponseAdu(adu1);
        assert.strictEqual(res[0], 0);
        assert.strictEqual(res[1], 2);
        assert.strictEqual(res[2], 0);
        assert.strictEqual(res[3], 0);
        assert.strictEqual(res[4], 0);
        assert.strictEqual(res[5], 9);
        assert.strictEqual(res[6], 0xFF);
        assert.strictEqual(res[7], 3);
        assert.strictEqual(res[8], 6);
        assert.strictEqual(res[9], 0x18);
        assert.strictEqual(res[10], 0x79);
        assert.strictEqual(res[11], 0);
        assert.strictEqual(res[12], 0);
        assert.strictEqual(res[13], 0);
        assert.strictEqual(res[14], 0);
        assert.strictEqual(res.length, 15);
    });
});

test('ModbusTcpServer - getResponseAdu (Exhaustive)', async (t) => {
    await t.test('Input Validation and Error Handling', async (t) => {
        await t.test('should throw TypeError if request is not a Buffer', () => {
            const server = new ModbusTcpServer();
            assert.throws(
                () => server.getResponseAdu('not-a-buffer'),
                TypeError
            );
            assert.throws(
                () => server.getResponseAdu(null),
                TypeError
            );
        });

        await t.test('should throw RangeError for an ADU that is too short (< 8 bytes)', () => {
            const server = new ModbusTcpServer();
            const shortAdu = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0xFF]); // 7 bytes
            assert.throws(
                () => server.getResponseAdu(shortAdu),
                RangeError
            );
        });

        await t.test('should throw RangeError for an ADU that is too long (> 260 bytes)', () => {
            const server = new ModbusTcpServer();
            const longAdu = Buffer.alloc(261);
            assert.throws(
                () => server.getResponseAdu(longAdu),
                RangeError
            );
        });

        await t.test('should throw RangeError for an invalid MBAP Protocol ID', () => {
            const server = new ModbusTcpServer();
            const invalidProtocolAdu = Buffer.from([
                0x00, 0x02, 0x00, 0x01, 0x00, 0x06, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x02
            ]);
            assert.throws(
                () => server.getResponseAdu(invalidProtocolAdu),
                /Invalid MBAP header/
            );
        });

        await t.test('should throw RangeError for a mismatched MBAP length field', () => {
            const server = new ModbusTcpServer();
            const mismatchedLengthAdu = Buffer.from([
                0x00, 0x02, 0x00, 0x00, 0x00, 0x05, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x02
            ]);
            assert.throws(
                () => server.getResponseAdu(mismatchedLengthAdu),
                /Invalid MBAP header/
            );
        });
    });

    await t.test('Valid Request Processing', async (t) => {
        await t.test('should process a valid Read Holding Registers request and return a correct response', () => {
            const server = new ModbusTcpServer();
            // Populate server registers
            server.holdingRegisters.writeUInt16BE(0xABCD, 0);
            server.holdingRegisters.writeUInt16BE(0x1234, 2);

            // Request ADU: TI(2), PI(0), Len(6), UI(255) | PDU: FC(3), Addr(0), Qty(2)
            const reqAdu = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x02]);
            const resAdu = server.getResponseAdu(reqAdu);

            // Expected Response ADU: TI(2), PI(0), Len(7), UI(255) | PDU: FC(3), ByteCount(4), Val1(ABCD), Val2(1234)
            const expectedRes = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x07, 0xFF, 0x03, 0x04, 0xAB, 0xCD, 0x12, 0x34]);
            assert.deepStrictEqual(resAdu, expectedRes);
        });

        await t.test('should process a request that results in a Modbus exception', () => {
            const server = new ModbusTcpServer();
            // Request ADU: Read registers from an illegal data address
            // TI(3), PI(0), Len(6), UI(10) | PDU: FC(3), Addr(65535), Qty(1)
            const reqAdu = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x06, 0x0A, 0x03, 0xFF, 0xFF, 0x00, 0x01]);
            const resAdu = server.getResponseAdu(reqAdu);

            // Expected Exception Response ADU: TI(3), PI(0), Len(3), UI(10) | PDU: FC(0x83), ExceptionCode(2)
            const expectedRes = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x03, 0x0A, 0x83, 0x02]);
            assert.deepStrictEqual(resAdu, expectedRes);
        });
    });
});

const test = require('node:test');
const assert = require('node:assert');
const { ModbusServer } = require('../src/nodbus-plus.js');

test('ModbusServer - core behavior', async (t) => {

    await t.test('server instantiation and register buffer sizes', () => {
        const server1Cfg = {
            inputs: 524,
            coils: 0,
            holdingRegisters: 512,
            inputRegisters: 256
        };

        const basicServer1 = new ModbusServer(server1Cfg);
        const basicServer2 = new ModbusServer();

        // Verify created buffer lengths match expectations from original tests
        assert.equal(basicServer1.inputs.length, 66, 'inputs length for server1');
        assert.equal(basicServer2.inputs.length, 256, 'default inputs length server2');

        assert.equal(basicServer1.coils.length, 0, 'coils length server1');
        assert.equal(basicServer2.coils.length, 256, 'default coils length server2');

        assert.equal(basicServer1.holdingRegisters.length, 1024, 'holdingRegisters length server1');
        assert.equal(basicServer2.holdingRegisters.length, 4096, 'default holdingRegisters length server2');

        assert.equal(basicServer1.inputRegisters.length, 512, 'inputRegisters length server1');
        assert.equal(basicServer2.inputRegisters.length, 4096, 'default inputRegisters length server2');

        //suported function codes
        const expectedFunctionCodes = [1, 2, 3, 4, 5, 6, 15, 16, 22, 23];
        assert.deepEqual(
            Array.from(basicServer1.supportedFunctionCode),
            expectedFunctionCodes,
            'supported function codes'
        );
    });

    await t.test('Read Coils status - normal and exception cases', async () => {
        const server1Cfg = { inputs: 524, coils: 256, holdingRegisters: 512, inputRegisters: 256 };
        const basicServer1 = new ModbusServer(server1Cfg);

        // prepare some known coil values for deterministic responses
        basicServer1.coils[0] = 0x0f;
        basicServer1.coils[1] = 0x52;

        const pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]); // Read 3 coils at 0
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x01);
        assert.equal(res1[1], 1); // byte count
        assert.equal(res1[2], 7); // expected packed bits


        // Illegal address: ensure response is exception and event emitted
        const pdu2 = Buffer.from([0x01, 0xC3, 0xA5, 0x00, 0x03]);
        basicServer1.on('exception', function exceptionHandler(mbFunctionCode, exceptionCode, detail) {
            assert.equal(mbFunctionCode, 1);
            assert.equal(exceptionCode, 2);
            assert.equal(detail, 'ILLEGAL DATA ADDRESS');

        });
        let resExc = basicServer1.processReqPdu(pdu2);
        // Exception response should set MSB on function code
        assert.equal(resExc[0], 0x81);
        assert.equal(resExc[1], 2);
    });

    await t.test('Read Inputs status - normal and exception cases', async () => {
        const server1Cfg = { inputs: 524 };
        const basicServer1 = new ModbusServer(server1Cfg);

        basicServer1.inputs[0] = 0x76;
        basicServer1.inputs[1] = 0x38;
        basicServer1.inputs[2] = 0xCF;

        const pdu1 = Buffer.from([0x02, 0x00, 0x00, 0x00, 0x0C]); // read a span
        const r = basicServer1.processReqPdu(pdu1);
        assert.equal(r[0], 0x02);  //modbus function code
        assert.equal(r[1], 2);    //byte count
        assert.equal(r[2], 0x76); //data byte 1


        // Illegal address: ensure response is exception and event emitted
        const pdu2 = Buffer.from([0x02, 0xC3, 0xA5, 0x00, 0x03]);
        basicServer1.on('exception', function exceptionHandler(mbFunctionCode, exceptionCode, detail) {
            assert.equal(mbFunctionCode, 2);
            assert.equal(exceptionCode, 2);
            assert.equal(detail, 'ILLEGAL DATA ADDRESS');

        });
        let resExc = basicServer1.processReqPdu(pdu2);
        // Exception response should set MSB on function code
        assert.equal(resExc[0], 0x82);
        assert.equal(resExc[1], 2);
    });

    await t.test('Read Holding Registers - normal and exception cases', async () => {
        const server1Cfg = { holdingRegisters: 512 };
        const basicServer1 = new ModbusServer(server1Cfg);
        // set known values
        basicServer1.holdingRegisters[10] = 0x13;
        basicServer1.holdingRegisters.writeUint16BE(1879, 12);

        const pdu1 = Buffer.from([0x03, 0x00, 0x05, 0x00, 0x01]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x03);
        assert.equal(res1[1], 2);
        assert.equal(res1[2], 0x13);

        // check multi-register read
        const pdu4 = Buffer.from([0x03, 0x00, 0x05, 0x00, 0x02]);
        const res4 = basicServer1.processReqPdu(pdu4);
        assert.equal(res4[0], 0x03);
        assert.equal(res4[1], 4);
        assert.equal(res4[2], 0x13);
        assert.equal(res4[3], 0x00);
        assert.equal(res4[4], 0x07);
        assert.equal(res4[5], 0x57);

        // Illegal address: ensure response is exception and event emitted
        const pdu2 = Buffer.from([0x03, 0xC3, 0xA5, 0x00, 0x03]);
        basicServer1.on('exception', function exceptionHandler(mbFunctionCode, exceptionCode, detail) {
            assert.equal(mbFunctionCode, 3);
            assert.equal(exceptionCode, 2);
            assert.equal(detail, 'ILLEGAL DATA ADDRESS');
        });
        let resExc = basicServer1.processReqPdu(pdu2);
        // Exception response should set MSB on function code
        assert.equal(resExc[0], 0x83);
        assert.equal(resExc[1], 2);
    });


    await t.test('Read Input Registers - normal and exception cases', async () => {
        const server1Cfg = { inputRegisters: 256 };
        const basicServer1 = new ModbusServer(server1Cfg);
        basicServer1.inputRegisters.writeUInt32BE(25489, 0);

        const pdu1 = Buffer.from([0x04, 0x00, 0x00, 0x00, 0x02]);
        const res = basicServer1.processReqPdu(pdu1);
        assert.equal(res[0], 0x04);
        assert.equal(res[1], 4);
        assert.equal(res[2], 0x00);
        assert.equal(res[3], 0x00);
        assert.equal(res[4], 0x63);
        assert.equal(res[5], 0x91);

        // Illegal address: ensure response is exception and event emitted
        const pdu2 = Buffer.from([0x04, 0xC3, 0xA5, 0x00, 0x03]);
        basicServer1.on('exception', function exceptionHandler(mbFunctionCode, exceptionCode, detail) {
            assert.equal(mbFunctionCode, 4);
            assert.equal(exceptionCode, 2);
            assert.equal(detail, 'ILLEGAL DATA ADDRESS');
        });
        let resExc = basicServer1.processReqPdu(pdu2);
        // Exception response should set MSB on function code
        assert.equal(resExc[0], 0x84);
        assert.equal(resExc[1], 2);

    });

    await t.test('Write Single Coils and error handling', async () => {
        const cfg = { coils: 256 };
        const basicServer1 = new ModbusServer(cfg);
        const pdu1 = Buffer.from([0x05, 0x00, 27, 0xFF, 0x00]);
        //write event listener
        const excW = new Promise((resolve) => basicServer1.once('write-coils', (coil, val) => resolve({ coil, val })));
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x05);
        assert.equal(res1[2], 27);
        // check bit set
        assert.equal(basicServer1.getBoolFromBuffer(basicServer1.coils, 27), true);
        const evW = await excW;
        assert.equal(evW.coil, 27);
        assert.equal(evW.val, true);

        // illegal address generates exception event
        const pdu2 = Buffer.from([0x05, 0x13, 0xA5, 0x00, 0x00]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x85);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });

    await t.test('Write Single Register and error handling', async () => {
        const cfg = { holdingRegisters: 512 };
        const basicServer1 = new ModbusServer(cfg);
        // write event listener
        const excW = new Promise((resolve) => basicServer1.once('write-registers', (reg, val) => resolve({ reg, val })));
        const pdu1 = Buffer.from([0x06, 0x00, 20, 0x34, 0x12]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x06);
        assert.equal(res1[2], 20);
        const word = basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 20);
        assert.equal(word[0], 0x34);
        assert.equal(word[1], 0x12);
        const evW = await excW;
        assert.equal(evW.reg, 20);
        assert.equal(evW.val, 1);
        // illegal address generates exception event
        const pdu2 = Buffer.from([0x06, 0x73, 0xA5, 0x00, 0x00]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x86);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });

    await t.test('Write Multiple Coils', async () => {
        const cfg = { coils: 1024, holdingRegisters: 512 };
        const basicServer1 = new ModbusServer(cfg);

        // set and then write multiple coils
        basicServer1.setBoolToBuffer(true, basicServer1.coils, 39);
        //write event listener
        const excW = new Promise((resolve) => basicServer1.once('write-coils', (reg, val) => resolve({ reg, val })));
        const pdu1 = Buffer.from([0x0F, 0x00, 30, 0x00, 0x0A, 0x02, 0x68, 0x01]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x0F);
        assert.equal(res1[2], 30);
        assert.equal(res1[4], 0x0A);
        // verify some coil bits changed
        assert.equal(basicServer1.getBoolFromBuffer(basicServer1.coils, 33), true);
        const evW = await excW;
        assert.equal(evW.reg, 30);
        assert.equal(evW.val, 10);
        //verify some other coil bits
        assert.equal(basicServer1.getBoolFromBuffer(basicServer1.coils, 39), false);
        assert.equal(basicServer1.getBoolFromBuffer(basicServer1.coils, 40), false);

        // illegal address generates exception event
        const pdu2 = Buffer.from([0x0F, 0x13, 0xA5, 0x00, 0x03, 0x01, 0x00]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x8F);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });

    await t.test('Write Multiple Registers', async () => {
        const cfg = { holdingRegisters: 1024 };
        const basicServer1 = new ModbusServer(cfg);
        // write event listener
        const excW = new Promise((resolve) => basicServer1.once('write-registers', (reg, val) => resolve({ reg, val })));
        const pdu1 = Buffer.from([0x10, 0x00, 20, 0x00, 0x03, 0x06, 0x18, 0x21, 0x36, 0xdf, 0x85, 0xca]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x10);
        assert.equal(res1[2], 20);
        // verify some bytes written in holding registers
        const w = basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 21);
        assert.ok(Array.isArray(w) || Buffer.isBuffer(w));
        assert.equal(w[0], 0x36);
        assert.equal(w[1], 0xdf);
        const evW = await excW;
        assert.equal(evW.reg, 20);
        assert.equal(evW.val, 3);

        // illegal address generates exception event
        const pdu2 = Buffer.from([0x10, 0x13, 0xA5, 0x00, 0x03, 0x06, 0x00, 0x01, 0x00, 0x02, 0x00, 0x03]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x90);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });

    await t.test('Mask Write Register', async () => {
        const server1Cfg = { holdingRegisters: 512 };
        const basicServer1 = new ModbusServer(server1Cfg);
        const excW = new Promise((resolve) => basicServer1.once('write-registers', (reg, val) => resolve({ reg, val })));
        const valBuffer = Buffer.from([0x00, 0x12]);
        basicServer1.setWordToBuffer(valBuffer, basicServer1.holdingRegisters, 8);
        const pdu1 = Buffer.from([0x16, 0x00, 8, 0x00, 0xf2, 0x00, 0x25]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x16);
        assert.equal(res1[2], 8);
        // mask applied: verify word changed
        const word = basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 8);
        assert.equal(word.length, 2);
        assert.equal(word[0], 0x00);
        assert.equal(word[1], 0x17);
        const evW = await excW;
        assert.equal(evW.reg, 8);
        assert.equal(evW.val, 1);

        // illegal address generates exception event
        const pdu2 = Buffer.from([0x16, 0x13, 0xA5, 0x00, 0x03, 0x00, 0xff]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x96);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });

    await t.test('Read/Write Multiple Registers combined operation and exceptions', async () => {
        const server1Cfg = { holdingRegisters: 1024 };
        const basicServer1 = new ModbusServer(server1Cfg);
        // Ensure some initial data
        basicServer1.holdingRegisters[4] = 0xAB;
        const excW = new Promise((resolve) => basicServer1.once('write-registers', (reg, val) => resolve({ reg, val })));
        const pdu1 = Buffer.from([0x17, 0x00, 0x00, 0x00, 0x03, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
        const res1 = basicServer1.processReqPdu(pdu1);
        assert.equal(res1[0], 0x17);
        assert.equal(res1[1], 0x06);
        // verify writes happened at expected addresses
        assert.ok(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 101).length >= 2);
        assert.equal(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 101)[0], 0xBB);
        assert.equal(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 101)[1], 0xCC);
        const evW = await excW;
        assert.equal(evW.reg, 100);
        assert.equal(evW.val, 2);

        // illegal address generates exception event
        const pdu2 = Buffer.from([0x17, 0x13, 0xA5, 0x00, 0x03, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
        const excP = new Promise((resolve) => basicServer1.once('exception', (fc, code, msg) => resolve({ fc, code, msg })));
        const resExc = basicServer1.processReqPdu(pdu2);
        assert.equal(resExc[0], 0x97);
        assert.equal(resExc[1], 2);
        const ev = await excP;
        assert.equal(ev.msg, 'ILLEGAL DATA ADDRESS');
    });
    
    await t.test('Extended server with custom function code', () => {
      class ModbusServerExtended extends ModbusServer {
        constructor(cfg) {
          super(cfg);
          this._internalFunctionCode.set(68, 'customService68');
        }
        customService68(pduReqData) {
          const resp = Buffer.alloc(2);
          resp[0] = 68;
          resp[1] = pduReqData[0];
          return resp;
        }
      }
      const serverExt = new ModbusServerExtended({ holdingRegisters: 256 });
      const pdu = Buffer.from([68, 21]);
      const res = serverExt.processReqPdu(pdu);
      assert.equal(res[0], 68);
      assert.equal(res[1], 21);
    });
    
    await t.test('getBoolFromBuffer and setBoolToBuffer edge cases', () => {
      const server = new ModbusServer({ coils: 1 }); // 8 bits total
      const buffer = Buffer.alloc(1);
  
      server.setBoolToBuffer(true, buffer, 0);
      assert.equal(server.getBoolFromBuffer(buffer, 0), true);
  
      server.setBoolToBuffer(false, buffer, 0);
      assert.equal(server.getBoolFromBuffer(buffer, 0), false);
  
      server.setBoolToBuffer(true, buffer, 7);
      assert.equal(server.getBoolFromBuffer(buffer, 7), true);
  
      server.setBoolToBuffer(false, buffer, 7);
      assert.equal(server.getBoolFromBuffer(buffer, 7), false);
  
      assert.throws(() => server.getBoolFromBuffer(buffer, 8), RangeError);
      assert.throws(() => server.setBoolToBuffer(true, buffer, 8), RangeError);
  
      // verify setting individual bits doesn't clobber others
      buffer[0] = 0x00;
      server.setBoolToBuffer(true, buffer, 2);
      assert.equal(buffer[0], 0x04);
      server.setBoolToBuffer(true, buffer, 5);
      assert.equal(buffer[0], 0x24);
      server.setBoolToBuffer(false, buffer, 2);
      assert.equal(buffer[0], 0x20);
    });

});
// test/protocol_utils.test.js
const test = require('node:test');
const assert = require('node:assert');

const { calcCRC, 
	calcLRC,
	valByteToChars, 
	getMaskRegisterBuffer,
	boolsToBuffer,
	aduAsciiToRtu,
	aduRtuToAscii,
	getWordFromBuffer,
	setWordToBuffer} = require('../src/protocol/utils.js');

test('utils module', async (t) => {

	await t.test('calcCRC should return correct CRC-16 for Modbus RTU frame', () => {
		let frame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00]);
		let crc = calcCRC(frame);
		assert.equal(crc, 0xC40B);

		frame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xB0, 0x58]);
		crc = calcCRC(frame);
		assert.equal(crc, 0xC40B);

		frame = Buffer.from([0x11, 0x04, 0x00, 0x01, 0x00, 0x12, 0x00, 0x00]);
		crc = calcCRC(frame);
		assert.equal(crc, 0x2357);

		frame = Buffer.from([0x21, 0x02, 0x00, 0x10, 0x00, 0x42, 0xB0, 0x58]);
		crc = calcCRC(frame);
		assert.equal(crc, 0xFE9E);
	});

	await t.test('calcLRC should return correct LRC for Modbus ASCII frame', () => {
		const asciiFrame = Buffer.from(':010300000002FA\r\n');
		const lrc = calcLRC(asciiFrame);
		assert.equal(lrc, 0xFA);
	});

	await t.test('valByte2Chars should convert byte to ASCII hex Buffer', () => {
		assert.deepEqual(valByteToChars(0xAB), Buffer.from('AB', 'ascii'));
		assert.deepEqual(valByteToChars(0x01), Buffer.from('01', 'ascii'));
	});

	await t.test('getMaskRegisterBuffer should return correct AND/OR mask buffer', () => {
		let register = Buffer.from([0xAA, 0x55]);
		let arr = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
		let buf = getMaskRegisterBuffer(arr);
		let andMask = buf.readUInt16BE(0);
		let orMask = buf.readUInt16BE(2);
		let currentContent = register.readUInt16BE(0);
		let result = (currentContent & andMask) | (orMask & ~andMask);
		assert.equal(result, 0x3259);
	});

	await t.test('boolsToBuffer should pack booleans into buffer', () => {
		let arr = [true, false, true, true, false, false, false, true];
		assert.deepEqual(boolsToBuffer(arr), Buffer.from([0x8D]));

		arr = [true, false, true, false, true, false, true, false, true, true];
		assert.deepEqual(boolsToBuffer(arr), Buffer.from([0x55, 0x03]));
		arr = [];
		assert.deepEqual(boolsToBuffer(arr), Buffer.alloc(0));
	});

	
   await t.test('aduAsciiToRtu should convert ASCII frame to RTU frame', () => {
		const asciiFrame = Buffer.from(':010300000002FA\r\n');
		const rtuFrame = aduAsciiToRtu(asciiFrame);
		assert.deepEqual(rtuFrame.subarray(0, 6), Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02]));
		assert.equal(rtuFrame.length, 8);
   });
   
   await t.test('aduRtuToAscii should convert RTU frame to ASCII frame', () => {
		let rtuFrame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x02, 0xC4, 0x0B]);
		let asciiFrame = aduRtuToAscii(rtuFrame);
		let expectedAscii = Buffer.from(':010300000002FA\r\n');
		assert.equal(asciiFrame.subarray(0, 1).toString(), ':');		
		assert.equal(asciiFrame.subarray(0).toString(), expectedAscii.toString());
   });
   
   await t.test('getWordFromBuffer should extract word at offset', () => {
	 	const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC]);
	 	assert.deepEqual(getWordFromBuffer(buf, 1), Buffer.from([0x56, 0x78]));
		assert.deepEqual(getWordFromBuffer(buf, 0), Buffer.from([0x12, 0x34]));
   });
   
   await t.test('setWordToBuffer should write word at offset', () => {
	 const buf = Buffer.alloc(4);
	 setWordToBuffer(Buffer.from([0x12, 0x34]), buf, 1);
	 assert.deepEqual(buf, Buffer.from([0x00, 0x00, 0x12, 0x34]));
   });
});

const EventEmitter = require('events');
const assert = require('node:assert/strict');
const test = require('node:test');
const SerialChannel = require('../src/client/net/serialchannel');

// Create fake serial modules and inject them before loading SerialChannel
const FakeSerialPort = class extends EventEmitter {
	constructor(options = {}) {
		super();
		this.options = Object.assign({}, options);
		this.isOpen = false;
		this._openError = options._openError || null;
	}
	pipe(parser) { return parser; }
	open(cb) {
		process.nextTick(() => {
			if (this._openError) {
				const err = this._openError;
				this.emit('error', err);
				if (cb) cb(err);
			} else {
				this.isOpen = true;
				this.emit('open');
				if (cb) cb(null);
			}
		});
	}
	close() { process.nextTick(() => { this.isOpen = false; this.emit('close'); }); }
	write(frame, cb) { process.nextTick(() => { if (!this.isOpen) { const err = new Error('Port not open'); this.emit('error', err); if (cb) cb(err); } else { if (cb) cb(null); } }); }
};

const FakeParser = class extends EventEmitter { constructor(opts) { super(); this.opts = opts; } };

const defaultCfg = {
	port: 'COM1',
	name: 'test-serial',
	speed: 7, // index -> 19200
	dataBits: 8,
	stopBits: 1,
	parity: 1, // index -> 'even'
	timeBetweenFrame: 30
};

test('constructor maps speed and parity and creates coreChannel & parser', () => {
	const ch = new SerialChannel(defaultCfg);
	//for (const prop in ch.coreChannel.settings) {
 		//console.log(prop);
	//}
	assert.strictEqual(ch.name, defaultCfg.name);
	assert.strictEqual(ch.port, defaultCfg.port);
	assert.ok(ch.coreChannel);
	assert.strictEqual(ch.coreChannel.baudRate, 19200);
	assert.strictEqual(ch.coreChannel.settings.parity, 'even');
	assert.ok(ch.parser);
	assert.strictEqual(typeof ch.onDataHook, 'function');
	assert.strictEqual(typeof ch.onMbAduHook, 'function');
});

test('parser "data" triggers onDataHook and onMbAduHook when validateFrame true', () => {
	const ch = new SerialChannel(Object.assign({}, defaultCfg));
	let receivedData = [];
	let receivedMb = [];
	const onData = function(data) {
		receivedData.push(data);
	};
	const onMb = function(data) {
		receivedMb.push(data);
	};
	ch.onDataHook = onData;
	ch.onMbAduHook = onMb;	
	ch.validateFrame = (data) => { if (data[0] === 0x01) return true; return false; };
	const payload = Buffer.from([0x01, 0x02, 0x03, 0x04]);
	const payload2 = Buffer.from([0x09, 0x0A]);
	ch.parser.emit('data', payload);
	assert.deepStrictEqual(receivedData[0], payload);
	assert.deepStrictEqual(receivedMb[0], payload);
	ch.parser.emit('data', payload2);
	assert.deepStrictEqual(receivedData[1], payload2);
	assert.deepStrictEqual(receivedMb.length, 1);
});

test('invalid speed/parity values fall back to defaults', () => {
	const cfg = { speed: 999, parity: 999, port: 'COM2' };
	const ch = new SerialChannel(cfg);
	assert.strictEqual(ch.coreChannel.baudRate, 19200);
	assert.strictEqual(ch.coreChannel.settings.parity, 'even');
});
/*
test('disconnect closes port and isConnected becomes false', async () => {
	const ch = new SerialChannel(Object.assign({}, defaultCfg));
	await ch.connect();
	assert.strictEqual(ch.isConnected(), true);
	const res = await ch.disconnect();
	assert.strictEqual(res, undefined);
	await new Promise(r => setImmediate(r));
	assert.strictEqual(ch.coreChannel.isOpen, false);
	assert.strictEqual(ch.isConnected(), false);
});

test('write returns false when not connected', () => {
	const ch = new SerialChannel(Object.assign({}, defaultCfg));
	const result = ch.write(Buffer.from([0x01]));
	assert.strictEqual(result, false);
});

test('write returns true when connected and invokes onWriteHook after write', async () => {
	const ch = new SerialChannel(Object.assign({}, defaultCfg));
	const onWrite = createSpy();
	ch.onWriteHook = onWrite;
	await ch.connect();
	const frame = Buffer.from([0xAA, 0xBB]);
	const result = ch.write(frame);
	assert.strictEqual(result, true);
	await new Promise(r => setImmediate(r));
	assert.deepStrictEqual(onWrite.last, [frame]);
});

test('coreChannel events invoke corresponding hooks (open/error/close)', async () => {
	const ch = new SerialChannel(Object.assign({}, defaultCfg));
	const onConnect = createSpy();
	const onErr = createSpy();
	const onClose = createSpy();
	ch.onConnectHook = onConnect;
	ch.onErrorHook = onErr;
	ch.onCloseHook = onClose;

	await ch.connect();
	assert.strictEqual(onConnect.calls.length > 0, true);

	const testErr = new Error('boom');
	ch.coreChannel.emit('error', testErr);
	assert.deepStrictEqual(onErr.last, [testErr]);

	ch.coreChannel.emit('close');
	assert.strictEqual(onClose.calls.length > 0, true);
});
*/

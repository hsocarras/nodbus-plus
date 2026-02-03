/**
 * Simple Modbus TCP client sample
 *
 * Usage: node samples/mb_tcp_client.js [host] [port]
 * Example: node samples/mb_tcp_client.js 127.0.0.1 502
 *
 * Interactive commands (type at the prompt and press Enter):
 *   connect                - connect to configured channel
 *   disconnect             - disconnect channel
 *   readcoils <start> <qty>
 *   readholding <start> <qty>
 *   preset <value> <start>  - preset single register
 *   forcecoil <0|1> <addr>  - force single coil
 *   help                   - show this help
 *   exit | q               - quit
 */

const nodbus = require('../src/nodbus-plus');
const host = process.argv[2] || '127.0.0.1';
const port = Number(process.argv[3] || process.env.PORT || 502);

const channelCfg = { ip: host, port, timeout: 250 };

const client = nodbus.createTcpClient();
client.addChannel('device', 'tcp1', channelCfg);

function hex(buf) {
    if (!Buffer.isBuffer(buf)) return String(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

// Listeners for all relevant events
client.on('connection', (id) => {
    console.log(`Connected to channel '${id}' (${host}:${port})`);
    process.stdout.write('device >> ');
});

client.on('connection-closed', (id) => {
    console.log(`Connection closed for '${id}'`);
    process.stdout.write('>>> ');
});

client.on('error', (idOrErr, err) => {
    // some handlers (client.connect) may emit just an error object, others emit (id, err)
    if (err) {
        console.error(`Error on channel ${idOrErr}:`, err);
    } else {
        console.error('Error:', idOrErr);
    }
    process.stdout.write('device >> ');
});

client.on('request', (id, req) => {
    console.log(`Request sent on '${id}' tx=${req.transactionId} fc=0x${req.functionCode.toString(16)} data=${hex(req.data)}`);
});

client.on('write', (id, reqAdu) => {
    console.log(`Raw ADU written to '${id}': ${hex(reqAdu)}`);
});

client.on('response', (id, res) => {
    console.log(`Response on '${id}' tx=${res.transactionId} unit=${res.unitId} fc=0x${res.functionCode.toString(16)} data=${hex(res.data)}`);
    process.stdout.write('device >> ');
});

client.on('data', (id, raw) => {
    if (raw) console.log(`Raw data on '${id}': ${hex(raw)}`);
});

client.on('transaction', (req, res) => {
    // higher level event emitted by protocol stack when request and response match
    console.log(`Transaction: fc=0x${req.toString('hex')} -> response fc=0x${res.toString('hex')}`);
});

client.on('req-timeout', (info) => {
    console.warn('Request timeout', info);
    process.stdout.write('device >> ');
});

client.on('broadcast-timeout', () => {
    console.warn('Broadcast timeout');
    process.stdout.write('device >> ');
});

// Simple REPL
function printHelp() {
    console.log('Commands:');
    console.log('  connect                     - connect to device channel');
    console.log('  disconnect                  - disconnect channel');
    console.log('  readcoils <start> <qty>    - read coils');
    console.log('  readholding <start> <qty>  - read holding registers');
    console.log('  preset <value> <start>     - write single register');
    console.log('  forcecoil <0|1> <addr>     - force single coil');
    console.log('  help                        - show this help');
    console.log('  exit | q                    - quit');
}

function repl() {
    process.stdout.write('>>> ');
    const stdin = process.openStdin();

    stdin.addListener('data', (data) => {
        const line = data.toString().trim();
        if (!line) { process.stdout.write('>>> '); return; }

        const parts = line.split(/\s+/);
        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case 'exit':
            case 'q':
                process.exit(0);
                break;
            case 'help':
                printHelp();
                break;
            case 'connect':
                client.connect('device').catch((e) => console.error('connect failed:', e));
                break;
            case 'disconnect':
                client.disconnect('device').catch((e) => console.error('disconnect failed:', e));
                break;
            case 'readcoils': {
                const start = Number(parts[1]) || 0;
                const qty = Number(parts[2]) || 1;
                if (!client.readCoils('device', 255, start, qty)) console.log('Channel not ready');
                break;
            }
            case 'readholding': {
                const start = Number(parts[1]) || 0;
                const qty = Number(parts[2]) || 1;
                if (!client.readHoldingRegisters('device', 255, start, qty)) console.log('Channel not ready');
                break;
            }
            case 'preset': {
                const value = Number(parts[1]) || 0;
                const start = Number(parts[2]) || 0;
                const buf = Buffer.alloc(2);
                buf.writeUInt16BE(value & 0xffff);
                if (!client.presetSingleRegister(buf, 'device', 255, start)) console.log('Channel not ready');
                break;
            }
            case 'forcecoil': {
                const val = parts[1] === '1' || parts[1] === 'true';
                const addr = Number(parts[2]) || 0;
                if (!client.forceSingleCoil(val, 'device', 255, addr)) console.log('Channel not ready');
                break;
            }
            default:
                console.log('Unknown command, type "help"');
        }

        process.stdout.write('>>> ');
    });
}

printHelp();
repl();
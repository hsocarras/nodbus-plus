/**
 * Modbus Serial sample server (serial-over-tcp)
 *
 * Usage:
 *   node samples/mb_serial_server.js [address] [mode] [log] [port]
 *
 * Arguments:
 *   address - Modbus slave address (default: 1)
 *   mode    - serial mode: auto | rtu | ascii (default: auto)
 *   log     - logging mode: all | req | req-res | raw | verbose | help (default: all)
 *   port    - optional: override listening port (default: 502 or from PORT env)
 *
 * Examples:
 *   node samples/mb_serial_server.js 1 rtu all 502
 *   PORT=1502 node samples/mb_serial_server.js 5 ascii req-res
 */

const nodbus = require('../src/nodbus-plus');
const argv = process.argv.slice(2);

const addressArg = argv[0];
const modeArg = (argv[1] || 'auto').toLowerCase();
const logArg = (argv[2] || 'all').toLowerCase();
const portArg = argv[3] || process.env.PORT;

if (['help', '-h', '--help'].includes(logArg) || ['help', '-h', '--help'].includes(modeArg)) {
    console.log('Usage: node samples/mb_serial_server.js [address] [mode] [log] [port]');
    console.log('mode: auto | rtu | ascii');
    console.log('log: all | req | req-res | raw | verbose | help');
    process.exit(0);
}

const cfg = {
    address: Number(addressArg) || 1,
    transmitionMode: modeArg === 'rtu' ? 1 : modeArg === 'ascii' ? 2 : 0, // 0=auto,1=rtu,2=ascii
    inputs: 2048,
    coils: 2048,
    holdingRegisters: 10000,
    inputRegisters: 10000,
    port: portArg ? Number(portArg) : 502,
};

const modeVerbose = logArg === 'verbose' || logArg === 'all';

function hex(buf) {
    if (!Buffer.isBuffer(buf)) return String(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

const server = nodbus.createSerialServer('tcp', cfg);

server.on('listening', (p) => {
    console.log(`Serial server listening on port ${p} (address=${cfg.address}, mode=${modeArg})`);
});

server.on('connection', (sock) => {
    console.log('New connection:', sock.remoteAddress + ':' + sock.remotePort);
    if (modeVerbose) console.log('Active connections:', server.net.activeConnections.length);
});

server.on('connection-closed', (info) => {
    console.log('Connection closed:', info);
});

server.on('data', (sock, data) => {
    if (logArg === 'raw' || modeVerbose) {
        console.log(`Raw data from ${sock.remoteAddress}:${sock.remotePort} -> ${hex(data)}`);
    }
});

server.on('request', (sock, req) => {
    if (['req', 'req-res', 'all', 'verbose'].includes(logArg)) {
        console.log(`Request from ${sock.remoteAddress}:${sock.remotePort} - addr=${req.address} fc=0x${req.functionCode.toString(16)} data=${hex(req.data)}`);
    }
});

server.on('response', (sock, res) => {
    if (['req-res', 'all', 'verbose'].includes(logArg)) {
        console.log(`Response to ${sock.remoteAddress}:${sock.remotePort} - addr=${res.address} fc=0x${res.functionCode.toString(16)} data=${hex(res.data)}`);
    }
});

server.on('write', (sock, frame) => {
    if (modeVerbose) console.log(`Frame written to ${sock.remoteAddress}:${sock.remotePort}: ${hex(frame)}`);
});

server.on('error', (err) => {
    console.error('Server error:', err && err.stack ? err.stack : err);
});

server.on('closed', () => {
    console.log('Server closed');
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, stopping server...');
    try { server.stop(); } catch (e) { console.error('Error while stopping server:', e); }
    setTimeout(() => process.exit(0), 200);
});

server.start();
console.log(`Starting Modbus serial server (address=${cfg.address}, mode=${modeArg}, log=${logArg}) on port ${cfg.port}`);
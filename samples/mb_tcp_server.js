/**
 * Simple Modbus TCP server sample
 *
 * Usage:
 *   node samples/mb_tcp_server.js [mode] [port]
 *
 * Modes:
 *   all      - log all server activity (default)
 *   req      - log 'request' events
 *   req-res  - log 'request' and 'response' events
 *   raw      - log raw 'data' events
 *   verbose  - same as 'all' but with extra debug info
 *   help     - print this help
 *
 * Examples:
 *   node samples/mb_tcp_server.js all 502
 *   PORT=1502 node samples/mb_tcp_server.js req
 */

const nodbus = require('../src/nodbus-plus');
const argv = process.argv.slice(2);

// Default server configuration; port can be overridden by CLI or env
const cfg = {
    inputs: 2048,
    coils: 2048,
    holdingRegisters: 1000,
    inputRegisters: 1000,
    port: process.env.PORT ? Number(process.env.PORT) : 502,
};

// CLI parsing
const mode = (argv[0] || 'all').toLowerCase();
const portArg = argv[1];
if (portArg) cfg.port = Number(portArg);

if (['help', '-h', '--help'].includes(mode)) {
    console.log('Usage: node samples/mb_tcp_server.js [mode] [port]');
    console.log('Modes: all | req | req-res | raw | verbose | help');
    process.exit(0);
}

const verbose = mode === 'verbose' || mode === 'all';

// Helper to format buffer as hex
function hex(buf) {
    if (!Buffer.isBuffer(buf)) return String(buf);
    return Array.from(buf)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
}

const server = nodbus.createTcpServer('tcp', cfg);

// Generic listeners for all useful server events
server.on('listening', (p) => {
    console.log(`Server listening on port ${p}`);
});

server.on('connection', (sock) => {
    console.log('New connection accepted:', sock.remoteAddress + ':' + sock.remotePort);
    if (verbose) console.log('Total connections:', server.net.activeConnections.length);
});

server.on('connection-closed', (info) => {
    console.log('Connection closed:', info);
});

server.on('data', (sock, data) => {
    if (mode === 'raw' || verbose) {
        console.log(`Raw data from ${sock.remoteAddress}:${sock.remotePort} -> ${hex(data)}`);
    }
});

server.on('request', (sock, req) => {
    if (['req', 'req-res', 'all', 'verbose'].includes(mode)) {
        console.log(`Request from ${sock.remoteAddress}:${sock.remotePort} - tx=${req.transactionId} unit=${req.unitId} fc=0x${req.functionCode.toString(16)} data=${hex(req.data)}`);
    }
});

server.on('response', (sock, res) => {
    if (['req-res', 'all', 'verbose'].includes(mode)) {
        console.log(`Response to ${sock.remoteAddress}:${sock.remotePort} - tx=${res.transactionId} unit=${res.unitId} fc=0x${res.functionCode.toString(16)} data=${hex(res.data)}`);
    }
});

server.on('write', (sock, frame) => {
    if (verbose) console.log(`Frame written to ${sock.remoteAddress}:${sock.remotePort}: ${hex(frame)}`);
});

server.on('error', (err) => {
    console.error('Server error:', err && err.stack ? err.stack : err);
});

server.on('closed', () => {
    console.log('Server closed');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nSIGINT received, stopping server...');
    try {
        server.stop();
    } catch (e) {
        console.error('Error while stopping server:', e);
    }
    // give a moment for sockets to close
    setTimeout(() => process.exit(0), 200);
});

// Start the server
server.start();

console.log(`Starting Modbus TCP server (mode=${mode}) on port ${cfg.port}`);
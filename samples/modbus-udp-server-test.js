var nodbus = require('../src/nodbus-plus');

var modbusTCPServer = new nodbus.ModbusTcpServer(503, 'udp4');


modbusTCPServer.on('listening', function(port){
    console.log('Server listening on: ' + port);
});

modbusTCPServer.on('values', function(reference, address){
	console.log('data write on: ' + (reference == '0x' ? 'coils' : 'holding registers'))
	address.forEach(function(value, key){
		console.log(key + ': ' + value);
	})
})

modbusTCPServer.on('connection', function(socket){
    console.log('New connection form: ' + socket.remoteAddress);
});

modbusTCPServer.on('error', function(err){
    console.log(err)
});

modbusTCPServer.on('closed', function(){
    console.log('server closed');
});

modbusTCPServer.on('client-disconnect', function(socket){
    console.log('Client ' + socket.remoteAddress + ' disconnected');
});

modbusTCPServer.on('indication', function(client, adubuffer){
    console.log('Indication Recieved from' + client.remoteAddress);
    console.log(adubuffer);
});

modbusTCPServer.on('request', function(client, req){
    console.log('Indication Recieved from' + client.remoteAddress);
    console.log(req);
});

modbusTCPServer.on('response', function(resp){
    console.log('Response:');
    console.log(resp.adu.aduBuffer);
});


modbusTCPServer.SetRegisterValue(1, 'inputs', 2);
modbusTCPServer.SetRegisterValue(1, 'inputs', 3);
modbusTCPServer.SetRegisterValue(1, 'inputs', 7);
modbusTCPServer.SetRegisterValue(1, 'inputs', 11);


modbusTCPServer.SetRegisterValue(1, 'coils', 1);
modbusTCPServer.SetRegisterValue(1, 'coils', 6);
modbusTCPServer.SetRegisterValue(1, 'coils', 9);
modbusTCPServer.SetRegisterValue(1, 'coils', 15);

modbusTCPServer.SetRegisterValue(59, 'holding', 0, 'uint');
modbusTCPServer.SetRegisterValue(-358, 'holding', 2, 'int');
modbusTCPServer.SetRegisterValue(3.14, 'holding', 3, 'float');
modbusTCPServer.SetRegisterValue(0x12, 'holding', 5);
modbusTCPServer.SetRegisterValue(0x9E36, 'holding', 6);
modbusTCPServer.SetRegisterValue(3598.59, 'holding', 9, 'double');

modbusTCPServer.SetRegisterValue(-27, 'inputs-registers', 1, 'int');
modbusTCPServer.SetRegisterValue(-34752648, 'inputs-registers', 2, 'int32');
modbusTCPServer.SetRegisterValue(123456789, 'inputs-registers', 5, 'uint32');


modbusTCPServer.Start();

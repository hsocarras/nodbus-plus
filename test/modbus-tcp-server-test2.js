var nodbus = require('../src/nodbus-plus');

var modbusTCPServer = new nodbus.ModbusTcpServer(500);


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

modbusTCPServer.on('indication', function(adubuffer){
    console.log('Indication Recieved');
    console.log(adubuffer);
});

modbusTCPServer.on('response', function(resp){
    console.log('Response:');
    console.log(resp);
});


modbusTCPServer.SetData(1, 'inputs', 2);
modbusTCPServer.SetData(1, 'inputs', 3);
modbusTCPServer.SetData(1, 'inputs', 7);
modbusTCPServer.SetData(1, 'inputs', 11);


modbusTCPServer.SetData(1, 'coils', 1);
modbusTCPServer.SetData(1, 'coils', 6);
modbusTCPServer.SetData(1, 'coils', 9);
modbusTCPServer.SetData(1, 'coils', 15);

modbusTCPServer.SetData(59, 'holding', 0, 'uint');
modbusTCPServer.SetData(-358, 'holding', 2, 'int');
modbusTCPServer.SetData(3.14, 'holding', 3, 'float');
modbusTCPServer.SetData(0x12, 'holding', 5);
modbusTCPServer.SetData(0x9E36, 'holding', 6);
modbusTCPServer.SetData(3598.59, 'holding', 9, 'double');

modbusTCPServer.SetData(-27, 'inputs-registers', 1, 'int');
modbusTCPServer.SetData(-34752648, 'inputs-registers', 2, 'int32');
modbusTCPServer.SetData(123456789, 'inputs-registers', 5, 'uint32');

console.log(modbusTCPServer.GetData('holding',0,'uint'));
console.log(modbusTCPServer.GetData('holding',2,'int'));
console.log(modbusTCPServer.GetData('holding',3,'float'));
console.log(modbusTCPServer.GetData('holding',9,'double'));
console.log(modbusTCPServer.GetData(3,2,'int32'));
console.log(modbusTCPServer.GetData(3,5,'uint32'));
console.log(modbusTCPServer.GetData(1,7));


modbusTCPServer.Start();

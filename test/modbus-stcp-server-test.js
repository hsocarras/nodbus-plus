var nodbus = require('..');

var modbusSTCPServer = nodbus.CreateSlave(502, 1);


modbusSTCPServer.on('listening', function(port){
    console.log('Server listening on: ' + port);
});

modbusSTCPServer.on('values', function(reference, address){
	console.log('data write on: ' + (reference == '0x' ? 'coils' : 'holding registers'))
	address.forEach(function(value, key){
		console.log(key + ': ' + value);
	})
})

modbusSTCPServer.on('connection', function(socket){
    console.log('New connection form: ' + socket.remoteAddress);
});

modbusSTCPServer.on('error', function(err){
    console.log(err)
});

modbusSTCPServer.on('closed', function(){
    console.log('server closed');
});

modbusSTCPServer.on('client-disconnect', function(socket){
    console.log('Client ' + socket.remoteAddress + ' disconnected');
});

modbusSTCPServer.on('indication', function(adubuffer){
    console.log('Indication Recieved');
    console.log(adubuffer);
});

modbusSTCPServer.on('response', function(resp){
    console.log('Response:');
    console.log(resp);
});

modbusSTCPServer.SetData(1, 'inputs', 2);
modbusSTCPServer.SetData(1, 'inputs', 3);
modbusSTCPServer.SetData(1, 'inputs', 7);
modbusSTCPServer.SetData(1, 'inputs', 11);


modbusSTCPServer.SetData(1, 'coils', 1);
modbusSTCPServer.SetData(1, 'coils', 6);
modbusSTCPServer.SetData(1, 'coils', 9);
modbusSTCPServer.SetData(1, 'coils', 15);

modbusSTCPServer.SetData(59, 'holding', 0, 'uint');
modbusSTCPServer.SetData(-358, 'holding', 2, 'int');
modbusSTCPServer.SetData(3.14, 'holding', 3, 'float');
modbusSTCPServer.SetData(3598.59, 'holding', 9, 'double');

modbusSTCPServer.SetData(-27, 'inputs-registers', 1, 'int');
modbusSTCPServer.SetData(-34752648, 'inputs-registers', 2, 'int32');
modbusSTCPServer.SetData(123456789, 'inputs-registers', 5, 'uint32');

console.log(modbusSTCPServer.GetData('holding',0,'uint'));
console.log(modbusSTCPServer.GetData('holding',2,'int'));
console.log(modbusSTCPServer.GetData('holding',3,'float'));
console.log(modbusSTCPServer.GetData('holding',9,'double'));
console.log(modbusSTCPServer.GetData(3,2,'int32'));
console.log(modbusSTCPServer.GetData(3,5,'uint32'));
console.log(modbusSTCPServer.GetData(1,7));


modbusSTCPServer.Start();

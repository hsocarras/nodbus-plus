var nodbus = require('..');

var modbusSTCPServer = nodbus.CreateSlave(502, 'tcp', 2, 'auto');


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

modbusSTCPServer.on('indication', function(client, adubuffer){
    console.log('Indication Recieved from' + client.remoteAddress);
    console.log(adubuffer);
});

modbusSTCPServer.on('request', function(client, req){
    console.log('Request Recieved from' + client.remoteAddress);
    console.log(req);
});

modbusSTCPServer.on('response', function(resp){
    console.log('Response:');
    console.log(resp.adu.aduBuffer);
});

modbusSTCPServer.on('modbus_exception', function(exc){
    console.log(exc);    
});

modbusSTCPServer.SetRegisterValue(1, 'inputs', 2);
modbusSTCPServer.SetRegisterValue(1, 'inputs', 3);
modbusSTCPServer.SetRegisterValue(1, 'inputs', 7);
modbusSTCPServer.SetRegisterValue(1, 'inputs', 11);


modbusSTCPServer.SetRegisterValue(1, 'coils', 1);
modbusSTCPServer.SetRegisterValue(1, 'coils', 6);
modbusSTCPServer.SetRegisterValue(1, 'coils', 9);
modbusSTCPServer.SetRegisterValue(1, 'coils', 15);

modbusSTCPServer.SetRegisterValue(59, 'holding', 0, 'uint');
modbusSTCPServer.SetRegisterValue(-358, 'holding', 2, 'int');
modbusSTCPServer.SetRegisterValue(3.14, 'holding', 3, 'float');
modbusSTCPServer.SetRegisterValue(0x12, 'holding', 5);
modbusSTCPServer.SetRegisterValue(0x9E36, 'holding', 6);
modbusSTCPServer.SetRegisterValue(3598.59, 'holding', 9, 'double');
modbusSTCPServer.SetRegisterValue(-27, 'inputs-registers', 1, 'int');
modbusSTCPServer.SetRegisterValue(-34752648, 'inputs-registers', 2, 'int32');
modbusSTCPServer.SetRegisterValue(123456789, 'inputs-registers', 5, 'uint32');

console.log(modbusSTCPServer.GetRegisterValue('holding',0,'uint'));
console.log(modbusSTCPServer.GetRegisterValue('holding',2,'int'));
console.log(modbusSTCPServer.GetRegisterValue('holding',3,'float'));
console.log(modbusSTCPServer.GetRegisterValue('holding',9,'double'));
console.log(modbusSTCPServer.GetRegisterValue(3,2,'int32'));
console.log(modbusSTCPServer.GetRegisterValue(3,5,'uint32'));
console.log(modbusSTCPServer.GetRegisterValue(1,7));


modbusSTCPServer.Start();

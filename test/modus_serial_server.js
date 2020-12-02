var nodbus = require('..');

var modbusSerialServer = nodbus.CreateSlave('COM3', 'serial', 2, 'auto');


modbusSerialServer.on('listening', function(port){
    console.log('Server listening on: ' + port);
});

modbusSerialServer.on('values', function(reference, address){
	console.log('data write on: ' + (reference == '0x' ? 'coils' : 'holding registers'))
	address.forEach(function(value, key){
		console.log(key + ': ' + value);
	})
})

modbusSerialServer.on('connection', function(socket){
    console.log('New connection form: ' + socket.remoteAddress);
});

modbusSerialServer.on('error', function(err){
    console.log(err)
});

modbusSerialServer.on('closed', function(){
    console.log('server closed');
});

modbusSerialServer.on('client-disconnect', function(socket){
    console.log('Client ' + socket.remoteAddress + ' disconnected');
});

modbusSerialServer.on('indication', function(client, adubuffer){
    console.log('Indication Recieved from' + client);
    console.log(adubuffer);
});

modbusSerialServer.on('request', function(client, req){
    console.log('Request Recieved from' + client.remoteAddress);
    console.log(req);
});

modbusSerialServer.on('response', function(resp){
    console.log('Response:');
    console.log(resp.adu.aduBuffer);
});

modbusSerialServer.on('modbus_exception', function(exc){
    console.log(exc);    
});

modbusSerialServer.SetRegisterValue(1, 'inputs', 2);
modbusSerialServer.SetRegisterValue(1, 'inputs', 3);
modbusSerialServer.SetRegisterValue(1, 'inputs', 7);
modbusSerialServer.SetRegisterValue(1, 'inputs', 11);


modbusSerialServer.SetRegisterValue(1, 'coils', 1);
modbusSerialServer.SetRegisterValue(1, 'coils', 6);
modbusSerialServer.SetRegisterValue(1, 'coils', 9);
modbusSerialServer.SetRegisterValue(1, 'coils', 15);

modbusSerialServer.SetRegisterValue(59, 'holding', 0, 'uint');
modbusSerialServer.SetRegisterValue(-358, 'holding', 2, 'int');
modbusSerialServer.SetRegisterValue(3.14, 'holding', 3, 'float');
modbusSerialServer.SetRegisterValue(0x12, 'holding', 5);
modbusSerialServer.SetRegisterValue(0x9E36, 'holding', 6);
modbusSerialServer.SetRegisterValue(3598.59, 'holding', 9, 'double');
modbusSerialServer.SetRegisterValue(-27, 'inputs-registers', 1, 'int');
modbusSerialServer.SetRegisterValue(-34752648, 'inputs-registers', 2, 'int32');
modbusSerialServer.SetRegisterValue(123456789, 'inputs-registers', 5, 'uint32');

console.log(modbusSerialServer.GetRegisterValue('holding',0,'uint'));
console.log(modbusSerialServer.GetRegisterValue('holding',2,'int'));
console.log(modbusSerialServer.GetRegisterValue('holding',3,'float'));
console.log(modbusSerialServer.GetRegisterValue('holding',9,'double'));
console.log(modbusSerialServer.GetRegisterValue(3,2,'int32'));
console.log(modbusSerialServer.GetRegisterValue(3,5,'uint32'));
console.log(modbusSerialServer.GetRegisterValue(1,7));


modbusSerialServer.Start();

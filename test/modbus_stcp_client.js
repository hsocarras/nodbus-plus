var nodbus = require('..');

var modbusSTCPClient = nodbus.CreateMaster('eth', 'rtu');

var value;

modbusSTCPClient.AddSlave ('plc1', {ipAddress:"192.168.1.46", port:101, timeout:50, modbusAddress:6});
//modbusSTCPClient.AddSlave ('plc2', {port:501, timeout:100, modbusAddress:1, serialMode:'ascii'});

modbusSTCPClient.on('data', function(id, data){
  console.log('Data from' + id + ': \n');
  console.log(data);
})

modbusSTCPClient.on('timeout', function(id){
  console.log(id+':timeout');
});

modbusSTCPClient.on('error', function(id, err){
  console.log(id + ':error')
  console.log(err)
});

modbusSTCPClient.on('modbus_exception', function(id, modbusError){
  console.log(id + ': '+ modbusError);
});

modbusSTCPClient.on('connect', function(id){
  console.log('connection stablished whit ' + id);
});

modbusSTCPClient.on('indication', function(id, data){
console.log('indication send to ' + id);
console.log(data)
});

modbusSTCPClient.on('disconnect', function(id, err){
console.log(id+' disconnected');
console.log(err)
});

modbusSTCPClient.on('raw_data', function(id, data){
console.log('buffer from ' + id)
console.log(data);
})

modbusSTCPClient.on('idle', function(id){
console.log(id +' is waiting');
})

function Test(){
console.log('starting test')
//provando evento modbus exeption
//modbusSTCPClient.ReadHoldingRegisters(15265, 1);
/*
//provando funcion 1
setTimeout(function(){
  console.log('leyendo coils de la 0 a la 7');
  modbusSTCPClient.ReadCoilStatus('plc1', 0, 8);
  modbusSTCPClient.ReadCoilStatus('plc2', 0, 8);
  modbusSTCPClient.ReadCoilStatus('plc5', 0, 8);
}, 100);


//provando funcion 2
setTimeout(function(){
  console.log('leyendo inputs de la 3 a la 8');
  modbusSTCPClient.ReadInputStatus('plc1', 3, 6);
  modbusSTCPClient.ReadInputStatus('plc2', 3, 6);
}, 150);

*/
//provando funcion 3
setTimeout(function(){
  console.log('leyendo holdingRegisters del 0 al 3');
  modbusSTCPClient.ReadHoldingRegisters('plc1', 0, 4);
  modbusSTCPClient.ReadHoldingRegisters('plc2', 0, 4);
}, 200);

/*
//provando funcion 4
setTimeout(function(){
  console.log('leyendo inputsRegisters del 1 al 5');
  modbusSTCPClient.ReadInputRegisters('plc1', 1, 5);
  modbusSTCPClient.ReadInputRegisters('plc2', 1, 5);
}, 250);


//provando funcion 5
setTimeout(function(){
  console.log('forzando la coil 5 a 1');
  modbusSTCPClient.ForceSingleCoil('plc1', true, 5);
  modbusSTCPClient.ForceSingleCoil('plc2', true, 5);
}, 300)



//provando funcion 6
setTimeout(function(){
  console.log('forzando el registro 14 a 12536');
  modbusSTCPClient.PresetSingleRegister('plc1', 12536, 14);
  modbusSTCPClient.PresetSingleRegister('plc2', 12536, 14);
}, 350)


//provando funcion 15
setTimeout(function(){
  console.log('forzando las coils 3 al 12 a 1011001010');
  values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
  modbusSTCPClient.ForceMultipleCoils('plc1', values, 3);
  modbusSTCPClient.ForceMultipleCoils('plc2', values, 3);
}, 400)

//provando funcion 16
setTimeout(function(){
  console.log('forzando los registros 16 al 21 a [3.14, -54, 0, 7852689]');
  values = [3.14, -54, 0, 7852689];
  modbusSTCPClient.PresetMultipleRegisters('plc1', values , 16);
  modbusSTCPClient.PresetMultipleRegisters('plc2', values , 16);
}, 450)

//provando funcion 22
setTimeout(function(){
  console.log('mask registro 5');
  values = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
  modbusSTCPClient.MaskHoldingRegister('plc1', values , 5);
  modbusSTCPClient.MaskHoldingRegister('plc2', values , 5);    
}, 500)
*/
}
/*
setTimeout(function(){
console.log('check connection');
console.log(modbusSTCPClient.isReady('plc1'));
},1400);
*/
//modbusSTCPClient.once('ready', Test);

let promise = modbusSTCPClient.Start();

promise.then(function(value){
console.log('conected to:');
console.log(value);
Test();
}, function(value){
console.log('fail to conect to');
console.log(value);
Test();
});
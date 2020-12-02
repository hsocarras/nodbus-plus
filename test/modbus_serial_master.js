var nodbus = require('../src/nodbus-plus');

var modbusSerialClient = nodbus.CreateMaster('serial', 'serial', 'COM3');

var value;

modbusSerialClient.AddSlave ('plc1', { port:'COM3', timeout:150, address:2});
modbusSerialClient.AddSlave ('plc2', {port:'COM1', timeout:100, modbusAddress:1, serialMode:'ascii'});

modbusSerialClient.on('data', function(id, data){
  console.log('Data from' + id + ': \n');
  console.log(data);
})

modbusSerialClient.on('reponse', function(resp){
  console.log('response: ' + resp.id);  
})

modbusSerialClient.on('timeout', function(id, req){
  console.log(id+':timeout on ' + req.id);
});

modbusSerialClient.on('error', function(id, err){
  console.log(id + ':error')
  console.log(err)
});

modbusSerialClient.on('modbus_exception', function(id, modbusError){
  console.log(id + ': '+ modbusError);
});

modbusSerialClient.on('connect', function(id){
  console.log('connection stablished whit ' + id);
});

modbusSerialClient.on('indication', function(id, aduBuffer){
  console.log('indication send to ' + id);
	console.log(aduBuffer)
});

modbusSerialClient.on('disconnect', function(id, err){
console.log(id+' disconnected');
console.log(err)
});

modbusSerialClient.on('raw_data', function(id, data){
console.log('buffer from ' + id)
console.log(data);
})

modbusSerialClient.on('idle', function(id){
console.log(id +' is waiting');
})

function Test(){
console.log('starting test')
//provando evento modbus exeption
//modbusSerialClient.ReadHoldingRegisters(15265, 1);

//provando funcion 1
setTimeout(function(){
  console.log('leyendo coils de la 0 a la 9');
  modbusSerialClient.ReadCoilStatus('plc1', 0, 10);
  modbusSerialClient.ReadCoilStatus('plc2', 0, 10);
  modbusSerialClient.ReadCoilStatus('plc5', 0, 10);
}, 1);


//provando funcion 2
setTimeout(function(){
  console.log('leyendo inputs de la 3 a la 8');
  modbusSerialClient.ReadInputStatus('plc1', 3, 6);
  modbusSerialClient.ReadInputStatus('plc2', 3, 6);
}, 150);


//provando funcion 3
setTimeout(function(){
  console.log('leyendo holdingRegisters del 0 al 3');
  modbusSerialClient.ReadHoldingRegisters('plc1', 0, 4);
  modbusSerialClient.ReadHoldingRegisters('plc2', 0, 4);
}, 300);


//provando funcion 4
setTimeout(function(){
  console.log('leyendo inputsRegisters del 1 al 5');
  modbusSerialClient.ReadInputRegisters('plc1', 1, 5);
  modbusSerialClient.ReadInputRegisters('plc2', 1, 5);
}, 450);


//provando funcion 5
setTimeout(function(){
  console.log('forzando la coil 5 a 1');
  modbusSerialClient.ForceSingleCoil('plc1', true, 5);
  modbusSerialClient.ForceSingleCoil('plc2', true, 5);
}, 600)



//provando funcion 6
setTimeout(function(){
  console.log('forzando el registro 14 a 12536');
  modbusSerialClient.PresetSingleRegister('plc1', 12536, 14);
  modbusSerialClient.PresetSingleRegister('plc2', 12536, 14);
}, 750)


//provando funcion 15
setTimeout(function(){
  console.log('forzando las coils 3 al 12 a 1011001010');
  values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
  modbusSerialClient.ForceMultipleCoils('plc1', values, 3);
  modbusSerialClient.ForceMultipleCoils('plc2', values, 3);
}, 1000)

//provando funcion 16
setTimeout(function(){
  console.log('forzando los registros 16 al 21 a [3.14, -54, 0, 7852689]');
  values = [3.14, -54, 0, 7852689];
  modbusSerialClient.PresetMultipleRegisters('plc1', values , 16);
  modbusSerialClient.PresetMultipleRegisters('plc2', values , 16);
}, 1150)

//provando funcion 22
setTimeout(function(){
  console.log('mask registro 5');
  values = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
  modbusSerialClient.MaskHoldingRegister('plc1', values , 5);
  modbusSerialClient.MaskHoldingRegister('plc2', values , 5);    
}, 1300)

}

setTimeout(function(){
console.log('check connection');
console.log(modbusSerialClient.isSlaveReady('plc1'));
prom = modbusSerialClient.Stop('plc1');
  prom.then(function(id){
    console.log(`disconected from ${id}`);
  })
},2400);


let promise = modbusSerialClient.Start();

promise.then(function(value){
console.log('conected to:');
console.log(value);
Test();
}, function(value){
console.log('fail to conect to');
console.log(value);
Test();
});
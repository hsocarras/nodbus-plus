var nodbus = require('..');

var modbusTCPClient = new nodbus.ModbusTcpClient();

var value;


modbusTCPClient.AddSlave ('plc1', {port:502, ip:'127.0.0.1', timeout:50, address:10});
//modbusTCPClient.AddSlave ('plc2', {port:500, ip:'127.0.0.1', timeout:100, address:15});
//modbusTCPClient.AddSlave ('plc3', {port:505, ip:'127.0.0.1', timeout:50, modbusAddress:12});
//modbusTCPClient.AddSlave ('plc4', {port:506, ip:'127.0.0.1', timeout:100, modbusAddress:17});
//modbusTCPClient.AddSlave ('plc5', {port:507, ip:'127.0.0.1', timeout:100, modbusAddress:19});

//Configurando todos los listeners

modbusTCPClient.on('data', function(id, data){
    console.log('Data from' + id + ': \n');
    console.log(data);
})
/*
modbusTCPClient.on('reponse', function(resp){
  console.log('response: ' + resp.id);  
})
*/
modbusTCPClient.on('timeout', function(id, req){
    console.log(id+':timeout on ' + req.id);
});

modbusTCPClient.on('error', function(id, err){
    console.log(id + ':error:')
    console.log(err)
});

modbusTCPClient.on('modbus_exception', function(id, modbusError){
    console.log(id + ': '+ modbusError);
});

modbusTCPClient.on('connect', function(id){
    console.log('connection stablished whit ' + id);
});

modbusTCPClient.on('indication', function(id, aduBuffer){
  console.log('indication send to ' + id);
	console.log(aduBuffer)
});

modbusTCPClient.on('disconnect', function(id, err){
  console.log(id+' disconnected');
  console.log(err)
});

modbusTCPClient.on('raw_data', function(id, data){
  console.log('buffer from ' + id)
	console.log(data);
})

modbusTCPClient.on('idle', function(id){
	console.log(id +' is waiting');
})

function Test(){
  console.log('starting test')
  //provando evento modbus exeption
  //modbusTCPClient.ReadHoldingRegisters(15265, 1);

  //provando funcion 1
  setTimeout(function(){
    console.log('leyendo coils de la 0 a la 7');
    modbusTCPClient.ReadCoilStatus('plc1', 0, 8);
    modbusTCPClient.ReadCoilStatus('plc2', 0, 8);
    modbusTCPClient.ReadCoilStatus('plc5', 0, 8);
  }, 100);


  //provando funcion 2
  setTimeout(function(){
    console.log('leyendo inputs de la 3 a la 8');
    modbusTCPClient.ReadInputStatus('plc1', 3, 6);
    modbusTCPClient.ReadInputStatus('plc2', 3, 6);
  }, 150);


  //provando funcion 3
  setTimeout(function(){
    console.log('leyendo holdingRegisters del 0 al 3');
    modbusTCPClient.ReadHoldingRegisters('plc1', 0, 4);
    modbusTCPClient.ReadHoldingRegisters('plc2', 0, 4);
  }, 200);


  //provando funcion 4
  setTimeout(function(){
    console.log('leyendo inputsRegisters del 1 al 5');
    modbusTCPClient.ReadInputRegisters('plc1', 1, 5);
    modbusTCPClient.ReadInputRegisters('plc2', 1, 5);
  }, 250);


  //provando funcion 5
  setTimeout(function(){
    console.log('forzando la coil 5 a 1');
    modbusTCPClient.ForceSingleCoil('plc1', true, 5);
    modbusTCPClient.ForceSingleCoil('plc2', true, 5);
  }, 300)


  
  //provando funcion 6
  setTimeout(function(){
    console.log('forzando el registro 14 a 12536');
    modbusTCPClient.PresetSingleRegister('plc1', 12536, 14);
    modbusTCPClient.PresetSingleRegister('plc2', 12536, 14);
  }, 350)


  //provando funcion 15
  setTimeout(function(){
    console.log('forzando las coils 3 al 12 a 1011001010');
    values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
    modbusTCPClient.ForceMultipleCoils('plc1', values, 3);
    modbusTCPClient.ForceMultipleCoils('plc2', values, 3);
  }, 400)

  //provando funcion 16
  setTimeout(function(){
    console.log('forzando los registros 16 al 21 a [3.14, -54, 0, 7852689]');
    values = [3.14, -54, 0, 7852689];
    modbusTCPClient.PresetMultipleRegisters('plc1', values , 16);
    modbusTCPClient.PresetMultipleRegisters('plc2', values , 16);
  }, 450)

  //provando funcion 22
  setTimeout(function(){
    console.log('mask registro 5');
    values = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
    modbusTCPClient.MaskHoldingRegister('plc1', values , 5);
    modbusTCPClient.MaskHoldingRegister('plc2', values , 5);    
  }, 500)
  
  
  //provando tcp coalesing
  modbusTCPClient.ReadInputStatus('plc1', 4, 6);
  modbusTCPClient.ReadHoldingRegisters('plc1', 1, 14);
  modbusTCPClient.ReadInputRegisters('plc1', 1, 5);
  modbusTCPClient.ForceSingleCoil('plc1', true, 5);
  modbusTCPClient.PresetSingleRegister('plc1', 12536, 14);
  let values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
  modbusTCPClient.ForceMultipleCoils('plc1', values, 3);
  values = [3.14, -54, 0, 7852689];
  modbusTCPClient.PresetMultipleRegisters('plc1', values , 16);
  values = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
  modbusTCPClient.MaskHoldingRegister('plc1', values , 5);
  
}
let prom;
setTimeout(function(){
  console.log('check connection');
  console.log(modbusTCPClient.isSlaveReady('plc1'));
  prom = modbusTCPClient.Stop('plc1');
  prom.then(function(id){
    console.log(`isconected from ${id}`);
  })
},5000);

let promise = modbusTCPClient.Start();

promise.then(function(value){
  console.log('conected to:');
  console.log(value);
  Test();
}, function(value){
  console.log('fail to conect to');
  console.log(value);
  Test();
});



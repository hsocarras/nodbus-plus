var nodbus = require('..');

var modbusSTCPClient = nodbus.CreateMaster('eth', 'rtu');

var value;

modbusSTCPClient.slaveDevice = {port:502, ip:'127.0.0.1', timeout:50};


//Configurando todos los listeners

modbusSTCPClient.on('data', function(data){
    console.log(data)
})

modbusSTCPClient.on('timeout', function(){
    console.log('timeout');
});

modbusSTCPClient.on('error', function(err){
    console.log('error')
    console.log(err)
});

modbusSTCPClient.on('modbus_exception', function(modbusError){
    console.log(modbusError);
});

modbusSTCPClient.on('connect', function(sock){
    console.log(sock.remoteAddress);
});

modbusSTCPClient.on('indication', function(data){
	console.log(data)
});

modbusSTCPClient.on('disconnect', function(err){
  console.log('client disconnected');
  console.log(err)
});

modbusSTCPClient.on('raw_data', function(data){
	console.log(data);
})

modbusSTCPClient.on('idle', function(){
	console.log('ready to go');
})

function Test(){
  console.log('starting test')
  //provando evento modbus exeption
  //modbusSTCPClient.ReadHoldingRegisters(15265, 1);

  //provando funcion 1
  setTimeout(function(){
    console.log('leyendo coils de la 0 a la 7');
    modbusSTCPClient.ReadCoilStatus(1, 1, 8);
  }, 100);



  //provando funcion 2
  setTimeout(function(){
    console.log('leyendo inputs de la 3 a la 8');
    modbusSTCPClient.ReadInputStatus(1, 3, 6);
    //modbusSTCPClient.Poll({ModbusFunction:2,startItem:3,numberItems:5});
  }, 150);


  //provando funcion 3
  setTimeout(function(){
    console.log('leyendo holdingRegisters del 0 al 3');
    modbusSTCPClient.ReadHoldingRegisters(1, 0, 4);
    //modbusSTCPClient.Poll({ModbusFunction:3,startItem:1,numberItems:10});
  }, 200);


  //provando funcion 4
  setTimeout(function(){
    console.log('leyendo inputsRegisters del 1 al 5');
    modbusSTCPClient.ReadInputRegisters(1, 1, 5);
    //modbusSTCPClient.Poll({ModbusFunction:4,startItem:2,numberItems:12});
  }, 250);


  //provando funcion 5
  setTimeout(function(){

    console.log('forzando la coil 5 a 1');
    modbusSTCPClient.ForceSingleCoil(true, 1, 5);

  }, 300)



  //provando funcion 6
  setTimeout(function(){
    console.log('forzando el registro 14 a 12536');
    modbusSTCPClient.PresetSingleRegister(12536, 1, 14);

  }, 350)


  //provando funcion 15
  setTimeout(function(){
    console.log('forzando las coils 3 al 12 a 1011001010');

    values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
    modbusSTCPClient.ForceMultipleCoils(values, 1, 3);
    //modbusSTCPClient.Poll({ModbusFunction:15, startItem:3, numberItems:10,itemsValues:value});
  }, 400)

  //provando funcion 16

  setTimeout(function(){
    console.log('forzando los registros 8 al 10 a [0xf154 0x58d2 0x25a6]');

    values = [3.14, -54, 0, 7852689];
    modbusSTCPClient.PresetMultipleRegisters(values , 1, 16);
    //modbusSTCPClient.Poll({ModbusFunction:16, startItem:8, numberItems:3,itemsValues:value});
  }, 450)

}

modbusSTCPClient.once('ready', Test);

modbusSTCPClient.Start();

setTimeout(function(){
  console.log('testing ascii mode');
  modbusSTCPClient.mode = 'ascii';
  Test();
}, 1450)

setTimeout(function(){
  console.log('check connection');
  console.log(modbusSTCPClient.isConnected);
},2100);

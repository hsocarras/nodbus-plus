var nodbus = require('..');

var modbusTCPClient = new nodbus.ModbusTcpClient();

var value;

class ModbusQuery {
  constructor(){
    //start register o input to be read
    this.startItem = '40000';

    //modbus function
    this.ModbusFunction = -1;

    //Items qantity to be read
    this.numberItems = 1;

    //valores
    this.itemsValues = null;
  }
}

modbusTCPClient.slaveDevice = {port:502, ip:'127.0.0.1', timeout:50};


//Configurando todos los listeners

modbusTCPClient.on('data', function(data){
    console.log(data)
})

modbusTCPClient.on('timeout', function(){
    console.log('timeout');
});

modbusTCPClient.on('error', function(err){
    console.log('error')
    console.log(err)
});

modbusTCPClient.on('modbus_exception', function(modbusError){
    console.log(modbusError);
});

modbusTCPClient.on('connect', function(sock){
    console.log(sock.remoteAddress);
});

modbusTCPClient.on('indication', function(data){
	console.log(data)
});

modbusTCPClient.on('disconnect', function(err){
  console.log('client disconnected');
  console.log(err)
});

modbusTCPClient.on('raw_data', function(data){
	console.log(data);
})

modbusTCPClient.on('idle', function(){
	console.log('ready to go');
})

function Test(){
  console.log('starting test')
  //provando evento modbus exeption
  //modbusTCPClient.ReadHoldingRegisters(15265, 1);

  //provando funcion 1
  setTimeout(function(){
    console.log('leyendo coils de la 0 a la 7');
    modbusTCPClient.ReadCoilStatus(1, 1, 8);
  }, 100);


  //provando funcion 2
  setTimeout(function(){
    console.log('leyendo inputs de la 3 a la 8');
    modbusTCPClient.ReadInputStatus(2, 3, 6);
    //modbusTCPClient.Poll({ModbusFunction:2,startItem:3,numberItems:5});
  }, 150);


  //provando funcion 3
  setTimeout(function(){
    console.log('leyendo holdingRegisters del 0 al 3');
    modbusTCPClient.ReadHoldingRegisters(3, 0, 4);
    //modbusTCPClient.Poll({ModbusFunction:3,startItem:1,numberItems:10});
  }, 200);


  //provando funcion 4
  setTimeout(function(){
    console.log('leyendo inputsRegisters del 1 al 5');
    modbusTCPClient.ReadInputRegisters(4, 1, 5);
    //modbusTCPClient.Poll({ModbusFunction:4,startItem:2,numberItems:12});
  }, 250);


  //provando funcion 5
  setTimeout(function(){

    console.log('forzando la coil 5 a 1');
    modbusTCPClient.ForceSingleCoil(true, 4, 5);

  }, 300)



  //provando funcion 6
  setTimeout(function(){
    console.log('forzando el registro 14 a 12536');
    modbusTCPClient.PresetSingleRegister(12536, 56, 14);

  }, 350)


  //provando funcion 15
  setTimeout(function(){
    console.log('forzando las coils 3 al 12 a 1011001010');

    values = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0];
    modbusTCPClient.ForceMultipleCoils(values, 45, 3);
    //modbusTCPClient.Poll({ModbusFunction:15, startItem:3, numberItems:10,itemsValues:value});
  }, 400)

  //provando funcion 16

  setTimeout(function(){
    console.log('forzando los registros 16 al 21 a [0xf154 0x58d2 0x25a6]');

    values = [3.14, -54, 0, 7852689];
    modbusTCPClient.PresetMultipleRegisters(values , 56, 16);
    //modbusTCPClient.Poll({ModbusFunction:16, startItem:8, numberItems:3,itemsValues:value});
  }, 450)

  //provando funcion 22
  setTimeout(function(){
    console.log('mask registro 5');
    values = [1, 0, 0, 1, -1, 0, 1, -1, -1, -1, 0, 0, 1, 1, -1, 0];
    modbusTCPClient.MaskHoldingRegister(values , 1, 6);    
  }, 500)

}

setTimeout(function(){
  console.log('check connection');
  console.log(modbusTCPClient.isConnected);
},1400);

modbusTCPClient.once('ready', Test);

modbusTCPClient.Start();

var nodbus = require('../src/nodbus-plus');

var mbTcpServerCfg = {
    port:'COM4',
    speed: 5,
    transmitionMode : 1,
};


var nodbusSerialServer = nodbus.createSerialServer('serial', mbTcpServerCfg);


nodbusSerialServer.on('listening', function(port){
    console.log('Server listening on: ' + port);
   
});



nodbusSerialServer.on('error', function(err){
    console.log(err)
});

nodbusSerialServer.on('closed', function(){
    console.log('server closed');
});



nodbusSerialServer.on('data', function(port, data){
    console.log(data);    
});

nodbusSerialServer.on('request', function(port, req){
    console.log(req);    
});

nodbusSerialServer.on('response', function(port, res){
    console.log(res);    
});

nodbusSerialServer.start();

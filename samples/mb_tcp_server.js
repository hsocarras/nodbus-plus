const nodbus = require('../src/nodbus-plus');
const arg = process.argv.slice(2);

const cfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 10000,
    inputRegisters : 10000,  
    port : 502,    
    }

let server = nodbus.createTcpServer('tcp', cfg);

server.on('listening', function(port){
    console.log('Server listening on: ' + port);        
});

if (arg.length > 0){
    if(arg[0] == 'req'){
        
        server.on('request', function(sock, req){
            console.log('Request received')
            console.log(req)
        });
    }
    else if(arg[0] == 'req-res'){

        server.on('request', function(sock, req){
            console.log('Request received')
            console.log(req)
        });

        server.on('response', function(sock, res){
            console.log('Responding')
            console.log(res)
        });

    }
    else if(arg[0] == 'raw'){
        
        server.on('data', function(sock, data){
            console.log('Data received')
            console.log(data)
        });
    }
    else{
        console.log('Blind Mode selected')
    }

}
else{
    server.on('error', function(err){
        console.log(err)
    });
}


server.start()
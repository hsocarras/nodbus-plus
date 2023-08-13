const nodbus = require('../src/nodbus-plus');
const arg = process.argv.slice(2);

let cfg = {
    address : 1,
    transmitionMode: 0,
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 10000,
    inputRegisters : 10000,  
    port : 502,    
    }

if (arg.length > 0){
    
    let newAddress = Number(arg[0]);

    if (typeof newAddress == 'number'){
        cfg.address = newAddress;
    }

    if(arg[1] == '-ascii'){
    
        cfg.transmitionMode = 1;
    
    }        
    
    
}

let server = nodbus.createSerialServer('tcp', cfg);

server.on('listening', function(port){
    console.log('Server listening on: ' + port);        
});

if (arg.length > 0){
    if(arg[2] == 'req'){
        
        server.on('request', function(sock, req){
            console.log('Request received')
            console.log(req)
        });
    }
    else if(arg[2] == 'req-res'){

        server.on('request', function(sock, req){
            console.log('Request received')
            console.log(req)
        });

        server.on('response', function(sock, res){
            console.log('Responding')
            console.log(res)
        });

    }
    else if(arg[2] == 'raw'){
        
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
const nodbus = require('../');

let server = nodbus.CreateTcpServer('tcp');


server.on('listening', function(port){
    console.log('Server listening on: ' + port);    
    repl()
});


server.on('error', function(err){
    console.log(err)
});

server.on('closed', function(){
    console.log('server closed');
    process.exit();
});

function repl(){

    process.stdout.write(">>> ")
    const stdin = process.openStdin();

    stdin.addListener("data", (data) => {
        
        let lineBuffer = data.subarray(0, data.length - 2);  //removing 0d 0a characters
        let input = lineBuffer.toString();
        
        switch(input){
            case 'exit':                
                server.stop();
                break;
            default:
                process.stdout.write(">>> ")
        }
    })
}


server.start();

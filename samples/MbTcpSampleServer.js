const nodbus = require('../');

//Default Server's Configuration object
const cfg = {
    inputs : 2048,
    coils : 2048,
    holdingRegisters : 10000,
    inputRegisters : 10000,  
    port : 502,
    maxConnections : 32,
    udpType : 'udp4',
    tcpCoalescingDetection: true
    }

let server = nodbus.createTcpServer('tcp', cfg);

server.on('listening', function(port){
    console.log('Server listening on: ' + port);    
    //repl()
});


server.on('error', function(err){
    console.log(err)
});

server.on('closed', function(){
    console.log('server closed');
    process.exit();
});

server.on('request',function(sock,req){
    console.log('Request')
    console.log(req)
})
/*
server.on('write',function(sock,frame){
    console.log('Response')
    console.log(frame)
})
*/
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
console.log(server.holdingRegisters.length)
server.holdingRegisters.writeFloatBE(1.0,2*3507);
server.holdingRegisters.writeFloatBE(1.0,2*3509);
server.holdingRegisters.writeFloatBE(1.0,2*3597);
server.holdingRegisters.writeFloatBE(1.0,2*3623);
server.holdingRegisters.writeFloatBE(1.0,2*3539);
server.holdingRegisters.writeFloatBE(1.0,2*3537);
server.holdingRegisters.writeFloatBE(1.0,2*3547);
server.holdingRegisters.writeFloatBE(1.0,2*3571);
server.holdingRegisters.writeFloatBE(1.0,2*3577);
server.holdingRegisters.writeFloatBE(1.0,2*3579);

server.start();

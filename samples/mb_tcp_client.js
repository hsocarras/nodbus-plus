const nodbus = require('../src/nodbus-plus');

channelCfg = {
    ip:'127.0.0.1',
    port:502,
    timeout:250,
}

let client = nodbus.createTcpClient();
client.addChannel('device', 'tcp1', channelCfg);

client.on('connection', (id)=>{
    console.log('connection stablish')
    process.stdout.write("device >> ")
})

client.on('connection-closed', (id)=>{
    console.log('client disconnected')
    process.stdout.write(">>> ")
})

client.on('error', (e)=>{
    console.log('Error')
    console.log(e)
    process.stdout.write("device >> ")
})

client.on('request', (id, req)=>{
    console.log('request sended to device');
    console.log('Awaiting for response ...');
})

client.on('req-timeout', (id, adu)=>{
    console.log('timeout')
    process.stdout.write("device >> ")
})

client.on('response', (id, res)=>{
    console.log(res)
    process.stdout.write("device >> ")
})

function repl(){

    process.stdout.write(">>> ")
    const stdin = process.openStdin();

    stdin.addListener("data", (data) => {
        
        let lineBuffer = data.subarray(0, data.length - 2);  //removing 0d 0a characters
        let input = lineBuffer.toString();
        

        let comands = input.split(' ');
        
        let success;
        let start;
        let cuantity;

        switch(comands[0]){            

            case 'exit':                
                process.exit();
                break;
            case 'q':                
                process.exit();
                break;
            case 'connect':
                client.connect('device')
                break
            case 'disconnect':
                client.disconnect('device')
                break
            case 'readcoils':
                start = comands[1];
                cuantity = comands[2];
                success = client.readCoils('device', 255, start, cuantity);
                if(success == false){
                    console.log('the client must connect first')
                    process.stdout.write(">>> ")
                }
                break
            case 'readholding':
                start = comands[1];
                cuantity = comands[2];
                success = client.readHoldingRegisters('device', 255, start, cuantity);
                if(success == false){
                    console.log('the client must connect first')
                    process.stdout.write(">>> ")
                }
                break
            case 'preset':
                let value = Buffer.alloc(2);
                value.writeInt16BE(Number(comands[1]));
                start= comands[2];
                cuantity = comands[3];
                success = client.presetSingleRegister(value, 'device', 255, start);
                if(success == false){
                    console.log('the client must connect first')
                    process.stdout.write(">>> ")
                }
                break
            default:
                console.log('unknow comand')
                process.stdout.write(">>> ")
                
        }
        
        

    })
}

repl()
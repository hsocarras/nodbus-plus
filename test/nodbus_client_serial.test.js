const Nodbus = require('../src/nodbus-plus');

//creating config file for basic server 1
let serverCfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,      
    udpType : 'udp6', 
    port : 520
}

//creating config file for basic server 1
let serverCfg2 = {
    transmitionMode : 1,
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,      
    udpType : 'udp4', 
    port : 522
}

describe("rtu client", () => {

    let server1 = Nodbus.createSerialServer('tcp', serverCfg);
      
    let client = Nodbus.createSerialClient('tcp');
    client.addChannel('server1', {ip:'127.0.0.1', port: 520})
    expect(client.isChannelReady('server1')).toEqual(false);

    test("functions", (done) => {

        expect(server1.isListening).toEqual(false);           

        

        client.on('transaction', (req, res) =>{
            let reqAddress = req[0];
            let resAddress = res[0];           
            let functionCode = req[1];
            let valBuffer  = Buffer.alloc(2);
            
            expect(reqAddress).toEqual(resAddress)
            expect(resAddress).toEqual(1)
           
            switch(functionCode){
                case 0x01:                    
                    expect(res.length).toEqual(6)
                    client.readInputs('server1', 1, 0, 2);                                        
                    break;
                case 0x02:
                    expect(res.length).toEqual(6)
                    client.readHoldingRegisters('server1', 1, 0, 2);                 
                    break
                case 0x03:
                    expect(res.length).toEqual(9)
                    client.readInputRegisters('server1', 1, 0, 2);                    
                    break
                case 0x04:
                    expect(res.length).toEqual(9)
                    client.forceSingleCoil(true, 'server1', 1, 5);
                    break;
                case 0x05:
                    expect(res.length).toEqual(8)
                    expect(res[4]).toEqual(0xFF);                    
                    valBuffer[1] = 0x45;
                    client.presetSingleRegister(valBuffer, 'server1', 1, 10);                    
                    break;
                case 0x06:
                    expect(res.length).toEqual(8)
                    expect(res[3]).toEqual(10);
                    expect(res[5]).toEqual(0x45);
                    let coils = [1, 1, 0, 0 , 1, 0, 0, 0, 1, 1, 1, 0];
                    client.forceMultipleCoils(coils, 'server1', 1, 12); 
                    break
                case 0x0f:
                    expect(res.length).toEqual(8)
                    expect(res[5]).toEqual(12);
                    valBuffer = Buffer.alloc(5);
                    let tempRegister = Buffer.alloc(2);
                    tempRegister.writeUint16BE(123);
                    client.setWordToBuffer(tempRegister, valBuffer, 0);
                    tempRegister.writeUint16BE(1234);
                    client.setWordToBuffer(tempRegister, valBuffer, 1);
                    client.presetMultiplesRegisters(valBuffer, 'server1', 1, 20);
                    break;
                case 0x10:
                    expect(res.length).toEqual(8)                   
                    expect(res[5]).toEqual(2);
                    registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
                    client.maskHoldingRegister(registerMask, 'server1', 1, 22);   
                    break;
                case 0x16:
                    expect(res.length).toEqual(10)                   
                    expect(res[3]).toEqual(req[3]);
                    expect(res[5]).toEqual(req[5]);
                    expect(res[7]).toEqual(req[7]);
                    client.readWriteMultiplesRegisters(valBuffer, 'server1', 1, 10, 3, 20);
                    break
                case 0x17:
                    expect(res.length).toEqual(11)                   
                    expect(res[2]).toEqual(6);                    
                    client.presetSingleRegister(valBuffer, 'server1', 0, 10); 
                    break;
                default:
                    client.disconnect('server1');
            }

           
        })

        client.on('broadcast_timeout', () =>{
            //console.log('broadcast timeout')
            client.disconnect('server1');
        })

        client.on('connection-closed', ()=>{
            //console.log('stopping server')
            server1.stop()
        })

        client.on('connection', (id)=>{
            //console.log('client connected')
            let channel = client.channels.get(id);
            expect(id).toEqual('server1');                 
            expect(channel.ip).toEqual('127.0.0.1');
            expect(channel.port).toEqual(520);
            expect(client.isChannelReady(id)).toEqual(true);
            
            client.readCoils('server1', 1, 0, 2);            
            
        })

        server1.on('listening', (port)=>{
            //console.log('server listenning')
            let connectPromise = client.connect('server1');
        });
        
        server1.on('connection-closed', (has_error) => {
           // console.log('client disconnected')
        })

        server1.on('closed', ()=>{
            expect(server1.isListening).toEqual(false);
            done()
        })

        server1.on('connection', (sock)=>{
            //console.log('server say connection')
        })

        server1.on('data', (sock, data) => {
            //console.log(data)
        })

        server1.start(); 

        

    });    
    
    
});

describe("ascii client", () => {

    let server2 = Nodbus.createSerialServer('tcp', serverCfg2);
      
    let client = Nodbus.createSerialClient('tcp');
    client.addChannel('server2', {ip:'127.0.0.1', port: 522})
    expect(client.isChannelReady('server2')).toEqual(false);

    test("functions", (done) => {

        expect(server2.isListening).toEqual(false);           

        

        client.on('transaction', (req, res) =>{
            let reqAddress = req[0];
            let resAddress = res[0];           
            let functionCode = req[1];
            let valBuffer  = Buffer.alloc(2);
            
            expect(reqAddress).toEqual(resAddress)
            
           
            switch(functionCode){
                case 0x01:                    
                    expect(res.length).toEqual(6)
                    client.readInputs('server2', 1, 0, 2, true);                                        
                    break;
                case 0x02:
                    expect(res.length).toEqual(6)
                    client.readHoldingRegisters('server2', 1, 0, 2, true);                 
                    break
                case 0x03:
                    expect(res.length).toEqual(9)
                    client.readInputRegisters('server2', 1, 0, 2, true);                    
                    break
                case 0x04:
                    expect(res.length).toEqual(9)
                    client.forceSingleCoil(true, 'server2', 1, 5, true);
                    break;
                case 0x05:
                    expect(res.length).toEqual(8)
                    expect(res[4]).toEqual(0xFF);                    
                    valBuffer[1] = 0x45;
                    client.presetSingleRegister(valBuffer, 'server2', 1, 10, true);                    
                    break;
                case 0x06:
                    expect(res.length).toEqual(8)
                    expect(res[3]).toEqual(10);
                    expect(res[5]).toEqual(0x45);
                    let coils = [1, 1, 0, 0 , 1, 0, 0, 0, 1, 1, 1, 0];
                    client.forceMultipleCoils(coils, 'server2', 1, 12, true); 
                    break
                case 0x0f:
                    expect(res.length).toEqual(8)
                    expect(res[5]).toEqual(12);
                    valBuffer = Buffer.alloc(5);
                    let tempRegister = Buffer.alloc(2);
                    tempRegister.writeUint16BE(123);
                    client.setWordToBuffer(tempRegister, valBuffer, 0);
                    tempRegister.writeUint16BE(1234);
                    client.setWordToBuffer(tempRegister, valBuffer, 1);
                    client.presetMultiplesRegisters(valBuffer, 'server2', 1, 20, true);
                    break;
                case 0x10:
                    expect(res.length).toEqual(8)                   
                    expect(res[5]).toEqual(2);
                    registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
                    client.maskHoldingRegister(registerMask, 'server2', 1, 22, true);   
                    break;
                case 0x16:
                    expect(res.length).toEqual(10)                   
                    expect(res[3]).toEqual(req[3]);
                    expect(res[5]).toEqual(req[5]);
                    expect(res[7]).toEqual(req[7]);
                    client.readWriteMultiplesRegisters(valBuffer, 'server2', 1, 10, 3, 20, true);
                    break
                case 0x17:
                    expect(res.length).toEqual(11)                   
                    expect(res[2]).toEqual(6);                    
                    client.disconnect('server2');
                    break;
                default:
                    client.disconnect('server2');
            }

           
        })

        client.on('connection-closed', ()=>{
            //console.log('stopping server')
            server2.stop()
        })

        client.on('connection', (id)=>{
            //console.log('client connected')
            let channel = client.channels.get(id);
            expect(id).toEqual('server2');                 
            expect(channel.ip).toEqual('127.0.0.1');
            expect(channel.port).toEqual(522);
            expect(client.isChannelReady(id)).toEqual(true);
            
            client.readCoils('server2', 1, 0, 2, true);
            
            
        })

        server2.on('listening', (port)=>{
            //console.log('server listenning')
            let connectPromise = client.connect('server2');
        });
        
        server2.on('connection-closed', (has_error) => {
           // console.log('client disconnected')
        })

        server2.on('closed', ()=>{
            expect(server2.isListening).toEqual(false);
            done()
        })

        server2.on('connection', (sock)=>{
            //console.log('server say connection')
        })

        server2.on('data', (sock, data) => {
           // console.log(data)
        })

        server2.on('write', (sock, data)=>{
           // console.log(data)
        })

        server2.start(); 

        

    });    
    
    
});


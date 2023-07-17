
const Nodbus = require('../src/nodbus-plus');

//creating config file for basic server 1
let serverCfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,
    tcpCoalescingDetection : false,   
    udpType : 'udp6', 
    port : 510
}

describe("tcp client", () => {

    let server1 = Nodbus.createTcpServer('tcp', serverCfg);
      
    let client = Nodbus.createTcpClient();
    client.addChannel('server1', '127.0.0.1', 510)
    expect(client.isChannelReady('server1')).toEqual(false);

    test("functions", (done) => {

        expect(server1.isListening).toEqual(false);           

        let tCounter = 0;  //used to count response.

        client.on('transaction', (req, res) =>{
            let reqId = req.readUInt16BE(0);
            let resId = req.readUInt16BE(0);
            let unitId = req[6]
            let functionCode = req[7];
            
            expect(reqId).toEqual(resId)
            expect(unitId).toEqual(255)
           
            switch(functionCode){
                case 0x01:                    
                    expect(res.length).toEqual(10)
                    tCounter++;                    
                    break;
                case 0x02:
                    expect(res.length).toEqual(10)
                    tCounter++;                    
                    break
                case 0x03:
                    expect(res.length).toEqual(13)
                    tCounter++;                    
                    break
                case 0x04:
                    expect(res.length).toEqual(13)
                    tCounter++;
                    break;
                case 0x05:
                    expect(res.length).toEqual(12)
                    expect(res[10]).toEqual(0xFF);
                    tCounter++;
                    break;
                case 0x06:
                    expect(res.length).toEqual(12)
                    expect(res[9]).toEqual(10);
                    expect(res[11]).toEqual(0x45);
                    tCounter++;   
                    break
                case 0x0f:
                    expect(res.length).toEqual(12)
                    expect(res[11]).toEqual(12);
                    tCounter++;
                    break;
                case 0x10:
                    expect(res.length).toEqual(12)                   
                    expect(res[11]).toEqual(2);
                    tCounter++;   
                    break;
                case 0x16:
                    expect(res.length).toEqual(14)                   
                    expect(res[9]).toEqual(req[9]);
                    expect(res[11]).toEqual(req[11]);
                    expect(res[13]).toEqual(req[13]);
                    tCounter++;
                    break
                case 0x17:
                    expect(res.length).toEqual(15)                   
                    expect(res[8]).toEqual(6);
                    tCounter++;                    
                    expect(tCounter).toEqual(10);
                    client.disconnect('server1');
                    break;
                default:
                    client.disconnect('server1');
            }

           
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
            expect(channel.port).toEqual(510);
            expect(client.isChannelReady(id)).toEqual(true);

            client.readCoils('server1', 255, 0, 2);
            client.readInputs('server1', 255, 0, 2);
            client.readHoldingRegisters('server1', 255, 0, 2);
            client.readInputRegisters('server1', 255, 0, 2);
            client.forceSingleCoil(true, 'server1', 255, 5);
            let valBuffer  = Buffer.alloc(2);
            valBuffer[1] = 0x45;
            client.presetSingleRegister(valBuffer, 'server1', 255, 10);
            let coils = [1, 1, 0, 0 , 1, 0, 0, 0, 1, 1, 1, 0];
            client.forceMultipleCoils(coils, 'server1', 255, 12);
            valBuffer = Buffer.alloc(5);
            valBuffer[1] = 12;
            valBuffer[3] = 58;
            client.presetMultiplesRegisters(valBuffer, 'server1', 255, 20);
            registerMask = [1, 0, 2, 0, 0, 1, 1, 1, 2, 2, 2, 0, 1, 2, 2, 1];
            client.maskHoldingRegister(registerMask, 'server1', 255, 22);
            client.readWriteMultiplesRegisters(valBuffer, 'server1', 255, 10, 3, 20);

           
            
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

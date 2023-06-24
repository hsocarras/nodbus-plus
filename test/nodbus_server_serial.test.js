const net = require('node:net');
const Nodbus = require('../src/nodbus-plus');

//creating config file for basic server 1
let serverCfg1 = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,    
    udpType : 'udp6', 
    port: 503,
    speed: 7,
    address : 1,
    transmitionMode : 0,
}

let serverCfg2 = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,    
    udpType : 'udp6', 
    port: 504,    
    address : 1,
    transmitionMode : 1,
    tcpCoalescingDetection : true,  
    
}

describe("Instanciate a nodbus serial server with tcp net", () => {

       
    let server1 = Nodbus.createSerialServer('tcp', serverCfg1);
    //let server2 = new ModbusTcpServer();
    
    it("instance", () => {
         
        expect(server1.port).toEqual(503);    
        expect(server1.address).toEqual(1);  
        expect(server1.net.tcpCoalescingDetection).toEqual(false);     
    } );   
    
});

describe("rtu server", () => {

       
    let server1 = Nodbus.createSerialServer('tcp', serverCfg1);
    let testClient = new net.Socket()  

    test("server", (done) => {

        expect(server1.isListening).toEqual(false); 
       
        testClient.on('data', (data)=>{
            //console.log('client data')
            expect(data[0]).toEqual(1);
            expect(data[1]).toEqual(3);
            server1.stop() 
        })

        function listeningCallback(port){  
            //console.log('listening')     
            expect(server1.isListening).toEqual(true);     
            expect(port).toEqual(503);  

            testClient.connect(503);  

            function connectionCallback(){
                //console.log('connection') 
                   
                let adu1 = Buffer.from([0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x45, 0xD8]);  //broadcast
                let adu2 = Buffer.from([0x0A, 0x03, 0x00, 0x00, 0x00, 0x04, 0x45, 0x72]);   //address 10 wrong address
                let adu3 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x04, 0x44, 0x09]);   //good
                let adu4 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x04, 0x44, 0x19]);   //wrong crc  

                 
                function dataCallback(socket, frame){
                    //console.log('data')
                    //console.log(frame)
                    expect(frame[0] == 0 | frame[0] == 1 | frame[0] == 10).toBeTruthy(); 
                    expect(frame[1]).toEqual(3);
                                     
                }

                server1.on('data', dataCallback);

                function reqCallback(socket, req){
                    expect(socket).toBeInstanceOf(net.Socket)
                    //console.log('req')
                    expect(req.address == 0 | req.address == 1).toBeTruthy(); 
                    expect(req.functionCode).toEqual(3);
                    expect(req.data.length).toEqual(4);                    
                }

                server1.on('request', reqCallback);

                function resCallback(sock, res){
                    //console.log('res')
                    expect(res.address).toEqual(1);
                    expect(res.functionCode).toEqual(3);
                    expect(res.data.length).toEqual(9);   
                }

                server1.on('response', resCallback);

                function writeCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame[0]).toEqual(0);
                    expect(frame[1]).toEqual(3);
                }
                
                //server1.on('write', writeCallback);

                testClient.write(adu1)  

                setTimeout(() => {
                    testClient.write(adu2)
                }, 100) 

                setTimeout(() => {
                    testClient.write(adu4)
                }, 200) 
                    
                setTimeout(() => {
                    testClient.write(adu3) 
                }, 300)   
                  
                
            }

            testClient.on('connect', connectionCallback)
        }

        server1.on('listening', listeningCallback);

        function closedCallback(){
            //console.log('closed') 
            expect(server1.isListening).toEqual(false);
            done()
        }
        server1.on('closed', closedCallback)

        server1.start()  

    });    
    
    
});

describe("ascii server", () => {

       
    let server1 = Nodbus.createSerialServer('tcp', serverCfg2);
    let testClient = new net.Socket()  

    test("server", (done) => {

        expect(server1.isListening).toEqual(false); 
       
        testClient.on('data', (data)=>{
            //console.log('client data')
            expect(data[0]).toEqual(0x3A);
            
            server1.stop() 
        })

        function listeningCallback(port){  
            //console.log('listening')     
            expect(server1.isListening).toEqual(true);     
            expect(port).toEqual(504);  

            testClient.connect(504);  

            function connectionCallback(){
                //console.log('connection') 
                   
                let adu1 = Buffer.from([0x3A, 0x30, 0x30, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x34, 0x46, 0x39, 0x0D, 0x0A]);  //broadcast 0 3 0 0 0 4 45 d8
                let adu2 = Buffer.from([0x3A, 0x30, 0x41, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x34, 0x45, 0x36, 0x0D, 0x0A]);   //address 10 wrong address
                let adu3 = Buffer.from([0x3A, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x34, 0x46, 0x38, 0x0D, 0x0A]);   //good
                let adu4 = Buffer.from([0x3A, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x34, 0x46, 0x36, 0x0D, 0x0A]);   //wrong crc  

                 
                function dataCallback(socket, frame){
                    //console.log('data')
                    //console.log(frame)
                    expect(frame[0]).toEqual(0x3A);
                    expect(frame[1]).toEqual(0x30);
                                     
                }

                server1.on('data', dataCallback);

                function reqCallback(socket, req){
                    expect(socket).toBeInstanceOf(net.Socket)
                    //console.log('req')
                    expect(req.address == 0 | req.address == 1).toBeTruthy(); 
                    expect(req.functionCode).toEqual(3);
                    expect(req.data.length).toEqual(4);                    
                }

                server1.on('request', reqCallback);

                function resCallback(sock, res){
                    //console.log('res')
                    expect(res.address).toEqual(1);
                    expect(res.functionCode).toEqual(3);
                    expect(res.data.length).toEqual(9);   
                }

                server1.on('response', resCallback);

                function writeCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame[0]).toEqual(0);
                    expect(frame[1]).toEqual(3);
                }
                
                //server1.on('write', writeCallback);

                testClient.write(adu1)  

                setTimeout(() => {
                    testClient.write(adu2)
                }, 100) 

                setTimeout(() => {
                    testClient.write(adu4)
                }, 200) 
                    
                setTimeout(() => {
                    testClient.write(adu3) 
                }, 300)   
                  
                
            }

            testClient.on('connect', connectionCallback)
        }

        server1.on('listening', listeningCallback);

        function closedCallback(){
            //console.log('closed') 
            expect(server1.isListening).toEqual(false);
            done()
        }
        server1.on('closed', closedCallback)

        server1.start()  

    });    
    
    
});
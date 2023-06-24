const net = require('node:net');
const dgram = require('node:dgram');
const Nodbus = require('../src/nodbus-plus');

//creating config file for basic server 1
let serverCfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,
    tcpCoalescingDetection : false,   
    udpType : 'udp6', 
}

describe("Instanciate a nodbus tcp server with tcp net", () => {

       
    let server1 = Nodbus.createTcpServer('tcp', serverCfg);
    //let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {
         
        expect(server1.port).toEqual(502);    
        expect(server1.maxConnections).toEqual(32);
             
    } );   
    
});

describe("tcp server", () => {

       
    let server1 = Nodbus.createTcpServer();
    //let server2 = Nodbus.CreateTcpServer('tcp', serverCfg);
    let testClient = new net.Socket()  

    test("callbacks", (done) => {
        expect(server1.isListening).toEqual(false); 
                
       
        testClient.on('data', (data)=>{
            server1.stop() 
        })

        function listeningCallback(port){  
            //console.log('listening')     
            expect(server1.isListening).toEqual(true);     
            expect(port).toEqual(502);
            testClient.connect(502);           
            

            function connectionCallback(socket){
                //console.log('connection') 
                expect(socket.localPort).toEqual(502); 
                let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03, 
                    0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);      
                

                              

                function dataCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame.length).toEqual(24);
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                    expect(frame[9]).toEqual(0);
                    expect(frame[15]).toEqual(0);
                    expect(frame[21]).toEqual(0);  
                                     
                }

                server1.on('data', dataCallback);

                function reqCallback(socket, req){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(req.unitId).toEqual(255);
                    expect(req.functionCode).toEqual(1);
                    expect(req.data.length).toEqual(4);                    
                }

                server1.on('request', reqCallback);

                function resCallback(sock, res){
                    expect(res.unitId).toEqual(255);
                    expect(res.functionCode).toEqual(1);
                    expect(res.data.length).toEqual(2);   
                }

                server1.on('response', resCallback);

                function writeCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                }
                
                testClient.write(adu1)    
                
            }

            server1.on('connection', connectionCallback)
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

describe("udp server", () => {

       
    let server2 = Nodbus.createTcpServer('udp6', serverCfg);
    server2.port = 1502;
    
    let testClient2 = dgram.createSocket('udp6');
    
    
    
    testClient2.once('message', (data, rinfo)=>{
        //console.log('stopping server udp')
        testClient2.disconnect()
        server2.stop();        
        testClient2.close();
    })
    
   
    test("callbacks", (done) => {

        expect(server2.isListening).toEqual(false); 
        

        function listeningCallback(port){  
            
            const address = server2.net.coreServer.address();
            //console.log(`server listening ${address.address}:${address.port} for ${address.family}`);    
            expect(server2.isListening).toEqual(true);     
            expect(port).toEqual(1502);
            expect(address.family).toEqual('IPv6')

            testClient2.connect(1502, 'localhost', connectionCallback);  
           
            function connectionCallback(){
                //console.log('connection') 
                     
                let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03, 
                                        0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);  

                let conectedClients = server2.net.activeConnections;                 
                expect(conectedClients.length).toEqual(0);                     

                function dataCallback(socket, frame){
                    //console.log('data')
                    
                    expect(frame.length).toEqual(24);
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                    expect(frame[9]).toEqual(0);
                    expect(frame[15]).toEqual(0);
                    expect(frame[21]).toEqual(0);  
                                     
                }

                server2.on('data', dataCallback);

                function reqCallback(socket, req){
                    //console.log('request')
                    
                    expect(req.unitId).toEqual(255);
                    expect(req.functionCode).toEqual(1);
                    expect(req.data.length).toEqual(4);                    
                }

                server2.on('request', reqCallback);

                function writeCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                    
                }
                 
                testClient2.send(adu1, 1502, 'localhost');  
                
            }   
            
        }

        server2.on('listening', listeningCallback);

        function closedCallback(){
            //console.log('closed') 
            expect(server2.isListening).toEqual(false);
            
            done()
        }

        server2.on('closed', closedCallback)

        server2.start()  
             
    });    
    
    
    
});

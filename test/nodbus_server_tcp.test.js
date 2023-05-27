const net = require('node:net');
const Nodbus = require('../src/nodbus-plus');

//creating config file for basic server 1
let serverCfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256
}

describe("Instanciate a nodbus tcp server with tcp net", () => {

       
    let server1 = Nodbus.CreateTcpServer('tcp', serverCfg);
    //let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {
         
        expect(server1.port).toEqual(502);    
        expect(server1.maxConnections).toEqual(32);
             
    } );   
    
});

describe("tcp server", () => {

       
    let server1 = Nodbus.CreateTcpServer('tcp', serverCfg);
    //let server2 = Nodbus.CreateTcpServer('tcp', serverCfg);
    testClient = new net.Socket()  

    test("callbacks", (done) => {
        expect(server1.isListening).toEqual(false); 
        server1.start()          
       

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

                let conectedClients = server1.activeConnections;
                expect(conectedClients[0]).toBeInstanceOf(net.Socket)   
                expect(conectedClients.length).toEqual(1);                     

                function dataCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame.length).toEqual(24);
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                    expect(frame[9]).toEqual(0);
                    expect(frame[15]).toEqual(0);
                    expect(frame[21]).toEqual(0);  
                    server1.stop()                  
                }

                server1.on('data', dataCallback);

                function reqCallback(socket, req){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(req.unitId).toEqual(255);
                    expect(req.functionCode).toEqual(1);
                    expect(req.data.length).toEqual(4);                    
                }

                server1.on('request', reqCallback);

                function writeCallback(socket, frame){
                    expect(socket).toBeInstanceOf(net.Socket)
                    expect(frame[2]).toEqual(0);
                    expect(frame[6]).toEqual(255);
                }

                testClient.write(adu1)    

                function closedCallback(){
                    //console.log('closed') 
                    expect(server1.isListening).toEqual(false);
                    done()
                }

                server1.on('closed', closedCallback)
            }

            server1.on('connection', connectionCallback)
        }

        server1.on('listening', listeningCallback);
             
    });    
    
    
});

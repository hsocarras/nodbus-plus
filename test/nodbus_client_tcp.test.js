
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
           
            client.disconnect(id);
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

        server1.start(); 

        

    });    
    
    
});

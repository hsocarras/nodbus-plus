const ModbusTcpServer = require('../').ModbusTcpServer;

//creating config file for basic server 1
let server1Cfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256
}

describe("Get header from adu", () => {
    let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
     
   
    let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {
        let header = server2.getMbapHeader(adu1)  
       
        expect(header[1]).toEqual(2); 
        expect(header[5]).toEqual(0x06); 
        expect(header[6]).toEqual(0xFF);    
        expect(header.length).toEqual(7);
             
    } );   
    
});

describe("Get pdu from adu", () => {
    let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
     
   
    let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {
        let pdu = server2.getPdu(adu1)  
       
        expect(pdu[0]).toEqual(1); 
        expect(pdu[4]).toEqual(0x03);             
        expect(pdu.length).toEqual(5);
             
    } );   
    
});

describe("validate mbap header", () => {
    let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
    let adu2 = Buffer.from([0x00, 0x02, 0x00, 0x01, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
    let adu3 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06]);  
   
    let server2 = new ModbusTcpServer();
    
    it("right header", () => {
        let isValid = server2.validateMbapHeader(adu1.subarray(0, 7))  
       
        expect(isValid).toEqual(true); 
        
    } );
    it("invalid header's protocol field", () => {
        let isValid = server2.validateMbapHeader(adu2.subarray(0, 7))  
        expect(isValid).toEqual(false); 
           
    });
    it("invalid header's length", () => {
        let isValid = server2.validateMbapHeader(adu3)  
        expect(isValid).toEqual(false); 
           
    });
    
});

describe("build response  from adu", () => {
    let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x03, 0x00, 0x00, 0x00, 0x03]);
       
   
    let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {

        let res = server2.getResponseAdu(adu1); 
        
        expect(res[1]).toEqual(2); 
        expect(res[5]).toEqual(9);
        expect(res[6]).toEqual(0xFF);    
        expect(res[7]).toEqual(3);
        expect(res[8]).toEqual(6); 
        expect(res.length).toEqual(15);     
    } );
    
    
});
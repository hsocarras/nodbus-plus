const ModbusTcpServer = require('../').ModbusTcpServer;

//creating config file for basic server 1
let server1Cfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256
}

describe("Get transaction from adu", () => {
    let adu1 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
    let adu2 = Buffer.from([0x00, 0x02, 0x00, 0x01, 0x00, 0x06, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x03]);
    let adu3 = Buffer.from([0x00, 0x02, 0x00, 0x00, 0x00, 0x06, 0xFF]);  
   
    let server2 = new ModbusTcpServer();
    
    it("instanciate transaction", () => {
        let tran = server2.getTransactionObject(adu1)  
       
        expect(tran.header[1]).toEqual(2); 
        expect(tran.header[6]).toEqual(0xFF);    
        expect(tran.header.length).toEqual(7);
        expect(tran.pdu[4]).toEqual(3);  
        expect(tran.pdu.length).toEqual(5);     
    } );
    it("transaction rejected invalid header's protocol field", () => {
        let tran = server2.getTransactionObject(adu2)  
        expect(tran).toEqual(null); 
           
    });
    it("transaction rejected invalid adu message legnth", () => {
        let tran = server2.getTransactionObject(adu3)  
        expect(tran).toEqual(null);    
    });
    
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
        let res = server2.builResponseAdu(server2.getTransactionObject(adu1))  
        
        expect(res[1]).toEqual(2); 
        expect(res[5]).toEqual(9);
        expect(res[6]).toEqual(0xFF);    
        expect(res[7]).toEqual(3);
        expect(res[8]).toEqual(6); 
        expect(res.length).toEqual(15);     
    } );
    
    
});
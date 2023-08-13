const ModbusTcpClient = require('../').ModbusTcpClient

describe("Make Mbap header", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);  
    let pdu2 = Buffer.from([0x01, 0x00, 0x48, 0x00, 0x0A, 0x05]);
    
    let testMaster = new ModbusTcpClient();
    
    it("header 1", () => {
        testMaster.transactionCount = 1;
        let header = testMaster.makeHeader(2, pdu1.length);        
        expect(header[0]).toEqual(0);     
        expect(header[1]).toEqual(1);  
        expect(header[3]).toEqual(0);  
        expect(header[5]).toEqual(6);
        expect(header[6]).toEqual(2);
        expect(header.length).toEqual(7);    
    } );
    it("header 2", () => {
        testMaster.transactionCount = 10;
        let header = testMaster.makeHeader(20, pdu2.length);        
        expect(header[0]).toEqual(0);     
        expect(header[1]).toEqual(10);  
        expect(header[3]).toEqual(0);  
        expect(header[5]).toEqual(7);
        expect(header[6]).toEqual(20);
        expect(header.length).toEqual(7);  
    });
    
});

describe("Parse Mbap header", () => {
    let header1 = [0x01, 0x01, 0x00, 0x00, 0x00, 0x05, 0x02];
    let header2 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x03]); 
    let header3 = Buffer.from([0x00, 0x10, 0x00, 0x00, 0x00, 0x07, 0x05]); 
    
    
    let testMaster = new ModbusTcpClient();
    
    it("header 1", () => {        
                
        expect(()=>{testMaster.parseHeader(header1)}).toThrow(TypeError);
        expect(()=>{testMaster.parseHeader(header1)}).toThrow('Error: Header must be a buffer instance');     
            
    } );

    it("header 2", () => {        
                
        expect(()=>{testMaster.parseHeader(header2)}).toThrow(RangeError);
        expect(()=>{testMaster.parseHeader(header2)}).toThrow('Error: Header must be 7 bytes long');     
            
    } );
    
    it("header 3", () => {
        
        let header = testMaster.parseHeader(header3);        
        expect(header.transactionId).toEqual(16);
        expect(header.protocolId).toEqual(0);    
        expect(header.length).toEqual(7);    
        expect(header.unitId).toEqual(5);
    });
    
});

describe("Make reqest Buffer", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);  
    let pdu2 = [0x01, 0x00, 0x48, 0x00, 0x0A, 0x05];
    
    let testMaster = new ModbusTcpClient();
    
    it("fail to make request", () => {        
        
        req1 = testMaster.makeRequest(10, pdu2);
        req2 = testMaster.makeRequest(258, pdu1);
        expect(req1).toEqual(null);     
        expect(req2).toEqual(null);
          
            
    } );

    it("successful request", () => {

        testMaster.transactionCount = 10;

        req1 = testMaster.makeRequest(2, pdu1);       
        expect(req1[1]).toEqual(11);     
        expect(req1[5]).toEqual(6);  
        expect(req1[6]).toEqual(2);  
        expect(req1[7]).toEqual(1);
        expect(req1[11]).toEqual(3);
        expect(req1.length).toEqual(12);  
    });
    
});

describe("storeRequest", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);     
    
    let testMaster = new ModbusTcpClient();
    
    it("successful request", () => {

        testMaster.transactionCount = 10;

        req1 = testMaster.makeRequest(2, pdu1);       
        let store = testMaster.storeRequest(req1);
        expect(store).toEqual(true);
        expect(testMaster.reqPool.has(11)).toEqual(true);
        let stored = testMaster.reqPool.get(11);
        expect(stored[1]).toEqual(11); 
        expect(stored[11]).toEqual(3);

    });
    
});

describe("setReqTimer", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);     
    
    let testMaster = new ModbusTcpClient();
    
    it("successful request", () => {

        testMaster.transactionCount = 10;

        req1 = testMaster.makeRequest(2, pdu1);       
        testMaster.storeRequest(req1);
        expect(testMaster.reqPool.has(11)).toEqual(true);
        let timed1 = testMaster.setReqTimer(10, 1500);
        let timed2 = testMaster.setReqTimer(11, 0);
        let timed3 = testMaster.setReqTimer(11, 10);
        expect(timed1).toEqual(-1);
        expect(timed2).toEqual(-1);
        expect(testMaster.reqTimersPool.has(11)).toEqual(true);
        let stored = testMaster.reqTimersPool.get(11);
        expect(stored).toEqual(timed3);

        testMaster.on('req-timeout', (transactionId) =>{            
            expect(transactionId).toEqual(11);
        })
        

    });
    
});

describe("processResAdu", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]); 
    
    let testMaster = new ModbusTcpClient();
    
    it("response", () => {

        testMaster.transactionCount = 10;

        req1 = testMaster.makeRequest(2, pdu1);       
        testMaster.storeRequest(req1);
        expect(testMaster.reqPool.has(11)).toEqual(true);
        
        let timed3 = testMaster.setReqTimer(11, 10);        
        expect(testMaster.reqTimersPool.has(11)).toEqual(true);

        let res = Buffer.from([0x00, 0x0B, 0x00, 0x00, 0x00, 0x06, 0x02, 0x01, 0x00, 0x00, 0x00, 0x03]); 
        testMaster.processResAdu(res);
        expect(testMaster.reqTimersPool.has(11)).toEqual(false);
        expect(testMaster.reqPool.has(11)).toEqual(false);
        
        testMaster.on('transaction', (req, res) =>{            
            
            expect(req[1]).toEqual(11); 
            expect(req[11]).toEqual(3);
            expect(res[1]).toEqual(11); 
            expect(res[11]).toEqual(3);
        })

    });
    
});
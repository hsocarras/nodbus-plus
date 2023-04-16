const ModbusClient = require('../').ModbusClient

describe("Read Coils status", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);  
    let pdu2 = Buffer.from([0x01, 0x00, 0x48, 0x00, 0x0A]);
    
    let testMaster = new ModbusClient();
    
    it("request 1", () => {
       let req1 = testMaster.readCoilStatusPdu(0, 3);        
       expect(req1[0]).toEqual(1);     
       expect(req1[1]).toEqual(0);  
       expect(req1[4]).toEqual(3);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.readCoilStatusPdu(0x48, 10);
        expect(req2[0]).toEqual(1);     
        expect(req2[2]).toEqual(0x48); 
        expect(req2[4]).toEqual(10);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("Read Input status", () => {
       
    let testMaster = new ModbusClient();
    
    it("request 1", () => {
       let req1 = testMaster.readInputStatusPdu(0, 3);        
       expect(req1[0]).toEqual(2);     
       expect(req1[1]).toEqual(0);  
       expect(req1[4]).toEqual(3);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.readInputStatusPdu(0x48, 10);
        expect(req2[0]).toEqual(2);     
        expect(req2[2]).toEqual(0x48); 
        expect(req2[4]).toEqual(10);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("Read Holding register status", () => {
        
    let testMaster = new ModbusClient();
    
    it("request 1", () => {
       let req1 = testMaster.readHoldingRegistersPdu(0, 3);        
       expect(req1[0]).toEqual(3);     
       expect(req1[1]).toEqual(0);  
       expect(req1[4]).toEqual(3);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.readHoldingRegistersPdu(0x48, 10);
        expect(req2[0]).toEqual(3);     
        expect(req2[2]).toEqual(0x48); 
        expect(req2[4]).toEqual(10);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("Read Input register status", () => {
        
    let testMaster = new ModbusClient();
    
    it("request 1", () => {
       let req1 = testMaster.readInputRegistersPdu(0, 3);        
       expect(req1[0]).toEqual(4);     
       expect(req1[1]).toEqual(0);  
       expect(req1[4]).toEqual(3);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.readInputRegistersPdu(0x48, 10);
        expect(req2[0]).toEqual(4);     
        expect(req2[2]).toEqual(0x48); 
        expect(req2[4]).toEqual(10);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("force single Coils", () => {
        
    let testMaster = new ModbusClient();
    
    it("request 1", () => {
       let req1 = testMaster.forceSingleCoilPdu(testMaster.boolToBuffer(true), 3);        
       expect(req1[0]).toEqual(5);     
       expect(req1[2]).toEqual(3);  
       expect(req1[3]).toEqual(0xFF);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.forceSingleCoilPdu(testMaster.boolToBuffer(false), 10);
        expect(req2[0]).toEqual(5);     
        expect(req2[2]).toEqual(10); 
        expect(req2[4]).toEqual(0);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("Preset single register", () => {
        
    let testMaster = new ModbusClient();
    let val1 = Buffer.alloc(2);
    val1[0] = 0x25;
    val1[1] = 0x56;
    it("request 1", () => {
       let req1 = testMaster.presetSingleRegisterPdu(val1, 20); 
       expect(req1[0]).toEqual(6);     
       expect(req1[2]).toEqual(20);  
       expect(req1[4]).toEqual(0x56);  
       expect(req1.length).toEqual(5);    
    } );
    it("request 2", () => {
        let req2 = testMaster.presetSingleRegisterPdu(val1, 10);        
        expect(req2[0]).toEqual(6);     
        expect(req2[2]).toEqual(10); 
        expect(req2[3]).toEqual(0x25);  
        expect(req2.length).toEqual(5); 
    });
    
});

describe("write multiple Coils", () => {
        
    let testMaster = new ModbusClient();
    let val1 = Buffer.alloc(1);
    let val2 = Buffer.alloc(2);
    val1[0] = 0x36;
    val2[0] = 0x74;
    val2[1] = 0x25;
    it("request 1", () => {
       let req1 = testMaster.forceMultipleCoilsPdu(val1, 3, 5);        
       expect(req1[0]).toEqual(15);     
       expect(req1[2]).toEqual(3);  
       expect(req1[4]).toEqual(5);  
       expect(req1[5]).toEqual(1);  
       expect(req1[6]).toEqual(0x36);          
    } );
    it("request 2", () => {
        let req2 = testMaster.forceMultipleCoilsPdu(val2, 10, 12);
        expect(req2[0]).toEqual(15);     
        expect(req2[2]).toEqual(10); 
        expect(req2[4]).toEqual(12);  
        expect(req2[5]).toEqual(2); 
        expect(req2[7]).toEqual(0x25);  
    });
    
});

describe("write multiple register", () => {
        
    let testMaster = new ModbusClient();
    let val1 = Buffer.alloc(4);
    val1[0] = 0x25;
    val1[1] = 0x56;
    val1[2] = 0x46;
    val1[3] = 0x63;

    it("request 1", () => {
       let req1 = testMaster.presetMultipleRegistersPdu(val1, 20); 
       expect(req1[0]).toEqual(16);     
       expect(req1[2]).toEqual(20);  
       expect(req1[4]).toEqual(2);  
       expect(req1[5]).toEqual(4);  
       expect(req1.length).toEqual(10);    
    } );
    it("request 2", () => {
        let req2 = testMaster.presetMultipleRegistersPdu(val1, 10, 3);        
        expect(req2[0]).toEqual(16);     
        expect(req2[2]).toEqual(10); 
        expect(req2[4]).toEqual(3); 
        expect(req2[5]).toEqual(4);   
        expect(req2.length).toEqual(10); 
    });
    
});

describe("mask holding register", () => {
        
    let testMaster = new ModbusClient();
    let val1 = new Array(16);
    val1[0] = -1;
    val1[1] = 0;
    val1[2] = 1;
    val1[3] = -1;
    val1[4] = -1;
    val1[5] = -1;
    val1[6] = 0;
    val1[7] = 0;
    val1[8] = 1;
    val1[9] = -1;
    val1[10] = -1;
    val1[11] = -1;
    val1[12] = -1;
    val1[13] = -1;
    val1[14] = 1;
    val1[15] = 1;
    
    maskBuffer = testMaster.getMaskRegisterBuffer(val1);
    
    it("request 1", () => {
       let req1 = testMaster.maskHoldingRegisterPdu(maskBuffer, 20); 
       expect(req1[0]).toEqual(22);     
       expect(req1[2]).toEqual(20); 
       expect(req1.length).toEqual(7);    
    } );
    it("mask", () => {
        //masks
        let andMask =  maskBuffer.readUInt16BE(0);     
        let orMask =   maskBuffer.readUInt16BE(2); 
        let testRegister = Buffer.alloc(2)
        testRegister[0] = 0x9A;
        testRegister[1] = 0xFB;
        let currentContent = testRegister.readUInt16BE(0);
        let finalResult = (currentContent & andMask) | (orMask & (~andMask));
        let finalBuffer = Buffer.alloc(2);
        finalBuffer.writeUInt16BE(finalResult, 0);
        expect(maskBuffer[0]).toEqual(0x3E);
        expect(maskBuffer[1]).toEqual(0x39);
        expect(maskBuffer[2]).toEqual(0xFF);
        expect(maskBuffer[3]).toEqual(0x3D);
        expect(finalResult).toEqual(0xDB3D);
        expect(finalBuffer[0]).toEqual(0xDB);     
        expect(finalBuffer[1]).toEqual(0x3D); 
    });
    
});

describe("read and write multiple register", () => {
        
    let testMaster = new ModbusClient();
    let val1 = Buffer.alloc(4);
    val1[0] = 0x25;
    val1[1] = 0x56;
    val1[2] = 0x46;
    val1[3] = 0x63;

    it("request 1", () => {
       let req1 = testMaster.readWriteMultipleRegistersPdu(val1, 20, 5, 100); 
       expect(req1[0]).toEqual(23);     
       expect(req1[2]).toEqual(20);  
       expect(req1[4]).toEqual(5);  
       expect(req1[6]).toEqual(100);
       expect(req1[8]).toEqual(2);  
       expect(req1[9]).toEqual(4); 
       expect(req1.length).toEqual(14);    
    } );
    it("request 2", () => {
        let req2 = testMaster.readWriteMultipleRegistersPdu(val1, 10, 3, 20, 5);        
        expect(req2[0]).toEqual(23);     
        expect(req2[2]).toEqual(10); 
        expect(req2[4]).toEqual(3); 
        expect(req2[6]).toEqual(20);   
        expect(req2[8]).toEqual(5);  
        expect(req2[9]).toEqual(4);  
        expect(req2.length).toEqual(14); 
    });
    
});
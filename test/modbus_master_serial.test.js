const ModbusSerialClient = require('../').ModbusSerialClient


describe("Make reqest Buffer", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);  
    let pdu2 = [0x01, 0x00, 0x48, 0x00, 0x0A, 0x05];
    
    let testMaster = new ModbusSerialClient();
    
    it("fail to make request", () => {        
        
        req1 = testMaster.makeRequest(10, pdu2);
        req2 = testMaster.makeRequest(258, pdu1);
        expect(req1).toEqual(null);     
        expect(req2).toEqual(null);
          
            
    } );

    it("successful request", () => {

        req1 = testMaster.makeRequest(2, pdu1);       
        expect(req1[0]).toEqual(2);     
        expect(req1[1]).toEqual(1);  
        expect(req1[3]).toEqual(0);  
        expect(req1[5]).toEqual(3);
        expect(req1[6]).toEqual(0x7C);
        expect(req1[7]).toEqual(0x38);
        expect(req1.length).toEqual(8);  
    });

    it("successful request Ascii", () => {

        req = testMaster.makeRequest(2, pdu1);   
        req1 = testMaster.aduRtuToAscii(req)    
        expect(req1[0]).toEqual(0x3A);     
        expect(req1[2]).toEqual(0x32);  
        expect(req1[4]).toEqual(0x31);  
        expect(req1[12]).toEqual(0x33);
        expect(req1[13]).toEqual(0x46);
        expect(req1[14]).toEqual(0x41);
        expect(req1.length).toEqual(17);  
    });
    
});


describe("setReqTimer", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);     
    
    let testMaster = new ModbusSerialClient();
    
    it("successful request", () => {

        req1 = testMaster.makeRequest(2, pdu1);       
        
        let timed1 = testMaster.setReqTimer(1500);
        expect(timed1).toEqual(-1);

        testMaster.activeRequest = req1;
        let timed3 = testMaster.setReqTimer(100);
        let stored = testMaster.activeRequestTimerId;
        expect(stored).toEqual(timed3); 

        testMaster.on('req-timeout', (req) =>{            
            expect(req[0]).toEqual(2);
            expect(req[1]).toEqual(1);
        })
        

    });
    
});

describe('calc crc', () => {

    let adu1 = Buffer.from([0x02, 0x07, 0x00, 0x00]); 
    let adu2 = Buffer.from([0x02, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x03]);
    let adu3 = Buffer.from([0x02, 0x01, 0x01, 0x00, 0x00, 0x03]);
    
    let testMaster = new ModbusSerialClient();

    it('crc', ()=>{
        crc1 = testMaster.calcCRC(adu1);
        crc2 = testMaster.calcCRC(adu2);
        crc3 = testMaster.calcCRC(adu3);

        expect(crc1).toEqual(0x4112);
        expect(crc2).toEqual(0x7C38);
        expect(crc3).toEqual(0x51CC);

    })
    

})

describe("processResAdu", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]); 
    
    let testMaster = new ModbusSerialClient();
    
    it("response", () => {

        
        req1 = testMaster.makeRequest(2, pdu1);       
        testMaster.activeRequest = req1;
                
        let timed3 = testMaster.setReqTimer(100);        
        
        let res = Buffer.from([0x02, 0x01, 0x01, 0x00,  0x05, 0x80]); 

        testMaster.processResAdu(res);
        
        testMaster.on('transaction', (req, res) =>{            
            
            expect(req[0]).toEqual(2); 
            expect(req[5]).toEqual(3);
            expect(res[0]).toEqual(2); 
            expect(stored[5]).toEqual(80);
        })

    });
    
});
const ModbusSerialServer = require('../').ModbusSerialServer;

//creating config file for basic server 1
let server1Cfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256,
    address : 10,
    transmitionMode : 2
}

//calcLRC Test
describe("Testing calcLRC method", () => {
    let adu1 = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x36, 0x0d, 0x0a]);
    let adu2 = Buffer.from([0x3a, 0x30, 0x41, 0x30, 0x32, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x31, 0x36, 0x44, 0x44, 0x0d, 0x0a]);     
   
    let server1 = new ModbusSerialServer(server1Cfg);
    let server2 = new ModbusSerialServer();
    
    it("calculating LRC", () => {
        let lrc = server1.calcLRC(adu1) 
        
        expect(lrc).toEqual(0xF6);              
    } );
    it("calculating LRC", () => {
        let lrc = server2.calcLRC(adu2)  
        
        expect(lrc).toEqual(0xDD); 
        
    } );
    
    
});

//calcCRC test
describe("Testing calcCRC method", () => {
    let adu1 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC8]);
    let adu2 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7F]);     
   
    let server1 = new ModbusSerialServer(server1Cfg);
    let server2 = new ModbusSerialServer();
    
    it("calculating CRC", () => {
        let crc = server1.calcCRC(adu1) 
        
        expect(crc).toEqual(0xC5C8);              
    } );
    it("calculating CRC", () => {
        let crc = server2.calcCRC(adu2)  
        
        expect(crc).toEqual(0xA97F); 
        
    } );
    
    
});

//rtu to ascii convertion.
describe("Convert rtu to ascii. Testing aduRtuToAscii method", () => {
    let adu1 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC8, 0xC5]);
    let adu2 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0x7F, 0xA9]);     
   
    let server1 = new ModbusSerialServer(server1Cfg);
    let server2 = new ModbusSerialServer();
    
    it("convert rtu to ascii", () => {
        let ascii = server1.aduRtuToAscii(adu1)  
        
        expect(ascii[0]).toEqual(0x3A); 
        expect(ascii[1]).toEqual(48);     
        expect(ascii[2]).toEqual(49); 
        expect(ascii[3]).toEqual(48);
        expect(ascii[4]).toEqual(51);   
        expect(ascii[12]).toEqual(54); 
        expect(ascii[13]).toEqual(70); 
        expect(ascii[14]).toEqual(54); 
        expect(ascii[15]).toEqual(0x0D);  
        expect(ascii[16]).toEqual(0x0A); 
        expect(ascii.length).toEqual(2 * adu1.length + 1);     
    } );
    it("convert rtu to ascii", () => {
        let ascii = server2.aduRtuToAscii(adu2)  
        
        expect(ascii[0]).toEqual(0x3A); 
        expect(ascii[1]).toEqual(48);     
        expect(ascii[2]).toEqual(65); 
        expect(ascii[3]).toEqual(48);
        expect(ascii[4]).toEqual(50); 
        expect(ascii[11]).toEqual(49);  
        expect(ascii[12]).toEqual(54); 
        expect(ascii[13]).toEqual(68); 
        expect(ascii[14]).toEqual(68); 
        expect(ascii[15]).toEqual(0x0D);  
        expect(ascii[16]).toEqual(0x0A); 
        expect(ascii.length).toEqual(2 * adu2.length + 1);     
    } );
    
    
});

//ascii to rtu convertion.
describe("Testing aduAsciiToRtu method", () => {
    let adu1 = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x36, 0x0d, 0x0a]);
    let adu2 = Buffer.from([0x3a, 0x30, 0x41, 0x30, 0x32, 0x30, 0x30, 0x30, 0x31, 0x30, 0x30, 0x31, 0x36, 0x44, 0x44, 0x0d, 0x0a]);     
   
    let server1 = new ModbusSerialServer(server1Cfg);
    let server2 = new ModbusSerialServer();
    
    it("convert ascii to rtu", () => {
        let rtu = server1.aduAsciiToRtu(adu1)  
        
        expect(rtu[0]).toEqual(0x01); 
        expect(rtu[1]).toEqual(0x03);     
        expect(rtu[2]).toEqual(0x00); 
        expect(rtu[3]).toEqual(0x00);
        expect(rtu[5]).toEqual(0x06);  
        expect(rtu.length).toEqual((adu1.length - 1)/2);     
    } );
    it("convert ascii to rtu", () => {
        let rtu = server2.aduAsciiToRtu(adu2)  
        
        expect(rtu[0]).toEqual(0x0A); 
        expect(rtu[1]).toEqual(0x02);     
        expect(rtu[2]).toEqual(0x00); 
        expect(rtu[3]).toEqual(0x01);
        expect(rtu[5]).toEqual(0x16);  
        expect(rtu.length).toEqual((adu2.length - 1)/2);  
    } );
    
    
});

//validate checksum Test
describe("validating checsum", () => {
    let adu1 = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x36, 0x0d, 0x0a]);
    let adu2 = Buffer.from([0x3a, 0x30, 0x31, 0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x46, 0x35, 0x0d, 0x0a]);     
    let adu3 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7F]);
    let adu4 = Buffer.from([0x0A, 0x02, 0x00, 0x01, 0x00, 0x16, 0xA9, 0x7D]);

    let server1 = new ModbusSerialServer(server1Cfg);
    let server2 = new ModbusSerialServer();
    
    it("testing LRC", () => {

        expect(server1.validateCheckSum(adu1)).toEqual(true);
        expect(server1.validateCheckSum(adu2)).toEqual(false);

    } );
    it("testing CRC", () => {
        expect(server1.validateCheckSum(adu3)).toEqual(false);
        expect(server2.validateCheckSum(adu3)).toEqual(true);
        expect(server2.validateCheckSum(adu4)).toEqual(false);
        
    } );
    
    
});

//Test readExceptionCoilsService function
describe("Read Exception Coils status", () => {
    let pdu1 = Buffer.from([0x07]);
    let server1 = new ModbusSerialServer(server1Cfg);
   
    it("correct response server 1 reading on exception coils", () => {
        
        let res1 = server1.processReqPdu(pdu1)  
       
        expect(res1[0]).toEqual(7);     
        expect(res1[1]).toEqual(0);  
        expect(res1.length).toEqual(2);      
          
    });
    
});

//test broatcast logic
describe("Receiving a broadcast pdu", () =>{
    let pdu1 = Buffer.from([0x03, 0x00, 0x00, 0x00, 0x06]);
    let pdu2 = Buffer.from([0x06, 0x00, 0x01, 0x00, 0x16]); 

    let server1 = new ModbusSerialServer(server1Cfg);

    it("testing pdu1", () => {
        
        let res1 = server1.processBroadcastReqPdu(pdu1)  
       
        expect(res1[0]).toEqual(0x83);     
        expect(res1[1]).toEqual(1);  
        expect(res1.length).toEqual(2);      
          
    });
    it("testing adu2", () => {
        
        let res2 = server1.processBroadcastReqPdu(pdu2)  
       
        expect(res2[0]).toEqual(0x6);     
        expect(res2[4]).toEqual(0x16);  
          
    });
});

//test main function
describe("Receiving adu", () =>{
    let adu1 = Buffer.from([0x01, 0x07, 0x05]);
    let adu2 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC7]);
    let adu3 = Buffer.from([0x03, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC8]);
    let adu4 = Buffer.from([0x00, 0x03, 0x00, 0x02, 0x00, 0x0A, 0x65, 0xDC]);
    let adu5 = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x06, 0xC5, 0xC8]);
     

   
    let server1 = new ModbusSerialServer();

    it("bus error", () => {
        let resp = server1.getResponseAduBuffer(adu1) 
        //less than 4 bytes
        expect(server1.busCommunicationErrorCount).toEqual(1);
        expect(resp).toEqual(null);
        //wrong crc
        resp = server1.getResponseAduBuffer(adu2)
        expect(server1.busCommunicationErrorCount).toEqual(2);
        expect(resp).toEqual(null);   
        
        
    } );

    it("wrong address", () => {
        let resp = server1.getResponseAduBuffer(adu3);
        expect(resp).toEqual(null);
    });

    it("valid adu", () => {
        let resp = server1.getResponseAduBuffer(adu4);
        
        expect(server1.slaveMessageCount).toEqual(1);
        expect(server1.slaveNoResponseCount).toEqual(1);
        expect(server1.slaveExceptionErrorCount).toEqual(1);
        expect(resp).toEqual(null);

        resp = server1.getResponseAduBuffer(adu5);
        
        expect(resp[0]).toEqual(0x01);
        expect(resp[1]).toEqual(0x03);
        expect(resp[2]).toEqual(12);
        expect(resp.length).toEqual(17);
    });
    

});

const ModbusServer = require('../').ModbusServer

//creating config file for basic server 1
let server1Cfg = {
    inputs : 524,
    coils : 0,
    holdingRegisters : 512,
    inputRegisters : 256
}

//Creating  basic server 1
basicServer1 = new ModbusServer(server1Cfg);
//Creating a default setting server
basicServer2 = new ModbusServer();

//Writing values on server registers for testing purpose
basicServer1.coils[0] = 0x0f;
basicServer1.coils[1] = 0x52;
basicServer2.coils[10]=0xAA;

basicServer1.inputs[1] = 0x38;
basicServer2.inputs[0] = 0x76;

basicServer1.holdingRegisters[10] = 0x13;
basicServer1.holdingRegisters.writeUint16BE(1879, 12);
basicServer2.holdingRegisters.writeFloatBE(3.14);

basicServer1.inputRegisters.writeUInt32BE(25489);
basicServer2.inputRegisters.writeFloatBE(125.8);

describe("Server instantation", () => {
    
    it("correct input buffer length for server 1", () => {
        expect(basicServer1.inputs.length).toEqual(66);
    });
    it("correct default inputs buffer lenght on server 2", () => {
        expect(basicServer2.inputs.length).toEqual(256);
    });
    it("correct coil buffer length for server 1", () => {
        expect(basicServer1.coils.length).toEqual(1024);
    });
    it("correct default coils buffer lenght on server 2", () => {
        expect(basicServer2.coils.length).toEqual(256);
    });
    it("correct holding register buffer length for server 1", () => {
        expect(basicServer1.holdingRegisters.length).toEqual(1024);
    });
    it("correct default holding register buffer lenght on server 2", () => {
        expect(basicServer2.holdingRegisters.length).toEqual(4096);
    });
    it("correct input register buffer length for server 1", () => {
        expect(basicServer1.inputRegisters.length).toEqual(512);
    });
    it("correct default input register buffer lenght on server 2", () => {
        expect(basicServer2.inputRegisters.length).toEqual(4096);
    });
    it("chech correct writing register from user app", () => {
        expect(basicServer1.holdingRegisters[12]).toEqual(0x07);
        expect(basicServer1.holdingRegisters[13]).toEqual(0x57);
    });
});

describe("Read Coils status", () => {
    let pdu1 = Buffer.from([0x01, 0x00, 0x00, 0x00, 0x03]);
    let pdu2 = Buffer.from([0x01, 0x13, 0xA5, 0x00, 0x03]);
    let pdu3 = Buffer.from([0x01, 0x00, 0xA5, 0x07, 0xD3]);
    let pdu4 = Buffer.from([0x01, 0x00, 0x48, 0x00, 0x0A]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu1)  
       expect(res1[0]).toEqual(1);     
       expect(res1[1]).toEqual(1);  
       expect(res1[2]).toEqual(7);      
    } );
    it("correct response server 1 reading on holdings", () => {
        let res1 = basicServer1.processReqPdu(pdu4)  
        expect(res1[0]).toEqual(1);     
        expect(res1[1]).toEqual(2);  
        expect(res1[2]).toEqual(0);      
        expect(res1[3]).toEqual(3);  
    });
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x81);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x81);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Read inputs status", () => {
    let pdu1 = Buffer.from([0x02, 0x00, 0x00, 0x00, 0x05]);
    let pdu2 = Buffer.from([0x02, 0x23, 0xA5, 0x00, 0x03]);
    let pdu3 = Buffer.from([0x02, 0x00, 0xA5, 0x07, 0xD3]);
    let pdu4 = Buffer.from([0x02, 0x00, 0x00, 0x00, 0x0C]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu4)  
       expect(res1[0]).toEqual(2);     
       expect(res1[1]).toEqual(2);  
       expect(res1[2]).toEqual(0);  
       expect(res1[3]).toEqual(8);    
    } );
    it("correct response server 2", () => {
        let res1 = basicServer2.processReqPdu(pdu1)  
        expect(res1[0]).toEqual(2);     
        expect(res1[1]).toEqual(1);  
        expect(res1[2]).toEqual(0x16);
    });
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x82);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x82);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Read holding registers", () => {
    let pdu1 = Buffer.from([0x03, 0x00, 0x05, 0x00, 0x01]);
    let pdu2 = Buffer.from([0x03, 0xA3, 0xA5, 0x00, 0x03]);
    let pdu3 = Buffer.from([0x03, 0x00, 0xA5, 0x00, 0x7F]);
    let pdu4 = Buffer.from([0x03, 0x00, 0x05, 0x00, 0x02]);
    let pdu5 = Buffer.from([0x03, 0x00, 0x0, 0x00, 0x02]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu1)  
       expect(res1[0]).toEqual(3);     
       expect(res1[1]).toEqual(2);  
       expect(res1[2]).toEqual(0x13);      
       expect(res1[3]).toEqual(0);  
    } );
    it("correct response server 1 reading on holdings", () => {
        let res1 = basicServer1.processReqPdu(pdu4)  
        expect(res1[0]).toEqual(3);     
        expect(res1[1]).toEqual(4);  
        expect(res1[2]).toEqual(0x13);      
        expect(res1[3]).toEqual(0);
        expect(res1[4]).toEqual(0x07);      
        expect(res1[5]).toEqual(0x57);  
    });
    /*
    it("correct response server 2 reading on holdings", () => {
        let res1 = basicServer2.processReqPdu(pdu5)  
        expect(res1[0]).toEqual(3);     
        expect(res1[1]).toEqual(4);  
        expect(res1[2]).toEqual(0x13);      
        expect(res1[3]).toEqual(0);
        expect(res1[4]).toEqual(0x07);      
        expect(res1[5]).toEqual(0x57);  
    });*/
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x83);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x83);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Read input registers", () => {
    let pdu1 = Buffer.from([0x04, 0x00, 0x00, 0x00, 0x02]);
    let pdu2 = Buffer.from([0x04, 0xA3, 0xA5, 0x00, 0x03]);
    let pdu3 = Buffer.from([0x04, 0x00, 0xA5, 0x00, 0x7F]);
    let pdu4 = Buffer.from([0x04, 0x00, 0x00, 0x00, 0x02]);
    
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu1) 
       expect(res1[0]).toEqual(4);     
       expect(res1[1]).toEqual(4);  
       expect(res1[2]).toEqual(0);      
       expect(res1[3]).toEqual(0); 
       expect(res1[4]).toEqual(0x63);      
       expect(res1[5]).toEqual(0x91);  
    } );
    
    /*
    it("correct response server 2 reading on holdings", () => {
        let res1 = basicServer2.processReqPdu(pdu5)  
        expect(res1[0]).toEqual(3);     
        expect(res1[1]).toEqual(4);  
        expect(res1[2]).toEqual(0x13);      
        expect(res1[3]).toEqual(0);
        expect(res1[4]).toEqual(0x07);      
        expect(res1[5]).toEqual(0x57);  
    });*/
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x84);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x84);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Write Single Coils", () => {
    let pdu1 = Buffer.from([0x05, 0x00, 27, 0xFF,  0x00]);
    let pdu2 = Buffer.from([0x05, 0x13, 0xA5, 0x00, 0x00]);
    let pdu3 = Buffer.from([0x05, 0x00, 0xA5, 0x0, 0x03]);
    let pdu4 = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu1) 
        
       expect(res1[0]).toEqual(5);     
       expect(res1[2]).toEqual(27);  
       expect(res1[3]).toEqual(0xFF);      
       expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 27)).toEqual(true)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x85);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x85);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Write Single Register", () => {
    let pdu1 = Buffer.from([0x06, 0x00, 20, 0x34,  0x12]);
    let pdu2 = Buffer.from([0x06, 0x13, 0xA5, 0x00, 0x00]);
    let pdu3 = Buffer.from([0x06, 0x00, 0xA5, 0x00, 0x03, 0x45]);
    let pdu4 = Buffer.from([0x06, 0x00, 0x00, 0x00, 0x00]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
       let res1 = basicServer1.processReqPdu(pdu1) 
       
       expect(res1[0]).toEqual(6);     
       expect(res1[2]).toEqual(20);  
       expect(res1[3]).toEqual(0x34);      
       expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 20)[0]).toEqual(0x34)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x86);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x86);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Write Multiples Coils", () => {
    let pdu1 = Buffer.from([0x0F, 0x00, 30, 0x00, 0x0A, 0x02, 0x68, 0x01]);
    let pdu2 = Buffer.from([0x0F, 0x13, 0xA5, 0x00, 0x02, 0x01, 0x01]);
    let pdu3 = Buffer.from([0x0F, 0x00, 0x40, 0x07, 0xB3, 0xF6, 0x00]);
    let pdu4 = Buffer.from([0x0F, 0x00, 0x50, 0x00, 0x23, 0x02, 0x00]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
        basicServer1.setBoolToBuffer(true, basicServer1.holdingRegisters, 39);
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 39)).toEqual(true)
        let res1 = basicServer1.processReqPdu(pdu1) 
        expect(res1[0]).toEqual(15);     
        expect(res1[2]).toEqual(30);  
        expect(res1[4]).toEqual(0x0A);      
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 33)).toEqual(true)
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 35)).toEqual(true)
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 36)).toEqual(true)
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 38)).toEqual(true)
        expect(basicServer1.getBoolFromBuffer(basicServer1.coils, 39)).toEqual(false)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x8F);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x8F);     
        expect(res1[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
});

describe("Write Multiples Register", () => {
    let pdu1 = Buffer.from([0x10, 0x00, 20, 0x00, 0x03, 0x06, 0x18, 0x21, 0x36, 0xdf, 0x85, 0xca]);
    let pdu2 = Buffer.from([0x10, 0x13, 0xA5, 0x00, 0x02, 0x04, 0x01, 0, 25, 78]);
    let pdu3 = Buffer.from([0x10, 0x00, 0x40, 0x00, 0x7c, 0xF6, 0x00]);
    let pdu4 = Buffer.from([0x10, 0x00, 0x50, 0x00, 0x02, 0x04, 0x00, 0x01, 0x25]);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
    
    it("correct response server 1", () => {
        
        let res1 = basicServer1.processReqPdu(pdu1) 
        expect(res1[0]).toEqual(16);     
        expect(res1[2]).toEqual(20);  
        expect(res1[4]).toEqual(0x03);      
        expect(basicServer1.getWordFromBuffer(basicServer1.coils, 20)[0]).toEqual(0x18)
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 21)[1]).toEqual(0xdf)
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 22)[1]).toEqual(0xca)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x90);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x90);     
        expect(res1[1]).toEqual(3); 
        let res2 = exceptionserver1.processReqPdu(pdu4) 
        expect(res2[0]).toEqual(0x90);     
        expect(res2[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
    
});

describe("Mask Write Register", () => {
    let pdu1 = Buffer.from([0x16, 0x00, 8, 0x00, 0xf2, 0x00, 0x25]);
    let pdu2 = Buffer.from([0x16, 0x13, 0xA5, 0x00, 0x02, 0x04, 0x01]);
    let pdu3 = Buffer.from([0x16, 0x00, 0x40, 0x00, 0x7c, 0xF6]);

    let valBuffer = Buffer.from([0x00, 0x12]);
    basicServer1.setWordToBuffer(valBuffer, basicServer1.holdingRegisters, 8);
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
   
    it("correct response server 1", () => {
        
        let res1 = basicServer1.processReqPdu(pdu1) 
        
        expect(res1[0]).toEqual(0x16);     
        expect(res1[2]).toEqual(8);  
        expect(res1[4]).toEqual(0xf2);   
        expect(res1[6]).toEqual(0x25);
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 8)[0]).toEqual(0)
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 8)[1]).toEqual(0x17)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x96);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x96);     
        expect(res1[1]).toEqual(3);         
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
    
});

describe("Read/Write Multiple Registers", () => {
    let pdu1 = Buffer.from([0x17, 0x00, 0, 0x00, 0x03, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
    let pdu2 = Buffer.from([0x17, 0x13, 0xA5, 0x00, 0x02, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
    let pdu3 = Buffer.from([0x17, 0x00, 0, 0x00, 0x7E, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
    let pdu4 = Buffer.from([0x17, 0x00, 0, 0x00, 0x00, 0, 100, 0, 2, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
    let pdu5 = Buffer.from([0x17, 0x00, 0, 0x00, 0x01, 0, 100, 0x00, 0x7A, 4, 0x0f, 0xAA, 0xBB, 0xCC]);
    
    let exceptionserver1 = new ModbusServer(server1Cfg);
    let exceptionserver2 = new ModbusServer();
   
    it("correct response server 1", () => {
        basicServer1.holdingRegisters[4] = 0xAB;
        let res1 = basicServer1.processReqPdu(pdu1)         
        expect(res1[0]).toEqual(0x17); 
        expect(res1[1]).toEqual(0x06);  
        expect(res1[6]).toEqual(0xAB);
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 101)[0]).toEqual(0xBB)
        expect(basicServer1.getWordFromBuffer(basicServer1.holdingRegisters, 101)[1]).toEqual(0XCC)
    } );
    
    it("Check Illegal address", () => {
        let res1 = exceptionserver2.processReqPdu(pdu2)  
        expect(res1[0]).toEqual(0x97);     
        expect(res1[1]).toEqual(2);  
        exceptionserver2.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA ADDRESS'); 
        })      
    });
    it("Check Illegal data Value", () => {
        let res1 = exceptionserver1.processReqPdu(pdu3)  
        expect(res1[0]).toEqual(0x97);     
        expect(res1[1]).toEqual(3);  
        let res2 =  exceptionserver1.processReqPdu(pdu4)      
        expect(res2[0]).toEqual(0x97);     
        expect(res2[1]).toEqual(3); 
        let res3 =  exceptionserver1.processReqPdu(pdu5)
        expect(res3[0]).toEqual(0x97);     
        expect(res3[1]).toEqual(3); 
        exceptionserver1.on('exception', (functionCode, message) =>{            
            expect(message).toEqual('ILLEGAL DATA VALUE'); 
        })      
    });
    
});



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

describe("Server instantation", () => {
    
    it("correct input buffer length for server 1", () => {
        expect(basicServer1.inputs.length).toEqual(66);
    });
    it("correct default inputs buffer lenght", () => {
        expect(basicServer2.inputs.length).toEqual(256);
    });
    it("correct coil buffer length for server 1", () => {
        expect(basicServer1.coils.length).toEqual(1024);
    });
});

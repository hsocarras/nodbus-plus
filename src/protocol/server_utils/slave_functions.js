
var Slave_Functions = {};



//Importing supported functions

Slave_Functions.ReadCoilStatus = require('./modbus_functions/mbfunction01');
Slave_Functions.ReadInputStatus = require('./modbus_functions/mbfunction02');
Slave_Functions.ReadHoldingRegisters = require('./modbus_functions/mbfunction03');
Slave_Functions.ReadInputRegisters = require('./modbus_functions/mbfunction04');
Slave_Functions.ForceSingleCoil = require('./modbus_functions/mbfunction05');
Slave_Functions.PresetSingleRegister = require('./modbus_functions/mbfunction06');
Slave_Functions.ForceMultipleCoils = require('./modbus_functions/mbfunction15');
Slave_Functions.PresetMultipleRegisters = require('./modbus_functions/mbfunction16');
Slave_Functions.MaskHoldingRegister = require('./modbus_functions/mbfunction22');
Slave_Functions.MakeModbusException = require('./modbus_functions/Make_modbus_exception');
Slave_Functions.GetSuportedMBFunctionscode = function(mode){
    if(mode == 'tcp'){
        return new Set([1, 2, 3, 4, 5 ,6, 15, 16, 22]);
    }
    if(mode == 'rtu' || mode == 'ascii'){
        return new Set([1, 2, 3, 4, 5 ,6, 15, 16, 22]);
    }
}


module.exports = Slave_Functions;
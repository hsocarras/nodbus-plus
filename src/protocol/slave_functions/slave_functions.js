
var Slave_Functions = {};


//Implemented functions
const _supportedFunctions = [0x01,0x02,0x03,0x04,0x05,0x06,0x0F,0x10, 0x16];
//Importing supported functions
Slave_Functions.SuportedFunctions = _supportedFunctions;
Slave_Functions.ReadCoilStatus = require('./Read_Coil_Status');
Slave_Functions.ReadInputStatus = require('./Read_Input_Status');
Slave_Functions.ReadHoldingRegisters = require('./Read_Holding_Registers');
Slave_Functions.ReadInputRegisters = require('./Read_Input_Registers');
Slave_Functions.ForceSingleCoil = require('./Force_Single_Coil');
Slave_Functions.PresetSingleRegister = require('./Preset_Single_Register');
Slave_Functions.ForceMultipleCoils = require('./Force_Multiple_Coils');
Slave_Functions.PresetMultipleRegisters = require('./Preset_Multiple_Registers');
Slave_Functions.MaskHoldingRegister = require('./Mask_Holding_Register');
Slave_Functions.MakeModbusException = require('./Make_modbus_exception');

module.exports = Slave_Functions;
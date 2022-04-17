

/**
* function 01 of modbus protocol
* @param {string} id reference of device.
* @param {number} startcoil first coil to read, start at 0 coil
* @param {number} coilQuantity number of coils to read
* @return {boolean} true if succes, false if not connected, or waiting for response
*/
module.exports.ReadCoilStatus = function ReadCoilStatus(id, startCoil = 0, coilQuantity = 1){

    if(this.slaveList.has(id) == false){
        return false
    }

    let slave = this.slaveList.get(id);
    let isSuccesfull = false;
    //if is enable and there are no active request
    if(slave.isConnected && this.checkMaxRequest(slave) == false){            
        
        var adu = this.CreateADUReadCoilStatus(slave.transmision_mode, slave.address, startCoil, coilQuantity);
        var req = this.CreateRequest(id, adu);
        let isRequestStacked = slave.AddRequest(req);            
        if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
        }          
    }

    return isSuccesfull;

};

/**
 * function 02 of modbus protocol
 * @param {string} id reference of device.
 * @param {number} startInput first Input to read, start at 0 coil
 * @param {number} InputQuantity number of Inputs to read
 * @return {boolean} true if succes, false if not connected, or waiting for response
 */
module.exports.ReadInputStatus = function ReadInputStatus(id, startInput = 0, inputQuantity = 1){
    if(this.slaveList.has(id) == false){
        return false
    }

    let slave = this.slaveList.get(id);
    let isSuccesfull = false;
    if(slave.isConnected && this.checkMaxRequest(slave) == false){   

        var adu = this.CreateADUReadInputStatus(slave.transmision_mode, slave.address, startInput, inputQuantity);
        var req = this.CreateRequest(id, adu);
        let isRequestStacked = slave.AddRequest(req);            
        if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
        }        
    }

    return isSuccesfull;
}

/**
 * function 03 of modbus protocol
 * @param {string} id reference of device.
 * @param {number} startRegister first holding register to read, start at 0 coil
 * @param {number} registerQuantity number of holding register to read
 * @return {boolean} true if succes, false if not connected, or waiting for response
 */
module.exports.ReadHoldingRegisters = function ReadHoldingRegisters(id, startRegister = 0, registerQuantity = 1){
    if(this.slaveList.has(id) == false){
        return false
    }

    let slave = this.slaveList.get(id);
    let isSuccesfull = false;
    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        
        var adu = this.CreateADUReadHoldingRegisters(slave.transmision_mode, slave.address, startRegister, registerQuantity);
        var req = this.CreateRequest(id, adu);
        let isRequestStacked = slave.AddRequest(req);            
        if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
        }        
    }
    return isSuccesfull;
}

/**
  * function 04 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister first input register to read, start at 0 coil
  * @param {number} registerQuantity number of input register to read
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.ReadInputRegisters = function ReadInputRegisters(id, startRegister = 0, registerQuantity = 1){
    if(this.slaveList.has(id) == false){
        return false
    }

    let slave = this.slaveList.get(id);
    let isSuccesfull = false;
    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        
        var adu = this.CreateADUReadInputRegisters(slave.transmision_mode, slave.address, startRegister, registerQuantity);
        var req = this.CreateRequest(id, adu);
        let isRequestStacked = slave.AddRequest(req);            
        if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
        }
        
    }

    return isSuccesfull;
}

/**
  * function 05 of modbus protocol
  * @param {string} id reference of device.
  * @param {bool} value value to force
  * @param {number} startcoil first coil to write, start at 0 coil
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.ForceSingleCoil = function ForceSingleCoil(id, value, startCoil = 0){

    if(this.slaveList.has(id) == false){
        return false
    }

    let bufferValue = Buffer.alloc(2);
    let slave = this.slaveList.get(id);
    let isSuccesfull = false;

    if(value){
        bufferValue[0] = 0xFF;
    }
    if(slave.isConnected && this.checkMaxRequest(slave) == false){        
        try{
            var adu = this.CreateADUForceSingleCoil(slave.transmision_mode, slave.address, startCoil, bufferValue);            
            var req = this.CreateRequest(id, adu);
            let isRequestStacked = slave.AddRequest(req);            
            if(isRequestStacked){
                isSuccesfull = this.netClient.Write(id, req);
            }
        }
        catch(e){
            console.log(e.message);
            console.log(e.fileName);
            console.log(e.lineNumber);
            return isSuccesfull;
        }
        
    }
    return isSuccesfull;
}

/**
  * function 06 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister register to write.
  * @param {number} value value to force
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.PresetSingleRegister = function PresetSingleRegister(id, value, startRegister = 0){
    if(this.slaveList.has(id) == false){
        return false
    }

    let bufferValue = Buffer.alloc(2);
    let slave = this.slaveList.get(id);
    let isSuccesfull = false;

    if(value >= 0){
        if(slave.endianess == 'BE'){
            bufferValue.writeUInt16BE(value);
        }
        else{
            bufferValue.writeUInt16LE(value);
        }        
    }
    else{
        if(slave.endianess == 'BE'){
            bufferValue.writeInt16BE(value);
        }
        else{
            bufferValue.writeInt16LE(value);
        }         
    }

    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        try{
            var adu = this.CreateADUPresetSingleRegister(slave.transmision_mode, slave.address, startRegister, bufferValue);
            var req = this.CreateRequest(id, adu);
            let isRequestStacked = slave.AddRequest(req);            
            if(isRequestStacked){
                isSuccesfull = this.netClient.Write(id, req);
            }
        }
        catch(e){
            console.log(e.message);
            console.log(e.fileName);
            console.log(e.lineNumber);
            return isSuccesfull;
        }
    }

    return isSuccesfull;
}

/**
  * function 15 of modbus protocol
  * @param {string} id reference of device.
  * @param {bool[]} forceData array of values to write.
  * @param {number} startCoil first coil to write, start at 0 coil.
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.ForceMultipleCoils = function ForceMultipleCoils(id, forceData, startCoil = 0){
    if(this.slaveList.has(id) == false){
        return false
    }

    let coilQuantity = forceData.length;
    let bufferValue = Buffer.alloc(Math.floor((coilQuantity - 1)/8)+1);    
    let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];
    let slave = this.slaveList.get(id);
    let isSuccesfull = false;

    for(let i =0; i < coilQuantity; i++){
        if(forceData[i] == true){
        bufferValue[Math.floor(i/8)] = bufferValue[Math.floor(i/8)] | masks[i%8];
        }
        else {
        bufferValue[Math.floor(i/8)] = bufferValue[Math.floor(i/8)] & (~masks[i%8]);
        }
    }

    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        try{ 
            var adu = this.CreateADUForceMultipleCoils(slave.transmision_mode, slave.address, startCoil, coilQuantity, bufferValue);
            var req = this.CreateRequest(id, adu);
            let isRequestStacked = slave.AddRequest(req);            
            if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
            }     
        }
        catch(e){
            console.log(e.message);
            console.log(e.fileName);
            console.log(e.lineNumber);
            return isSuccesfull;
        }   
    }

    return isSuccesfull;
}

/**
  * function 16 of modbus protocol
  * @param {string} id reference of device.
  * @param {number[]} forceData array whit the values to write
  * @param {number} startRegister register to write.
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.PresetMultipleRegisters = function PresetMultipleRegisters(id, forceData, startRegister = 0){
    if(this.slaveList.has(id) == false){
        return false
    }

    let bufferValue = Buffer.alloc(0);
    let slave = this.slaveList.get(id);


    forceData.forEach(function(value){
        let tempBufer = null;
        if(Number.isInteger(value)){
            if(value >= 0 && value <= 65535){
                tempBufer = Buffer.alloc(2);
                if(slave.endianess == 'BE'){
                    tempBufer.writeUInt16BE(value);
                }
                else{
                    tempBufer.writeUInt16LE(value);
                }             
                bufferValue = Buffer.concat([bufferValue, tempBufer], bufferValue.length + 2)
            }
            else if (value < 0 && value > -32767) {
                tempBufer = Buffer.alloc(2);
                if(slave.endianess == 'BE'){
                    tempBufer.writeInt16BE(value);
                }
                else{
                    tempBufer.writeInt16LE(value);
                }             
                bufferValue = Buffer.concat([bufferValue, tempBufer], bufferValue.length + 2)
            }
            else{
                tempBufer = Buffer.alloc(4);
                if(slave.endianess == 'BE'){
                    tempBufer.writeInt32BE(value);
                }
                else{
                    tempBufer.writeInt32LE(value);
                }             
                bufferValue = Buffer.concat([bufferValue, tempBufer.swap16()], bufferValue.length + 4)
            }
        }
        else{
            tempBufer = Buffer.alloc(4);
            if(slave.endianess == 'BE'){
                tempBufer.writeFloatBE(value);
            }
            else{
                tempBufer.writeFloatLE(value);
            }         
            bufferValue = Buffer.concat([bufferValue, tempBufer.swap16()], bufferValue.length + 4);
        }

    })

    let registerQuantity = bufferValue.length/2;
    let isSuccesfull = false;

    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        try{ 
            var adu = this.CreateADUPresetMultipleRegisters(slave.transmision_mode, slave.address, startRegister, registerQuantity, bufferValue);
            var req = this.CreateRequest(id, adu);
            let isRequestStacked = slave.AddRequest(req);            
            if(isRequestStacked){
                isSuccesfull = this.netClient.Write(id, req);
            }  
        }
        catch(e){
            console.log(e.message);
            console.log(e.fileName);
            console.log(e.lineNumber);
            return isSuccesfull;
        }  
            
    }
    return isSuccesfull;    
}

/**
  * function 22 of modbus protocol
  * @param {string} id reference of device.
  * @param {number} startRegister register to write.    
  * @param {int [16]} value : array with 1 in position that want to be true, 0 on position that
  * want to be false and -1 in position that not to be modified.
  * example register value is [0 1 1 0   1 1 0 0    0 1 1 1   1 0 0 1] 0x9E36
  *         desired value is  [1 0 0 1  -1 0 1 -1  -1 -1 0 0  1 1 -1 0]
  *         result            [1 0 0 1   1 0 1 0    0 1 0 0   1 1 0 0] 0x3259
  * @return {boolean} true if succes, false if not connected, or waiting for response
  */
module.exports.MaskHoldingRegister = function MaskHoldingRegister(id, value, startRegister = 0){
    if(this.slaveList.has(id) == false){
      return false
    }
  
    let bufferValue = this.CalcMaskRegisterBuffer(value)
    let slave = this.slaveList.get(id);
    let isSuccesfull = false;
  
    if(slave.isConnected && this.checkMaxRequest(slave) == false){
        try{ 
            var adu = this.CreateADUMaskHoldingRegister(slave.transmision_mode, slave.address, startRegister, bufferValue);
            var req = this.CreateRequest(id, adu);
            let isRequestStacked = slave.AddRequest(req);            
            if(isRequestStacked){
            isSuccesfull = this.netClient.Write(id, req);
            }
        }
        catch(e){
            console.log(e.message);
            console.log(e.fileName);
            console.log(e.lineNumber);
            return isSuccesfull;
        }   
    }
    return isSuccesfull;
}

module.exports.EmitConnect = function EmitConnect(id){
    let slave = this.slaveList.get(id);
    slave.isConnected = true;

      /**
     * connect event.
     * @event ModbusTCPClient#connect
     * @type {object}
     */
      this.emit('connect',id);       
}

module.exports.EmitTimeout = function EmitTimeout(id, req){

    let slave = this.slaveList.get(id);

    if(slave.maxRetries == req._retriesNumber){
      slave.RemoveRequest(req)
      /**
      * timeout event.
      * @event ModbusClient#timeout
      */
      this.emit('timeout', id, req);        
    }
    else{
      this.netClient.Write(id, req);
      req._retriesNumber++;
    }
}

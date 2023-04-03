

class ModbusMaster extends EventEmitter {
    /**
    * Create a Modbus Master.
    */
    constructor(){
        super();
        var self = this; 
         /**
        * number of transaction
        * @type {number}
        */
        var transactionCountValue = 1;
        Object.defineProperty(self, 'transactionCounter', {
            get: function(){
                return transactionCountValue;
            },
            set: function(value){
                if(value <= 0xFFFF ){
                if(value = transactionCountValue + 1){
                    transactionCountValue = value;
                }                    
                }
                else{
                    transactionCountValue = 1;
                }
            },
            enumerable: false,
            configurable: false
        } ) 
    }  

    /**
    * Build a request PDU
    * @param {number} modbusFunction modbus function
    * @param {startAddres} startAddres starting at 0 address
    * @param {pointsQuantity} pointsQuantity
    * @param {Buffer} values values to write
    * @return {Object} PDU object
    */
    CreateRequestPDU(modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values) {
        var self = this;

        //creando la pdu del request
        var request = self.CreatePDU();        
        //chequeando el argumento values
        

        switch(modbusFunction){
        case 1:
            //funcion 01 read coils status
            request.modbus_function = 0x01;
            request.modbus_data = Buffer.alloc(4);
            request.modbus_data.writeUInt16BE(startAddres,0);
            request.modbus_data.writeUInt16BE(pointsQuantity,2);
            request.MakeBuffer();
            return request;
            break;
        case 2:
            //funcion 02 read inputs status
            request.modbus_function = 0x02;
            request.modbus_data = Buffer.alloc(4);
            request.modbus_data.writeUInt16BE(startAddres,0);
            request.modbus_data.writeUInt16BE(pointsQuantity,2);
            request.MakeBuffer();
            return request;
            break;
        case 3:
            //funcion 0x03 leer holdings registers
            request.modbus_function = 0x03;
            request.modbus_data = Buffer.alloc(4);
            request.modbus_data.writeUInt16BE(startAddres,0);
            request.modbus_data.writeUInt16BE(pointsQuantity,2);
            request.MakeBuffer();
            return request;
            break;
        case 4:
                //funcion 0x04 read input registers
            request.modbus_function = 0x04;
            request.modbus_data = Buffer.alloc(4);
            request.modbus_data.writeUInt16BE(startAddres,0);
            request.modbus_data.writeUInt16BE(pointsQuantity,2);
            request.MakeBuffer();
            return request;
            break;
        case 5:
            //funcion 05 write single coil            
            if(values instanceof Buffer){
                request.modbus_function = 0x05;
                request.modbus_data = Buffer.alloc(4);
                request.modbus_data.writeUInt16BE(startAddres,0);
                values.copy(request.modbus_data,2);          
                request.MakeBuffer();
                return request;
                break;
            }            
            else{
                throw new TypeError('Error, values must be a Buffer', "modbus_master.js", 114);
                break;
            }            
        case 6:
            if(values instanceof Buffer){
                //creando la pdu del request
                var request = this.CreatePDU();
                //funcion 06 PresetSingleRegister
                request.modbus_function = 0x06;
                request.modbus_data = Buffer.alloc(4);
                request.modbus_data.writeUInt16BE(startAddres,0);
                values.copy(request.modbus_data,2);
                request.MakeBuffer();
                return request;
            }            
            else{
                throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 130);
                break;
            }
        case 15:
            //function 15 force multiples coils
            if(values instanceof Buffer){
                request.modbus_function = 0x0F;
                //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
                request.modbus_data = Buffer.alloc(5 + values.length);
                request.modbus_data.writeUInt16BE(startAddres,0);
                request.modbus_data.writeUInt16BE(pointsQuantity,2);
                request.modbus_data[4]= values.length;
                values.copy(request.modbus_data,5);
                request.MakeBuffer();
                return request;
            }
            else{
                throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 148);
                break;
            }
        case 16:
            //function 16 write multiples coils
            if(values instanceof Buffer){
                request.modbus_function = 0x10;
                //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
                request.modbus_data = Buffer.alloc(5 + pointsQuantity*2);
                request.modbus_data.writeUInt16BE(startAddres,0);
                request.modbus_data.writeUInt16BE(pointsQuantity,2);
                request.modbus_data[4]= values.length;
                values.copy(request.modbus_data,5);
                request.MakeBuffer();
                return request;
            }
            else{
                throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 164);
                break;
            }
        case 22:
            //function 22 mask holding register
            if(values instanceof Buffer){
                request.modbus_function = 0x16;              
                request.modbus_data = Buffer.alloc(6);
                request.modbus_data.writeUInt16BE(startAddres,0);              
                values.copy(request.modbus_data,2);              
                request.MakeBuffer();
                return request;
            }
            else{
                throw new TypeError('Error, values must be a Buffer', 'modbus_master.js', 178);
                break;
            }
        default:
            throw new Error('Error, modbus function not supported', 'modbus_master.js', 1482);
        }
        
        
    }
    
    /**
    * extract data for a slave response.
    * @param {object} responsePDU PDU received
    * @param {object} reqPDU  PDU sended
    * @return {Object} map Object whit register:value pairs
    */
    ParseResponsePDU(responsePDU, reqPDU){

    let data = new Map();   
    
    let index = 0;
    let offset = 0;
    let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];           
    let startItem = reqPDU.modbus_data.readUInt16BE(0);
    let numberItems = reqPDU.modbus_data.readUInt16BE(2);
    let key = '';
    let value;
    let timestamp = Date.now();

    switch(responsePDU.modbus_function){
        case 0x01:
            for(let i = 0; i < numberItems; i++){
              index = Math.floor(i/8) + 1;
              offset = i % 8;
              value = (responsePDU.modbus_data[index] & masks[offset]) ? true : false;
              key = '0x'.concat((startItem + i).toString());
              data.set(key, value);
            }
            break;
        case 0x02:
          for(let i = 0; i < numberItems; i++){
            index = Math.floor(i/8) + 1;
            offset = i % 8;
            value = (responsePDU.modbus_data[index] & masks[offset]) ? true : false;
            key = '1x'.concat((startItem + i).toString());
            data.set(key, value);
          }
          break;
        case 0x03:
          for(let i = 0; i < numberItems; i++){
            value = Buffer.alloc(2);
            value[0] = responsePDU.modbus_data[2*i+1];
            value[1] = responsePDU.modbus_data[2*i+2];
            key = '4x'.concat((startItem + i).toString());
            data.set(key, value);
          }
          break;
        case 0x04:
          for(let i = 0; i < numberItems; i++){
            value = Buffer.alloc(2);
            value[0] = responsePDU.modbus_data[2*i+1];
            value[1] = responsePDU.modbus_data[2*i+2];
            key = '3x'.concat((startItem + i).toString());
            data.set(key, value);
          }
          break;
        case 0x05:
          startItem = responsePDU.modbus_data.readUInt16BE(0);
          key = '0x'.concat(startItem.toString());

            if(responsePDU.modbus_data[2] == 0xff){
              value = true;
            }
            else{
              value = false;
            }
            data.set(key, value);
            break;
        case 0x06:
          startItem = responsePDU.modbus_data.readUInt16BE(0);
          key = '4x'.concat(startItem.toString());
          value = Buffer.alloc(2);
          value[0] = responsePDU.modbus_data[2];
          value[1] = responsePDU.modbus_data[3];
          data.set(key, value);
          break;
        case 0x0f:
          startItem = responsePDU.modbus_data.readUInt16BE(0);
          numberItems = responsePDU.modbus_data.readUInt16BE(2);
          for(let i = 0; i < numberItems; i++){
            index = Math.floor(i/8);
            offset = i % 8;
            value = (reqPDU.modbus_data[index + 5] & masks[offset]) ? true : false;
            key = '0x'.concat((startItem + i).toString());
            data.set(key, value);
          }
          break;
        case 0x10:
          startItem = responsePDU.modbus_data.readUInt16BE(0);
          numberItems = responsePDU.modbus_data.readUInt16BE(2);
          for(let i = 0; i < numberItems; i++){
              value = Buffer.alloc(2);
              value[0] = reqPDU.modbus_data[2*i+5];
              value[1] = reqPDU.modbus_data[2*i+6];
              key = '4x'.concat((startItem + i).toString());
              data.set(key, value);
            }
            break;
        case 0x16:
          startItem = responsePDU.modbus_data.readUInt16BE(0);
          key = '4x'.concat(startItem.toString());
          let mask = Buffer.alloc(2);
          value = [0, 0];
          mask= responsePDU.modbus_data.readUInt16BE(2);
          value[0] = mask;
          mask= responsePDU.modbus_data.readUInt16BE(4);
          value[1] = mask;
          data.set(key, value);
          break;            
        default:
          //modbus exeption
            key = 'exception';            
            value = responsePDU.modbus_data[0];
            data.set(key, value);             
            break
            
            
    }
    
    return data;
    }

    /**
    * function to create a rtu adu
    * @param {number} address: Modbus slave's address 
    * @param {number} modbusFunction: Modbus function to execute.
    * @param {number} startAddres: Initial Register, Starting at 0.
    * @param {number} pointsQuantity: Register's number to read or write.
    * @param {Buffer} values values to write 
    * @return {object} serial adu.
    */
    CreateReqRtuADU(address = 1, modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values){
        let reqADU = new SerialADU('rtu');
        if(address >= 1 && address <= 247){            
            reqADU.address = address;
            try{
                reqADU.pdu = this.CreateRequestPDU(modbusFunction, startAddres, pointsQuantity, values);
                reqADU.MakeBuffer();
            }
            catch(e){
                throw e;
            }
        }
        else{
            throw new RangeError('Address must be a value fron 1 to 247', 'modbus_master_serial.js', '48');
        }

      return reqADU
    }

    /**
    * function to create a rtu adu
    * @param {number} address: Modbus slave's address 
    * @param {number} modbusFunction: Modbus function to execute.
    * @param {number} startAddres: Initial Register, Starting at 0.
    * @param {number} pointsQuantity: Register's number to read or write.
    * @param {Buffer} values values to write 
    * @return {object} serial adu.
    */
    CreateReqAsciiADU(address = 1, modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values){
        let reqADU = new SerialADU('ascii');
        if(address >= 1 && address <= 247){            
            reqADU.address = address;
            try{
                reqADU.pdu = this.CreateRequestPDU(modbusFunction, startAddres, pointsQuantity, values);
                reqADU.MakeBufferASCII();
            }
            catch(e){
                throw e;
            }
        }
        else{
            throw new RangeError('Address must be a value fron 1 to 247', 'modbus_master_serial.js', '48');
        }

        return reqADU
    }

    /**
    * function to create a rtu adu
    * @param {number} address: Modbus slave's address 
    * @param {number} modbusFunction: Modbus function to execute.
    * @param {number} startAddres: Initial Register, Starting at 0.
    * @param {number} pointsQuantity: Register's number to read or write.
    * @param {Buffer} values values to write 
    * @return {object} serial adu.
    */
    CreateReqTCPADU(address = 1, modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values){
        let reqADU = new TcpADU();
        if(address >= 1 && address <= 247){            
            reqADU.address = address;
            reqADU.transactionCounter = this.transactionCounter; 
            try{
                reqADU.pdu = this.CreateRequestPDU(modbusFunction, startAddres, pointsQuantity, values);
                reqADU.MakeBuffer();
                this.transactionCounter++;
            }
            catch(e){
                throw e;
            }
        }
        else{
            throw new RangeError('Address must be a value fron 1 to 247', 'modbus_master_tcp.js', '72');
        }

        return reqADU
    }

    /**
    * function 01 of modbus protocol
    * @param {string} mode 'ascii', rtu or default 'tcp': Mode of transmision.
    * @param {number} address reference of device.
    * @param {number} startcoil first coil to read, start at 0.
    * @param {number} coilQuantity number of coils to read
    * @return {adu} 
    */
    CreateADUReadCoilStatus(mode = 'tcp', address = 1, startCoil = 0, coilQuantity = 1){
        if(mode == "rtu"){
            return this.CreateReqRtuADU(address, 1, startCoil, coilQuantity);
        }
        else if(mode == "ascii"){
            return this.CreateReqAsciiADU(address, 1, startCoil, coilQuantity);
        }
        else{
            return this.CreateReqTCPADU(address, 1, startCoil, coilQuantity); 
        }
    }

    /**
    * function 02 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.
    * @param {number} startinput first input to read, start at 0.
    * @param {number} inputQuantity number of inputs to read
    * @return {adu} 
    */
    CreateADUReadInputStatus(mode = 'tcp', address = 1, startinput = 0, inputQuantity = 1){

        if(mode == "rtu"){
            return this.CreateReqRtuADU(address, 2, startinput, inputQuantity);
        }
        else if(mode == "ascii"){
            return this.CreateReqAsciiADU(address, 2, startinput, inputQuantity);
        }
        else{
            return this.CreateReqTCPADU(address, 2, startinput, inputQuantity);
        }
    }

    /**
    * function 03 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.
    * @param {number} startRegister first holding register to read, start at 0.
    * @param {number} registerQuantity number of holding register to read.
    * @return {adu} 
    */
    CreateADUReadHoldingRegisters(mode = 'tcp', address = 1, startRegister = 0, registerQuantity = 1){

        if(mode == "rtu"){
            return this.CreateReqRtuADU(address, 3, startRegister, registerQuantity);
        }
        else if(mode == "ascii"){
            return this.CreateReqAsciiADU(address, 3, startRegister, registerQuantity);
        }
        else{
            return this.CreateReqTCPADU(address, 3, startRegister, registerQuantity);
        }
    }

    /**
    * function 04 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.
    * @param {number} startRegister first input register to read, start at 0.
    * @param {number} registerQuantity number of input register to read.
    * @return {adu} 
    */
    CreateADUReadInputRegisters(mode = 'tcp', address = 1, startRegister = 0, registerQuantity = 1){

        if(mode == "rtu"){
            return this.CreateReqRtuADU(address, 4, startRegister, registerQuantity);
        }
        else if(mode == "ascii"){
            return this.CreateReqAsciiADU(address, 4, startRegister, registerQuantity);
        }
        else{
            return this.CreateReqTCPADU(address, 4, startRegister, registerQuantity);
        }
    }

    /**
    * function 05 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.
    * @param {number} startcoil first coil to write, start at 0 coil
    * @param {Buffer} value value to force
    * @return {adu}
    */
    CreateADUForceSingleCoil(mode = 'tcp', address = 1, startCoil = 0, value){        
        var reqAdu;
        try{
            if(mode == "rtu"){
                reqAdu = this.CreateReqRtuADU(address, 5, startCoil, 1, value);
            }
            else if(mode == "ascii"){
                reqAdu = this.CreateReqAsciiADU(address, 5, startCoil, 1, value);
            }
            else{
                reqAdu = this.CreateReqTCPADU(address, 5, startCoil, 1, value);
            }
            return reqAdu;
        }
        catch(e){
            throw e;
        }
        
    }

    /**
    * function 06 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.
    * @param {number} startRegister register to write.
    * @param {Buffer} value value to force
    * @return {adu}
    */
    CreateADUPresetSingleRegister(mode = 'tcp', address = 1, startRegister = 0, value){

        var reqAdu;
        try{
            if(mode == "rtu"){
                reqAdu = this.CreateReqRtuADU(address, 6, startRegister, 1, value);
            }
            else if(mode == "ascii"){
                reqAdu = this.CreateReqAsciiADU(address, 6, startRegister, 1, value);
            }
            else{
                reqAdu = this.CreateReqTCPADU(address, 6, startRegister, 1, value);
            }
            return reqAdu;
        }
        catch(e){
            throw e;
        }
    }

    /**
    * function 15 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.    
    * @param {number} startCoil first coil to write, start at 0 coil.
    * @param {number} coilQuantity number of coils to read
    * @param {Buffer} value value to force.
    * @return {adu}
    */
    CreateADUForceMultipleCoils(mode = 'tcp', address = 1, startCoil = 0, coilQuantity, value){
        var reqAdu;
        try{
            if(mode == "rtu"){
                reqAdu = this.CreateReqRtuADU(address, 15, startCoil, coilQuantity, value);
            }
            else if(mode == "ascii"){
                reqAdu = this.CreateReqAsciiADU(address, 15, startCoil, coilQuantity, value);
            }
            else{
                reqAdu = this.CreateReqTCPADU(address, 15, startCoil, coilQuantity, value);
            }
            return reqAdu;
        }
        catch(e){
            throw e;
        }        

    }

    /**
    * function 16 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.    
    * @param {number} startRegister register to write.
    * @param {number} registerQuantity number of holding register to read.
    * @param {Buffer} value value to write.
    * @return {adu}
    */
    CreateADUPresetMultipleRegisters(mode = 'tcp', address = 1, startRegister = 0, registerQuantity, value){
        var reqAdu;
        try{
            if(mode == "rtu"){
                reqAdu = this.CreateReqRtuADU(address, 16, startRegister, registerQuantity, value);
            }
            else if(mode == "ascii"){
                reqAdu = this.CreateReqAsciiADU(address, 16, startRegister, registerQuantity, value);
            }
            else{
                reqAdu = this.CreateReqTCPADU(address, 16, startRegister, registerQuantity, value);
            }
            return reqAdu;
        }
        catch(e){
            throw e;
        } 
        
    }

    /**
    * function 22 of modbus protocol
    * @param {string} mode 'ascii' , rtu or default 'tcp': Mode of transmision.
    * @param {string} address reference of device.    
    * @param {number} startRegister register to write.    
    * @param {Buffer} value value to write.
    * @return {adu}
    */
    CreateADUMaskHoldingRegister(mode = 'tcp', address = 1, startRegister = 0, value){
        var reqAdu;
        try{
            if(mode == "rtu"){
                reqAdu = this.CreateReqRtuADU(address, 22, startRegister, 1, value);
            }
            else if(mode == "ascii"){
                reqAdu = this.CreateReqAsciiADU(address, 22, startRegister, 1, value);
            }
            else{
                reqAdu = this.CreateReqTCPADU(address, 22, startRegister, 1, value);
            }
            return reqAdu;
        }
        catch(e){
            throw e;
        } 

    }

    /**
     * @brief This function calculate the necesary buffer to realize the desired mask function
     * @param {int[]} valueArray: array with 1 in position that want to be true, 0 on position that
    * want to be false and -1 in position that not to be modified.
    * example register value is [0 1 1 0   1 1 0 0    0 1 1 1   1 0 0 1] 0x9E36
    *         desired value is  [1 0 0 1  -1 0 1 -1  -1 -1 0 0  1 1 -1 0]
    *         result            [1 0 0 1   1 0 1 0    0 1 0 0   1 1 0 0] 0x3259
    * @returns {Buffer}
    */
    CalcMaskRegisterBuffer(valueArray){

    let value = Buffer.alloc(4);
    let AND_Mask = 0x00;
    let OR_Mask = 0xFFFF;
    let tempMask = 1;

    for (let i = 0; i <valueArray.length; i++){
        
        if(valueArray[i] == 1){
        //AND_MASK = 0;
        //OR_Mask = 1;        
        }
        else if(value[i] == 0){ 
        //AND_MASK = 0;       
        OR_Mask = OR_Mask  & (~tempMask); //OR_MASK = 0
        }
        else{
        AND_Mask = AND_Mask | tempMask;
        }
        
        tempMask = tempMask << 1; 
    }   
  
    value.writeUInt16BE(AND_Mask);
    value.writeUInt16BE(OR_Mask, 2);

    return value;

    }

    
}

module.exports = ModbusMaster;


/**
** Modbus TCP Server Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.12.0
*/




const TcpADU = require('../protocol/tcp_adu');
const MBapHeader = require('./mbap_header');
const PDU = require('./pdu');
const ModbusSlave = require('./modbus_slave');
const SlaveFunctions = require('./server_utils/slave_functions');

/**
 * Class representing a modbus tcp server.
 * @extends ModbusDevice
*/
class ModbusServerTcp extends ModbusSlave {
  /**
  * Create a Modbus Slave.
  */
    constructor(mb_tcp_server_cfg){
        super('tcp', mb_tcp_server_cfg);

        var self = this;    
        
        const _NumberMaxOfSeverTransaction = mb_tcp_server_cfg.NumberMaxOfSeverTransaction || 32;
        Object.defineProperty(self, 'NumberMaxOfSeverTransaction',{
            get: function(){
            return _NumberMaxOfSeverTransaction;
            }
        })

        //Transactions  Stack
        this.transactionStack = new Array(_NumberMaxOfSeverTransaction).fill(null);
        
        //states
        this.globalState = 0 //0 stopped or iddle, 1 started or wait state
        
        /**
        * interface function for network layer
        */
        this.SendResponseMessage = function(connection_id, message_frame){};
    }  

    StartServer(){
        this.globalState = 1;        
    }

    StopServer(){
        this.globalState = 0;        
    }

    ResetServer(){
        //Clearing transaction stack
        for( let i = 0; i < this.transactionStack.length; i++){
            this.transactionStack[i] = null;
        }
    }

    /**
    * this function is the interface for tcp layer to send modbus message.    
    * See Modbus Message implementation Guide v1.0b InterfaceIndicationMsg Fig 19
    * @param {object} connection_id connection id used for user app to identificate a connection on tcp management layer.
    * @param {buffer} message_frame modbus indication's frame
    * @return void
    * 
    */
    ReceiveIndicationMessage(connection_id, message_frame){
        let self = this;
        //Starting server activity
        if(this.globalState){
           let respPromise = this.CheckModbusADU(connection_id, message_frame);
           respPromise.then(function(result){            
                self.emit('transaction_resolved',result.connection, result.resp);
                self.SendResponseMessage(result.connection, result.resp.aduBuffer);
           },function(result){
               self.emit('transaction_rejected',result.connection, result.resp);
           });
        }
    }

    /**
    * this function implement the PDU checkin activity diagram Figure 16.    
    * See Modbus Message implementation Guide v1.0b
    * @param {object} connection_id connection id used for user app to identificate a connection on tcp management layer.
    * @param {buffer} message_frame modbus indication's frame
    * @fires ModbusServerTcp#transaction_acepted
    * @return {object} Adu  if success, otherwise null
    * 
    */
    CheckModbusADU(connection_id, message_frame){  

        if(message_frame.length > 7){

            let mbapHeader = new MBapHeader(message_frame.slice(0, 7));
            //parsing header           
            
            if(mbapHeader.ParseBuffer() && mbapHeader.protocolID == 0 && mbapHeader.length <= PDU.MaxLength + 1){                
               
                let mbRequestPDU = new PDU(message_frame.slice(7));
                mbRequestPDU.ParseBuffer();

                let mbRequestADU = new TcpADU()
                mbRequestADU.mbapHeader = mbapHeader;
                mbRequestADU.pdu = mbRequestPDU;

                //Instanciate Transaction Object
                let  transaction = {
                    connectionID:connection_id,
                    request: mbRequestADU                   
                }
                //response adu
                let mbResponseAdu;

                let transactionIndex = this.transactionStack.indexOf(null);
                if(transactionIndex >= 0){
                    //means that somo index in transaction stack is empty(has a null value)
                    if(this.ValidateRequestPDU(mbRequestADU.pdu)){
                        //transaction accepted
                        this.transactionStack[transactionIndex] = transaction;
                        this.emit('transaction_acepted', transaction);                                               
                        return this.ResolveTransaction(transactionIndex);
                    }
                    else{
                        //transaction rejected. exception 1
                        let resPDU = this.BuilModbusException(mbRequestPDU.modbus_function, 1);
                        mbResponseAdu = MakeResponse(mbRequestADU.mbapHeader, resPDU);                   
    
                        return  Promise.resolve({connection: connection_id, resp: mbResponseAdu});
                    }
                }
                else{
                    //transaction rejected. exception 6
                    let resPDU = this.BuilModbusException(mbRequestPDU.modbus_function, 6);
                    mbResponseAdu = MakeResponse(mbRequestADU.mbapHeader, resPDU);                   

                    return  Promise.resolve({connection: connection_id, resp: mbResponseAdu});

                }
            }
            
        }
        return  Promise.reject(connection_id, message_frame);
        
    }  

    ResolveTransaction(transaction_index){
        let self = this;
        let transaction = this.transactionStack[transaction_index];
        let reqHeader = transaction.request.mbapHeader;

        let resPDU = this.MBServiceProcessing(transaction.request.pdu);
        let mbResponseAdu = self.MakeResponse(reqHeader, resPDU);   
        self.transactionStack[transaction_index] = null;
        
        return Promise.resolve({connection: transaction.connectionID, resp: mbResponseAdu}); 
    }

   MakeResponse(req_header, resp_pdu){

        let mbResponseAdu = new TcpADU();
        mbResponseAdu.mbapHeader = new MBapHeader();
        mbResponseAdu.pdu = resp_pdu;
        mbResponseAdu.mbapHeader.unitID = req_header.unitID;
        mbResponseAdu.mbapHeader.transactionID = req_header.transactionID;
        mbResponseAdu.mbapHeader.length = resp_pdu.GetLength() + 1;
        mbResponseAdu.MakeBuffer();
        
        return mbResponseAdu
   }
   
}



module.exports = ModbusServerTcp;
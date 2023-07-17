/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
*/

const ModbusTcpMaster = require('../protocol/modbus_master_tcp');
const TcpChannel = require('./net/tcpchannel');
//const UdpClient = require('./net/udpclient');




/**
 * Class representing a modbus tcp client ready to use.
 * @extends ModbusTcpMaster
*/
class NodbusTCPClient extends  ModbusTcpMaster {
  /**
  * Create a Modbus Tcp Client.
  * @param {object} netClass. Transport layer. Can be tcp, udp4 or udp6
  */
    constructor(channelClass = TcpChannel){
        super();

        var self = this; 

        /**
        * channel's constructor
        * @type {object}
        */
        try {
            this.Channel = channelClass;
        }
        catch(e){
            this.emit('error', e);
            this.Channel = TcpChannel;
        }
        
        this.channels = new Map();
                
    }

    /**
     * Function to add a channel object to master
     * @param {string} id: channel's id. Unique por channel
     * @param {string} ip: channel's ip address. Default 'localhost'
     * @param {number} port: channel's port. Default 502
     * @param {number} timeout time in miliseconds to emit timeout for a request.
     * @returns {boolean} : true if success
     */
    addChannel(id, ip = 'localhost', port = 502, timeout = 250){
      
        let channelCfg = {
            ip : ip,
            port: port,
            tcpCoalescingDetection : true,
        };
      
        let channel = new this.Channel(channelCfg);

        /**
        * Emit connect and ready events
        * @param {object} target Socket object
        * @fires ModbusTCPClient#connect {object}
        * @fires ModbusTCPClient#ready
        */
        channel.onConnectHook = () => {
            /**
             * connection event.
             * Emited when new connecton is sablished
             * @event NodbusTcpClient#connection
             * @type {object}
             * @see https://nodejs.org/api/net.html
             */          
            this.emit('connection', id);
        };

        channel.onCloseHook = () => {
            /**
             * connection-closed event.
             * @event ModbusnetServer#connection-closed
             * @type {object}
             */
            this.emit('connection-closed', id)
        };

        channel.onDataHook = (dataFrame) => {
            /**
            * indication event.
            * @event ModbusnetServer#indication
            */
            this.emit('data', id, dataFrame);
        };

        channel.onMbAduHook = (resAdu) => {
            
            let res = {};

            res.timeStamp = Date.now();
            res.transactionId = resAdu.readUint16BE(0);
            res.unitId = resAdu[6];
            res.functionCode = resAdu[7];
            res.data = resAdu.subarray(8);

            this.processResAdu(resAdu);
            this.emit('response', id, res)
            
        }

        channel.onErrorHook = (err) =>{
            /**
             * error event.
             * @event ModbusNetServer#error
             */
            this.emit('error', id, err);
        };

        channel.onWriteHook = (reqAdu) => {           
            
            let req = {};

            req.timeStamp = Date.now();
            req.transactionId = reqAdu.readUint16BE(0);
            req.unitId = reqAdu[6];
            req.functionCode = reqAdu[7];
            req.data = reqAdu.subarray(8);
            
            this.setReqTimer(req.transactionId, timeout);   //start the timer for timeout event
            this.emit('request', id, req);

            /**
             * response event.
             * @event ModbusnetServer#response
             */
            this.emit('write', id, reqAdu);
        
        };

        channel.validateFrame = (frame)=>{
            if(frame.length > 7){

                let expectedLength = frame.readUInt16BE(4) + 6;
                let protocolId = frame.readUInt16BE(2);
                return frame.length == expectedLength & protocolId == 0;
            }
            return false;
        }

        this.channels.set(id, channel);
    }
    
    /**
    * 
    * @param {string} id 
    */
    delChannel(id){

        if(this.channels.has(id)){
          this.channels.delete(id);      
        }      
    }

    isChannelReady(id){

        if(this.channels.has(id)){
          let channel = this.channels.get(id);
          return channel.isConnected();
        }
        else return false;      
    }

   
	/**
    *Stablish connection
    */
	connect(id){

        let self = this;
        let successPromise;
        let channel = self.channels.get(id);

        if(channel == undefined){            
            return Promise.reject(channel.ip, channel.port);
        }
        else if(channel.isConnected()){  
                  
            return Promise.resolve(id);
        }
        else{            
            successPromise = channel.connect();
            return successPromise
        }
		  
    }
    
    /**
    *disconnect from server
    */
	disconnect(id){
        
        let self = this;
        let successPromise;
        let channel = self.channels.get(id)

		if(channel == undefined){            
            return Promise.resolve(id);
                    
        }
        else if(channel.isConnected()){ 
            successPromise = channel.disconnect();
            return successPromise;
        }
        else{
            return Promise.resolve(id);
            
        }
    }

    /**
     * Function to send read coils status request to a modbus server.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startCoil Starting coils at 0 address
     * @param {number} coilsCuantity 
     * @returns {Boolean} true if succses otherwise false
     */
    readCoils(channelId, unitId, startCoil, coilsCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);
            let pdu = this.readCoilStatusPdu(startCoil, coilsCuantity);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }

    }

    /**
     * Function to send read inputs status request to a modbus server.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startInput Starting inputs at 0 address
     * @param {number} inputsCuantity 
     * @returns {Boolean} true if succses otherwise false
     */
    readInputs(channelId, unitId, startInput, inputsCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);
            let pdu = this.readInputStatusPdu(startInput, inputsCuantity);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }

    /**
     * Function to send read holding registers request to a modbus server.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startRegister Starting coils at 0 address
     * @param {number} registersCuantity 
     * @returns {Boolean} true if succses otherwise false
     */
    readHoldingRegisters(channelId, unitId, startRegister, registersCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);
            let pdu = this.readHoldingRegistersPdu(startRegister, registersCuantity);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }   

    /**
     * Function to send read inputs registers request to a modbus server.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startRegister Starting register at 0 address
     * @param {number} registersCuantity 
     * @returns {Boolean} true if succses otherwise false
     */
    readInputRegisters(channelId, unitId, startRegister, registersCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);
            let pdu = this.readInputRegistersPdu(startRegister, registersCuantity);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

    /**
     * Function to send forse single coil request to a modbus server.
     * @param {boolean} value to force.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startCoil Starting coils at 0 address     
     * @returns {Boolean} true if succses otherwise false
     */
    forceSingleCoil(value, channelId, unitId, startCoil){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);
            let bufValue = this.boolToBuffer(value);
            let pdu = this.forceSingleCoilPdu(bufValue, startCoil);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

    /**
     * Function to send preset single register request to a modbus server.
     * @param {Buffer} value Two bytes length buffer.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startRegister Starting coils at 0 address     
     * @returns {Boolean} true if succses otherwise false
     */
    presetSingleRegister(value, channelId, unitId, startRegister){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);            
            let pdu = this.presetSingleRegisterPdu(value, startRegister);
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

    /**
     * Function to send force multiples coils request to a modbus server.
     * @param {Array} values a boolean array with values to force. arrays index 0 correspond to start coil. Arrays length correspond to numbers of coils to force.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startCoil Starting coils at 0 address 
     * @returns {Boolean} true if succses otherwise false
     */
    forceMultipleCoils(values, channelId, unitId, startCoil){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);    
            let bufValues =  this.boolsToBuffer(values); 
            let pdu = this.forceMultipleCoilsPdu(bufValues, startCoil, values.length);
            let reqAdu = this.makeRequest(unitId, pdu);
            
            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

    /**
     * Function to send preset multiples registers request to a modbus server.
     * @param {Buffer} values an buffer with values to force. arrays index 0 correspond to start register.     
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1-255
     * @param {number} startRegister Starting register at 0 address.
     * @returns {Boolean} true if succses otherwise false
     */
    presetMultiplesRegisters(values, channelId, unitId, startRegister){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId); 
            let pdu = this.presetMultipleRegistersPdu(values, startRegister, Math.floor(values.length/2));
            let reqAdu = this.makeRequest(unitId, pdu);
            
            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

    /**
     * Function to send preset multiples registers request to a modbus server.
     * @param {Array} values an 16 number length array with values to force. Index 0 is de less significant bit.
     * A value off 1 force to 1 the corresponding bit, 0 force to 0, other values don't change the bit value.     
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1-255
     * @param {number} startRegister Starting register at 0 address.
     * @returns true if succses otherwise false
     */
    maskHoldingRegister(values, channelId, unitId, startRegister){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);    
            let bufValues =  this.getMaskRegisterBuffer(values); 
            let pdu = this.maskHoldingRegisterPdu(bufValues, startRegister, Math.floor(values.length));
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    } 

    /**
     * Function to send preset multiples registers request to a modbus server.
     * @param {Buffer} values a buffer with values to writes. arrays index 0 correspond to start register.     
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1-255
     * @param {number} readStartingRegister Starting register at 0 address.
     * @param {number} readRegisterCuantity Number of register to read
     * @param {number} writeStartingRegister Starting register at 0 address to write.
     * @returns true if succses otherwise false
     */
    readWriteMultiplesRegisters(values, channelId, unitId, readStartingRegister, readRegisterCuantity, writeStartingRegister){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(channelId);               
            let pdu = this.readWriteMultipleRegistersPdu(values,  readStartingRegister, readRegisterCuantity, writeStartingRegister, Math.floor(values.length/2));
            let reqAdu = this.makeRequest(unitId, pdu);

            if(self.storeRequest(reqAdu)){                
                    
                return channel.write(reqAdu);                    
               
            }
            else{
                return false
            }
        }
        else{
            return false
        }
    }  

}



module.exports = NodbusTCPClient;

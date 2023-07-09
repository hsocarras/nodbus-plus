/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.8.0
*/

const ModbusTcpMaster = require('../protocol/modbus_master_tcp');
const TcpChannel = require('./net/tcpchanel.js');
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

            this.processResAdu(resAdu);
            let res = {};

            res.timeStamp = Date.now();
            res.transactionId = resAdu.readUint16BE(0);
            res.unitId = resAdu[6];
            res.functionCode = resAdu[7];
            res.data = resAdu.subarray(8);

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
            return Promise.reject(id);
        }
        else if(channel.isConnected()){
            return Promise.resolve(id);
        }
        else{
            successPromise = self.channel.connect();
            return successPromise
        }
		  
    }
    
    /**
    *disconnect from server
    */
	disconnect(id){
		  if(id){
        let slave = this.slaveList.get(id);
        if(slave.isConnected){
          return this.netClient.Disconnet(id);          
        }
        else{
          return Promise.resolve(id);
        }        
      }
      else{
        let promiseList = [];
        this.slaveList.forEach(function(slave, key){
          let promise;
          promise = this.netClient.Disconnet(id);
          promiseList.push(promise);
        })
        successPromise = Promise.all(promiseList);
        return successPromise;
      }
    }

    /**
     * Function to send read coils status request to a modbus server.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startCoil Starting coils at 0 address
     * @param {number} coilsCuantity 
     * @returns true if succses otherwise false
     */
    readCoils(channelId, unitId, startCoil, coilsCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
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
     * @returns true if succses otherwise false
     */
    readInputs(channelId, unitId, startInput, inputsCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
            let pdu = this.readInputsStatusPdu(startInput, inputsCuantity);
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
     * @returns true if succses otherwise false
     */
    readHoldingRegisters(channelId, unitId, startRegister, registersCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
            let pdu = this.readInputsStatusPdu(startRegister, registersCuantity);
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
     * @returns true if succses otherwise false
     */
    readInputsRegisters(channelId, unitId, startRegister, registersCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
            let pdu = this.readInputsStatusPdu(startRegister, registersCuantity);
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
     * @returns true if succses otherwise false
     */
    readInputsRegisters(channelId, unitId, startRegister, registersCuantity){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
            let pdu = this.readInputsStatusPdu(startRegister, registersCuantity);
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
     * @returns true if succses otherwise false
     */
    forceSingleCoil(value, channelId, unitId, startCoil){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);
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
     * @returns true if succses otherwise false
     */
    presetSingleRegister(value, channelId, unitId, startRegister){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);            
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
     * @param {Array} values a boolen array with values to force. arrays index 0 correspond to start coil. Arrays length correspond to numbers of coils to force.
     * @param {string} channelId Identifier use as key on channels dictionary.
     * @param {number} unitId Modbus address. A value between 1 -255
     * @param {number} startCoil Starting coils at 0 address 
     * @returns true if succses otherwise false
     */
    forceMultipleCoils(values, channelId, unitId, startCoil){
        let self = this;
        //check if channel is connected
        if(this.isChannelReady(channelId)){

            let channel = this.channels.get(id);    
            let bufValues =  this.boolsToBuffer(values); 
            let pdu = this.forceMultipleCoils(bufValues, startCoil, values.length);
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

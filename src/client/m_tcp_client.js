/**
** Modbus Tcp Client  module.
* @module client/modbus_tcp_client
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ModbusMaster = require('../protocol/modbus_master');
const TcpClient = require('../net/tcpclient');
const ADU = require('../protocol/tcp_adu');
const MBAP = require('../protocol/mbap');


/**
 * Class representing a modbus tcp client.
 * @extends ModbusMaster
*/
class ModbusTCPClient extends  ModbusMaster {
  /**
  * Create a Modbus Tcp Client.
  */
    constructor(){
        super();

        var self = this;

        var transactionCountValue = 1;

        /**
        * tcp layer
        * @type {object}
        */
        this.netClient = new TcpClient();

        //asociando el evento data del netClient con la funcion ProcessResponse
        this.netClient.onData = this.ProcessResponse.bind(this);

        /**
        * Emit connect and ready events
        * @param {object} target Socket object
        * @fires ModbusTCPClient#connect {object}
        * @fires ModbusTCPClient#ready
        */
        this.netClient.onConnect = function EmitConnect (target){
            this.isConnected = true;

            /**
           * connect event.
           * @event ModbusTCPClient#connect
           * @type {object}
           */
            this.emit('connect',target);

            /**
           * ready event.
           * @event ModbusTCPClient#ready
           */
            this.emit('ready');
        }.bind(this);


        /**
        *Emit disconnect event
        * @param {object} had_error
        * @fires ModbusTCPClient#disconnect {object}
        */
        function EmitDisconnect(had_error){
            this.isConnected = false;

            /**
           * disconnect event.
           * @event ModbusTCPClient#disconnect
           */
            this.emit('disconnect', had_error);
        }
        this.netClient.onClose = EmitDisconnect.bind(this);

        /**
        *Emit error event
        * @param {object} error
        * @fires ModbusTCPClient#error {object}
        */
        function EmitError (err){

          /**
         * error event.
         * @event ModbusTCPClient#error
         * @type {object}
         */
            this.emit('error',err);
        }
        this.netClient.onError = EmitError.bind(this);

        /**
        * Emit timeout event        *
        * @fires ModbusTCPClient#timeout
        */
        function EmitTimeOut (){

          this.currentModbusRequest = null
          /**
         * timeout event.
         * @event ModbusTCPClient#timeout
         */
          this.emit('timeout');
        }
        this.netClient.onTimeOut = EmitTimeOut.bind(this);

        function EmitIndication(data){
          this.emit('indication', data);
        }
        this.netClient.onWrite = EmitIndication.bind(this);

        /**
        * Slave modbus Device {ip, port, remoteAddress, timeout}
        * @type {object}
        */
        Object.defineProperty(self,'slaveDevice',{
            set: function(slave){
                self.netClient.SlaveDevice = slave;

            },
            get: function(){
                return self.netClient.SlaveDevice;
            }
        });

        /**
        * number of transaction
        * @type {number}
        */
        Object.defineProperty(self, 'transactionCounter', {
            get: function(){
                return transactionCountValue;
            },
            set: function(value){
                if(value <= 0xFFF0){
                    transactionCountValue = value;
                }
                else{
                    transactionCountValue = 1;
                }
            },
            enumerable: false,
            configurable: false
        } )

        Object.defineProperty(self.__proto__, 'CreateMBAP',{
            enumerable:false,
            writable:false,
            configurable:false
        })
    }


    /**
    * function that make the header for modbus indication
    * @param {object} pdu Indication PDU object
    * @return {object} mbap header
    */
    CreateMBAP(pdu){

        pdu.MakeBuffer();
        var mbap = new MBAP();
        this.transactionCounter++;
        mbap.transactionID = this.transactionCounter;
        mbap.protocolID = 0;
        mbap.length = pdu.pduBuffer.length+1;
        mbap.unitID = this.slaveDevice.remoteAddress;

        return mbap;
    }

    /**
    * function 01 of modbus protocol
    * @param {number} startcoil first coil to read, start at 0 coil
    * @param {number} coilQuantity number of coils to read
    */
    ReadCoilStatus(startCoil, coilQuantity = 1){
       if(this.isConnected && this.currentModbusRequest == null ){
            //si estoy conectado y no hay query activa
            var pdu = this.CreatePDU(1, startCoil, coilQuantity);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;

            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    };

    /**
    * function 02 of modbus protocol
    * @param {number} startInput first Input to read, start at 0 coil
    * @param {number} InputQuantity number of Inputs to read
    */
    ReadInputStatus(startInput, inputQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(2, startInput, inputQuantity);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;

            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    }

    /**
    * function 03 of modbus protocol
    * @param {number} startRegister first holding register to read, start at 0 coil
    * @param {number} registerQuantity number of holding register to read
    */
    ReadHoldingRegisters(startRegister, registerQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(3, startRegister, registerQuantity);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;

            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    }

    /**
    * function 04 of modbus protocol
    * @param {number} startRegister first input register to read, start at 0 coil
    * @param {number} registerQuantity number of input register to read
    */
    ReadInputRegisters(startRegister, registerQuantity = 1){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(4, startRegister, registerQuantity);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;

            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    }

    /**
    * function 05 of modbus protocol
    * @param {number} startcoil first coil to write, start at 0 coil
    * @param {bool} value value to force
    */
    ForceSingleCoil(value, startCoil = 0){
      let bufferValue = Buffer.alloc(2);
      if(value){
        bufferValue[0] = 0xFF;
      }
        if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(5, startCoil, 1, bufferValue);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;
            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    }

    /**
    * function 06 of modbus protocol
    * @param {number} startRegister register to write.
    * @param {number} value value to force
    */
    PresetSingleRegister(value, startRegister = 0){
      let val = Buffer.alloc(2)
      if(value >= 0){
        val.writeUInt16BE(value);
      }
      else{
        val.writeInt16BE(value);
      }
      if(this.isConnected && this.currentModbusRequest == null){
          //si estoy conectado
          var pdu = this.CreatePDU(6, startRegister, 1, val);
          var mbap = this.CreateMBAP(pdu);
          var adu = new ADU();
          adu.pdu = pdu;
          adu.mbap = mbap;
          adu.MakeBuffer();
          this.currentModbusRequest = adu;

          this.netClient.Write(adu.aduBuffer);
      }
      else{
          return;
      }
    }

    /**
    * function 15 of modbus protocol
    * @param {bool[]} forceData array of values to write.
    * @param {number} startCoil first coil to write, start at 0 coil.
    */
    ForceMultipleCoils(forceData, startCoil = 0){

      let coilQuantity = forceData.length;
      let valueBuffer = Buffer.alloc(Math.floor((coilQuantity - 1)/8)+1);
      let byteTemp = 0x00;
      let offset = 0;
      let masks = [0x01, 0x02, 0x04, 0x08, 0x010, 0x20, 0x40, 0x80];

      for(let i =0; i < coilQuantity; i++){
        if(forceData[i] == true){
          valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] | masks[i%8];
        }
        else {
          valueBuffer[Math.floor(i/8)] = valueBuffer[Math.floor(i/8)] & (~masks[i%8]);
        }
      }

         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(15, startCoil, coilQuantity, valueBuffer);
            var mbap = this.CreateMBAP(pdu);
            var adu = new ADU();
            adu.pdu = pdu;
            adu.mbap = mbap;
            adu.MakeBuffer();
            this.currentModbusRequest = adu;

            this.netClient.Write(adu.aduBuffer);
        }
        else{
            return;
        }
    }

    /**
    * function 16 of modbus protocol
    * @param {number[]} forceData array whit the values to write
    * @param {number} startRegister register to write.
    */
    PresetMultipleRegisters(forceData, startRegister = 0){
      let valueBuffer = Buffer.alloc(0);


      forceData.forEach(function(value){
        let tempBufer = null;
        if(Number.isInteger(value)){
          if(value >= 0 && value <= 65535){
            tempBufer = Buffer.alloc(2);
            tempBufer.writeUInt16BE(value);
            valueBuffer = Buffer.concat([valueBuffer, tempBufer], valueBuffer.length + 2)
          }
          else if (value < 0 && value > -32767) {
            tempBufer = Buffer.alloc(2);
            tempBufer.writeInt16BE(value);
            valueBuffer = Buffer.concat([valueBuffer, tempBufer], valueBuffer.length + 2)
          }
          else{
            tempBufer = Buffer.alloc(4);
            tempBufer.writeInt32LE(value);
            valueBuffer = Buffer.concat([valueBuffer, tempBufer.swap16()], valueBuffer.length + 4)
          }
        }
        else{
          tempBufer = Buffer.alloc(4);
          tempBufer.writeFloatLE(value);
          valueBuffer = Buffer.concat([valueBuffer, tempBufer.swap16()], valueBuffer.length + 4);
        }

      })

      let registerQuantity = valueBuffer.length/2;

       if(this.isConnected && this.currentModbusReques == null){
          //si estoy conectado
          var pdu = this.CreatePDU(16, startRegister, registerQuantity, valueBuffer);
          var mbap = this.CreateMBAP(pdu);
          var adu = new ADU();
          adu.pdu = pdu;
          adu.mbap = mbap;
          adu.MakeBuffer();
          this.currentModbusRequest = adu;

          this.netClient.Write(adu.aduBuffer);
      }
      else{
          return;
      }
    }

    /**
    * function to pasrse server response
    * @param {Buffer} aduBuffer frame of response
    * @return {object} map Object whit register:value pairs
    * @fires ModbusTCPClient#modbus_exception {object}
    * @fires ModbusTCPClient#error {object}
    */
    ParseResponse(aduBuffer) {

      let resp = new ADU(aduBuffer);
      try{
        resp.ParseBuffer();
        //chekeo el transactionID
        if(resp.mbap.transactionID != this.transactionCounter){
          this.emit('modbus_exception', "Wrong Transaction ID");
            return;
        }
        else if((aduBuffer.length - 6) != resp.mbap.length) {
            this.emit('modbus_exception', "Header ByteCount Mismatch");
            return ;
        }
        else {
            return this.ParseResponsePDU(resp.pdu);
        }
      }
      catch(err){
        this.emit('error', err);
      }

    }



	  /**
    *Stablish connection to server
    */
	  Start(){
		  this.netClient.Connect();
	  }
    /**
    *disconnect from server
    */
	  Stop(){
		  this.netClient.Disconnet();
	  }
}

module.exports = ModbusTCPClient;

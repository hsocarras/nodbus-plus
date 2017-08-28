/**
*@author Hector E. Socarras Cabrera
*@brief
*Clase de un cliente de modbus tcp.
*
*/

const ModbusClient = require('../protocol/modbus_client');
const TcpClient = require('../net/tcpclient');
const ADU = require('../protocol/tcp_adu');
const MBAP = require('../protocol/mbap');
const WriteDigitalValue = require('../protocol/functions/tools').WriteDigitalValue;


module.exports = class ModbusTCPClient extends  ModbusClient {

    constructor(){
        super();

        var self = this;

        var transactionCountValue = 1;

        // Capa de manejo de red
        this.netClient = new TcpClient();

        //asociando el evento data del netClient con la funcion ProcessResponse
        this.netClient.onData = this.ProcessResponse.bind(this);

        //Emitir el evento connect
        function EmitConnect (target){
            /*
            *@param {object} target es un socket object en caso de tcp o un serialport object en caso serial
            */
            this.isConnected = true;
            this.emit('connect',target);
            this.emit('ready');
        }
        this.netClient.onConnect = EmitConnect.bind(this);

        //Se emite el evento disconnected
        function EmitDisconnect(had_error){
            this.isConnected = false;
            this.emit('disconnect', had_error);
        }
        this.netClient.onClose = EmitDisconnect.bind(this);

        //Se emite el evento network error
        function EmitTcpError (err){
            this.emit('error',err);
        }
        this.netClient.onError = EmitTcpError.bind(this);

        //Se emite el evento Timeout
        function EmitTimeOut (){
          //elimino la query activa
          this.currentModbusRequest = null
          this.emit('timeout');
        }
        this.netClient.onTimeOut = EmitTimeOut.bind(this);

        Object.defineProperty(modbusTcpClient,'slaveDevice',{
            set: function(slave){
                modbusTcpClient.netClient.slaveDevice.port = slave.port;
                modbusTcpClient.netClient.slaveDevice.ip = slave.ip;
                modbusTcpClient.netClient.slaveDevice.remoteAddress = slave.remoteAddress;
                modbusTcpClient.netClient.slaveDevice.timeout = slave.timeout;
            },
            get: function(){
                return modbusTcpClient.netClient.slaveDevice;
            }
        });

        Object.defineProperty(modbusTcpClient, 'transactionCounter', {
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

        Object.defineProperty(modbusTcpClient.__proto__, 'CreateMBAP',{
            enumerable:false,
            writable:false,
            configurable:false
        })
    }

    Connect(){
        this.netClient.Connect();
    }

    Disconnect(){
        this.netClient.Disconnet();
    }

    CreateMBAP(pdu){

        pdu.MakeBuffer();
        var mbap = new MBAP();
        this.transactionCounter++;
        mbap.transactionID = this.transactionCounter;
        mbap.protocolID = 0;
        mbap.length = pdu.pduBuffer.length+1;
        mbap.unitID = this.slaveDevice.remoteAddres;

        return mbap;
    }

    ReadCoilStatus(startCoil, coilQuantity){
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

    ReadInputStatus(startInput, inputQuantity){
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

    ReadHoldingRegisters(startRegister, registerQuantity){
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

    ReadInputRegisters(startRegister, registerQuantity){
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

    ForceSingleCoil(startCoil, value){
      /*
      *@param startCoil {integer}
      *@param value {bool}
      */
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

    PresetSingleRegister(startRegister, value){
         if(this.isConnected && this.currentModbusRequest == null){
            //si estoy conectado
            var pdu = this.CreatePDU(6, startRegister, 1, value);
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

    ForceMultipleCoils(startCoil, coilQuantity, forceData){
      /*
      *@param startCoil {integer}
      *@param coilQuantity {integer}
      *@param forceData {Array bool} empesando por la coil inicial
      *ejem Array[0]-startCoil, array[1] - startCoil+1 etc
      */
      let valueBuffer = Buffer.alloc(Math.floor((coilQuantity+1)/8)+1);
      let byteTemp = 0x00;
      let byteIndex = 0;
      let offset = 0;

      for(let i =0; i < coilQuantity; i++){
        byteIndex = Math.floor(i/8);
        offset = i%8;
        if(offset == 0){
          byteTemp = 0x00;
        }
        byteTemp = WriteDigitalValue(byteTemp, offset, forceData[i]);
        valueBuffer[byteIndex] = byteTemp;
      }
      console.log(valueBuffer)
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

    PresetMultipleRegisters(startRegister, registerQuantity, data){
         if(this.isConnected && this.currentModbusReques == null){
            //si estoy conectado
            var pdu = this.CreatePDU(16, startRegister, registerQuantity, data);
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

    //Parsing Response Function
    ParseResponse(aduBuffer) {

        if(aduBuffer.length > 7){

                //extrayendo el MBAP
                var respMBAP = new MBAP(aduBuffer.slice(0,7));
                respMBAP.ParseBuffer();

                //chekeo el transactionID
                if(respMBAP.transactionID != this.transactionCounter){
                  this.emit('modbus_exception', "Wrong Transaction ID");
                    return null;
                }
                //chekeo el byte count
                else if((aduBuffer.length - 6) != respMBAP.length) {
                    this.emit('modbus_exception', "Header ByteCount Mismatch");
                    return null;
                }
                else {
                    return this.ParseResponsePDU(aduBuffer.slice(7));
                }
            }
            else{
                //error
                his.emit('modbus_exception', "Wrong Adu");
                return null;
            }
    }

    //funcion poll
    Poll(query){
      /*
      *@brief funcion que genera un modbus indication a partir de un objeto queryObject
      *@param queryObject objeto {}
      *
      */

      switch (query.ModbusFunction) {
        case 1:
          this.ReadCoilStatus(query.startItem, query.numberItems);
          break;
        case 2:
          this.ReadInputStatus(query.startItem, query.numberItems);
          break;
        case 3:
          this.ReadHoldingRegisters(query.startItem, query.numberItems);
          break;
        case 4:
          this.ReadInputRegisters(query.startItem, query.numberItems);
          break;
        case 5:
          this.ForceSingleCoil(query.startItem, query.itemsValues);
          break;
        case 6:
          this.PresetSingleRegister(query.startItem, query.itemsValues);
          break;
        case 15:
          this.ForceMultipleCoils(query.startItem, query.numberItems, query.itemsValues);
          break;
        case 16:
          this.PresetMultipleRegisters(query.startItem, query.numberItems, query.itemsValues);
          break;
        default:
          this.emit('modbus-exception' , 'Bad query');
          break;

      }
    }

	//compatibilidad con el reco
	  Start(){
		  this.Connect();
	  }

	  Stop(){
		  this.Disconnect();
	  }
}

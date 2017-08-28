/**
*@author Hector E. Socarras Cabrera
*@date 8/5/2015
*@brief
*Clase base de un servidor de modbus.
*
*De esta clase heredan el serial_server y el tcp_server.
*Implementa el procesamiento del PDU
*
*/


var ModbusDevice = require('./modbus-device');
var PDU = require('./pdu');

class ModbusServer extends ModbusDevice {
    constructor(){
        super();

        var self = this;

        //Funciones Soportadas
        this.supportedModbusFunctions = [0x01,0x02,0x03,0x04,0x05,0x06,0x0F,0x10];

        //Sellando esta propiedad
        Object.defineProperty(self, 'supportedModbusFunctions',{
          enumerable:true,
          writable:false,
          configurable:false
        });


        //registros bools en el primer byte se encuentran 0-7 en el segundo 8-14 etc;
        //denttro del mismo byte el bit menos significatico es 0 y el mas significativo es el 7
        this.inputs =  Buffer.alloc(128);
        this.coils = Buffer.alloc(128);

        //registros de word el MSB el el primero por ejemplo el registro 0 tiene
        //el MSB en el Byte 0 y el LSB en el byte 1 para cumplir la especificacion de modbus de enviar
        //primero el MSB de cada registro.
        this.holdingRegisters =  new Buffer.alloc(2048);
        this.inputRegisters = new Buffer.alloc(2048);

    }

    Start(){

    }

    Stop(){

    }

    BuildResponse(pdu) {
      /**
      *@brief
      *Genera la repuesta a una peticion del cliente
      *@param PDU protocol data unit parte de la trama q contiene solo funcion y data
      *en formato RTU
      */
        var respPDU;

        //Analizando la PDU
        respPDU = this.AnalizePDU(pdu);

        if(respPDU == pdu){
            //PDU Valida

            switch( pdu.modbus_function ){
                case 0x01:
                    respPDU = this.ReadCoilStatus(pdu);
                break;
                case 0x02:
                    respPDU = this.ReadInputStatus(pdu);
                break;
                case 0x03:
                    respPDU = this.ReadHoldingRegisters(pdu);
                break;
                case 0x04:
                    respPDU = this.ReadInputRegisters(pdu);
                break;
                case 0x05:
                    respPDU = this.ForceSingleCoil(pdu);
                break;
                case 0x06:
                    respPDU = this.PresetSingleRegister(pdu);
                break;
                case 0x0F:
                    respPDU = this.ForceMultipleCoils(pdu);
                break;
                case 0x10:
                    respPDU = this.PresetMultipleRegisters(pdu);
                break;
            }

            respPDU.MakeBuffer();
            return respPDU;
        }
        else{
            //PDU exception response
            return respPDU;
        }

    }

    AnalizePDU(pdu){
        /**
        *@param Object PDU protocol data unit parte de la trama q contiene solo funcion y data
        *en formato RTU
        *
        *@brief
        *Analiza q la PDU sea correcta, devuelve la PDU original si es valida
        *O una PDU de la respuesta de exception.
        */

        var tempPDU = new PDU();
        /*tempPDU.modbus_function = pdu.modbus_function;
        pdu.modbus_data.copy(tempPDU.modbus_data)*/

        //Verificamos q la funcion modbus sea soportada
        if(this.supportedModbusFunctions.indexOf(pdu.modbus_function) == -1){
            //Construyendo una exception de funcion no soportada
            tempPDU.modbus_function = pdu.modbus_function | 0x80;
            tempPDU.modbus_data[0] = 0x01;

            this.emit('modbus_exeption',"Illegal Function");

            return tempPDU;
        }
        else {
            //Verificamos el campo de datos tenga la longitud exacta correspondiente a la funcion modbus.
            //Implementar mas adelante
            //el chequeo del error 02 y 03 se hacen en las modbus function

            //si es una PDU valida retorno la original
            return pdu;
        }

    }

}

ModbusServer.prototype.ReadCoilStatus = require('./functions/Read_Coil_Status');
ModbusServer.prototype.ReadInputStatus = require('./functions/Read_Input_Status');
ModbusServer.prototype.ReadHoldingRegisters = require('./functions/Read_Holding_Registers');
ModbusServer.prototype.ReadInputRegisters = require('./functions/Read_Input_Registers');
ModbusServer.prototype.ForceSingleCoil = require('./functions/Force_Single_Coil');
ModbusServer.prototype.PresetSingleRegister = require('./functions/Preset_Single_Register');
ModbusServer.prototype.ForceMultipleCoils = require('./functions/Force_Multiple_Coils');
ModbusServer.prototype.PresetMultipleRegisters = require('./functions/Preset_Multiple_Registers');


module.exports = ModbusServer

/**
** Modbus Master Base Class module.
* @module protocol/modbus-master
* @author Hector E. Socarras.
* @version 0.8.0
*/


const ModbusDevice = require('../protocol/modbus_device');


/**
 * Class representing a modbus master.
 * @extends ModbusDevice
*/
class ModbusMaster extends ModbusDevice {
  /**
  * Create a Modbus Master.
  */
    constructor(){
        super();
        var self = this;
        
        /**
        * map with slave's 
        * @type {Map}
        */
        this.slaveList = new Map();
        
    }

    _EmitTimeout(id, req){

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

    _EmitConnect(id){
      let slave = this.slaveList.get(id);
      slave.isConnected = true;

        /**
       * connect event.
       * @event ModbusTCPClient#connect
       * @type {object}
       */
        this.emit('connect',id);       
    }

   
    /**
     * 
     * @param {string} id 
     */
    RemoveSlave(id){
      if(this.slaveList.has(id)){
        this.slaveList.delete(id);      
      }      
    }

    isSlaveReady(id){
      if(this.slaveList.has(id)){
        let slave = this.slaveList.get(id);
        return slave.isConnected;
      }
      else return false;      
    }

    /**
    * Build a request PDU
    * @param {number} modbusFunction modbus function
    * @param {startAddres} startAddres starting at 0 address
    * @param {pointsQuantity} pointsQuantity
    * @param {number|Buffer} values values to write
    * @return {Object} PDU object
    */
    CreateRequestPDU(modbusFunction = 3, startAddres = 0, pointsQuantity = 1, values) {
        
        var self = this;

        //chequeando el argumento values
        if(typeof(values) == 'number'){

            let valueBuffer = Buffer.alloc(2);
            valueBuffer.writeUInt16BE(values);

            values = valueBuffer;
        }

        //creando la pdu del request
        var request = self.CreatePDU();

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
              request.modbus_function = 0x05;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              if (values.readUInt16BE(0) == 0xFF00 || values.readUInt16BE(0) == 0x00 ) {
                values.copy(request.modbus_data,2);
              }
              else {
                  this.emit('modbus_exception',id, 'Illegal value on query');
              }
              request.MakeBuffer();
              return request;
              break;
          case 6:
              //creando la pdu del request
              var request = this.CreatePDU();
              //funcion 06 PresetSingleRegister
              request.modbus_function = 0x06;
              request.modbus_data = Buffer.alloc(4);
              request.modbus_data.writeUInt16BE(startAddres,0);
              values.copy(request.modbus_data,2);
              request.MakeBuffer();
              return request;
              break;
          case 15:
              //function 15 force multiples coils
              request.modbus_function = 0x0F;
              //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
              request.modbus_data = Buffer.alloc(5 + values.length);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.modbus_data[4]= values.length;
              values.copy(request.modbus_data,5);
              request.MakeBuffer();
              return request;
              break;
          case 16:
              //function 16 write multiples coils
              request.modbus_function = 0x10;
              //el tamaño del buffer de datos se calcula a partir de la cantidad de coils a escribir
              request.modbus_data = Buffer.alloc(5 + pointsQuantity*2);
              request.modbus_data.writeUInt16BE(startAddres,0);
              request.modbus_data.writeUInt16BE(pointsQuantity,2);
              request.modbus_data[4]= values.length;
              values.copy(request.modbus_data,5);
              request.MakeBuffer();
              return request;
              break;
          case 22:
              //function 22 mask holding register
              request.modbus_function = 0x16;              
              request.modbus_data = Buffer.alloc(6);
              request.modbus_data.writeUInt16BE(startAddres,0);              
              values.copy(request.modbus_data,2);              
              request.MakeBuffer();
              return request;
              break;
        }
    }

    CreateRequest(id, pdu){
      //function to be redefined in tcp or serial client
      return pdu
    }

    //function to redefine on childs class
    ParseResponse(slave, respAdu){ }

    

    /**
    * extract data for a slave response
    * @param {string} id reference of device.
    * @param {Buffer} rawResp
    * @fires ModbusMaster#raw_data {buffer} response frame
    * @fires ModbusMaster#data {object} map object whit pair register:values
    * @fires ModbusMaster#error {object}
    */
    ProcessResponse(id, rawResp){

      let slavesIDs = this.connTable.get(id)
      let slave = null;
      var self = this;
      
      /**
     * raw_data event.
     * @event ModbusMaster#raw_data
     * @type {object}
     */
      this.emit('raw_data',id, rawResp);
      var respStack = [];
      
      // a tcp modus protocol can receive several modbus response in the same tcp package      
      respStack = self._GetResponseStack(rawResp);
      
      
      respStack.forEach(function(element, index, array){
        
          try{
            
            var resp = self.ParseResponse(element);
            
            if(slavesIDs.length == 1){
              slave = self.slaveList.get(slavesIDs[0]);
            }
            else{
              let respModbusAddress = resp.adu.adrress;
              slavesIDs.forEach(function(id){                
                if(respModbusAddress == self.slaveList.get(id).address){
                  slave = self.slaveList.get(id);
                }
              })

            }
            
            
            if(resp != null & slave != null){ 
              
              var req = slave.SearchRequest(resp.id);             
              resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
              resp.connectionID = slave.id
              resp.timestamp = Date.now();                       
              req.StopTimer();

              //in exception case
              if(resp.data.has('exception')){
                
                switch(resp.data.get('exception')){
                  case 1:
                    this.emit('modbus_exception', resp.connectionID, 'Illegal Function');  
                    break;
                  case 2:
                      this.emit('modbus_exception', resp.connectionID, 'Illegal Data Address');
                      break;
                  case 3:
                      this.emit('modbus_exception', resp.connectionID, 'Illegal Data Value');
                      break;
                  case 4:
                      this.emit('modbus_exception', resp.connectionID, 'Slave Device Failure');
                      break;
                  case 5:
                      this.emit('modbus_exception', resp.connectionID, 'ACKNOWLEDGE');
                      break;
                  case 6:
                      this.emit('modbus_exception', resp.connectionID, 'SLAVE DEVICE BUSY');
                      break;
                  case 7:
                      this.emit('modbus_exception', resp.connectionID, 'NEGATIVE ACKNOWLEDGE');
                      break;
                  case 8:
                      this.emit('modbus_exception', resp.connectionID, 'MEMORY PARITY ERROR');
                      break;
                }
                if(resp.data.get('exception') == 5){
                  //Error code 5 send a retry attemp after 1 second
                  if(req._retriesNumber < slave.maxRetries){            
                    setTimeout(function(){
                      self.netClient.Write(slave.id, req);
                      req._retriesNumber++;
                    }, 1000)
                  }
                  else{
                    //discart request
                    self.emit('response', resp);
                    //elimino la query activa.
                    slave.RemoveRequest(req);
                  }
                }
                else{
                  //discart request
                  self.emit('response', resp);
                  //elimino la query activa.
                  slave.RemoveRequest(req);
                }  
              }
              else{
                
                /**
                * data event.
                * @event ModbusMaster#data
                * @type {object}
                */
                self.emit('data',id, resp.data);

                /**
                * response event.
                * @event ModbusMaster#data
                * @type {object}
                */
                self.emit('response',slave.id, resp);
    
                //elimino la query activa.
                self._currentRequest = null; 
                slave.RemoveRequest(req);    
                                               
              }
            }  
          }
          catch (err){                   
            self.emit('error',id, err);
          }
        
      })  
    }

    /**
    * Make a modbus indication from query object.
    *@param {string} id
    *@param {Object} query    
    *@fires ModbusTCPClient#modbus_exception
    */
    Poll(id, query){
      /*
      let ModbusFunction = 3;

      switch(area){
        case 'holding-registers':
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 'holding':
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 4:
          if(itemsValues == null){
              ModbusFunction = 3;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 6;
            }
            else{
              ModbusFunction = 16;
            }
          }
          break;
        case 'inputs-registers':
            ModbusFunction = 3;
          break;
        case 3:
            ModbusFunction = 3;
          break;
        case 'inputs':
          ModbusFunction = 2;
          break;
        case 1:
          ModbusFunction = 2;
          break;
        case 'coils':
          if(itemsValues == null){
              ModbusFunction = 1;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 5;
            }
            else{
              ModbusFunction = 15;
            }
          }
          break;
        case 0:
          if(itemsValues == null){
              ModbusFunction = 1;
          }
          else{
            if(numberItems == 1){
              ModbusFunction = 5;
            }
            else{
              ModbusFunction = 15;
            }
          }
          break;
      }

      switch (ModbusFunction) {
        case 1:
          this.ReadCoilStatus(id, startItem, numberItems);
          break;
        case 2:
          this.ReadInputStatus(id, startItem, numberItems);
          break;
        case 3:
          this.ReadHoldingRegisters(id, startItem, numberItems);
          break;
        case 4:
          this.ReadInputRegisters(id, startItem, numberItems);
          break;
        case 5:
          this.ForceSingleCoil(itemsValues, address, tartItem);
          break;
        case 6:
          this.PresetSingleRegister(itemsValues, address, tartItem);
          break;
        case 15:
          this.ForceMultipleCoils(itemsValues, address, startItem);
          break;
        case 16:
          this.PresetMultipleRegisters(itemsValues, address, startItem);
          break;
        default:
          return false;
          break;

      }
      */
    }

    
}

module.exports = ModbusMaster;



/**
 * extract data for a slave response
 * @param {string} id reference of device.
 * @param {Buffer} respADU
 * @fires ModbusMaster#raw_data {buffer} response frame
 * @fires ModbusMaster#data {object} map object whit pair register:values
 * @fires ModbusMaster#error {object}
 */
module.exports.ProcessResponse = function ProcessResponse(id, respADU){

    let slave = this.slaveList.get(id);
    var self = this;
    
    /**
     * raw_data event.
     * @event ModbusMaster#raw_data
     * @type {object}
     */
    this.emit('raw_data',id, respADU);
    var respStack = [];
    if(slave.transmisionMode == 'tcp'){
      var respStack = self.SplitTCPFrame(respADU)
    }
    else{
      respStack[0]= respADU;
    }      
    
    respStack.forEach(function(element, index, array){
            
      if(slave.requestStack.size > 0){                 
                   
          var resp = self.ParseResponse(slave, element); 
          
          if(slave.type == 'tcp'){
            var req = slave.SearchRequest(resp.id);
          }
          else{
            req = slave.SearchRequest(self.reqCounter-1);
          }
          
          
          if(resp){           
            
              req.StopTimer();
              resp.data = self.ParseResponsePDU(resp.adu.pdu, req.adu.pdu);
              resp.timestamp = Date.now();            

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
                self.emit('response', resp);
    
                //elimino la query activa.
                self._currentRequest = null; 
                slave.RemoveRequest(req);    
                                              
              }
          }  
        }
        
      
    })  
}
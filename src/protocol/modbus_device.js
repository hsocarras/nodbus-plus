/**
** Modbus device module.
* @module protocol/modbus-device
* @author Hector E. Socarras.
* @version 0.4.0
*/

const EventEmitter = require('events');
const PDU = require('./pdu');

/**
 * Class representing a modbus device.
 * @extends EventEmitter
*/
class ModbusDevice extends EventEmitter {
	/**
  * Create a Modbus Device.
  */
	constructor(){
      super();
      var self = this;
      
      /**
      * number of valid request sended for a master or received for a slave
      * @type {number}
      */ 
      this.reqCountValue = 0;
      
      /**
      * counter of response sended for a slave or received for a master
      * @type {number}
      */
      this.resCountValue = 0;
    }

    get reqCounter(){
      return this.reqCountValue;
    }

    set reqCounter(value){
      if(value = this.reqCountValue + 1){
        this.reqCountValue = value;
      }
    }

    get resCounter(){
      return this.resCountValue;
    }
    
    set resCounter(value){
      if(value = this.resCountValue + 1){
        this.resCountValue = value;
      }
    }

  /**
   * Function to create a new protocol data unit
   * @return {object} PDU
   */
  CreatePDU() {
    return new PDU();
  }  

  /**
    * extract data for a slave response.
    * @param {object} responsePDU PDU received
    * @param {object} reqPDU  PDU sended
    * @return {Object} map Object whit register:value pairs
    * @fires ModbusMaster#modbus_exception {object}
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
   * Split the input buffer in several indication buffer baset on length property
   * of modbus tcp header. The goal of this funcion is suport several modbus indication
   * on same tcp frame
   * @param {Buffer Object} dataFrame 
   * @return {Buffer array}
   */
  SplitTCPFrame(dataFrame){
    //get de first tcp header length
    let indicationsList = [];
    let expectedlength = dataFrame.readUInt16BE(4);
    let indication = Buffer.alloc(expectedlength + 6);

    if(dataFrame.length <= expectedlength + 6){
      dataFrame.copy(indication,  0, 0, expectedlength + 6);
      indicationsList.push(indication);
      return indicationsList;
    }
    else{
      dataFrame.copy(indication,  0, 0, expectedlength + 6);
      indicationsList.push(indication);
      let otherIndication = dataFrame.slice(expectedlength + 6);
      let other = this.SplitTCPFrame(otherIndication);
      indicationsList = indicationsList.concat(other)
      return indicationsList;
    }      
  }

}

module.exports = ModbusDevice;

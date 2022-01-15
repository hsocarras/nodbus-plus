/**
** Modbus device module.
* @module protocol/modbus-device
* @author Hector E. Socarras.
* @version 0.12.0
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



var PDU = require('../../pdu');

/**
* Build a modbus exception response PDU with local processing
* @param {number} modbus_function modbus function code
* @param {number} exception_code code of modbus exception
* @fires  ModbusSlave#mb_exception
* @return {Object} PDU protocol data unit
*/
var MakeModbusException = function (modbus_function, exception_code) {

    var excPDU = new PDU();

    //setting modbus function to exception
    excPDU.modbus_function = modbus_function | 0x80;
    //setting exeption code
    excPDU.modbus_data[0] = exception_code;
    
    
        switch(exception_code){
            case 1:            
                this.emit('mb_exception', modbus_function, 'ILLEGAL FUNCTION');  
            break;
            case 2:
                this.emit('mb_exception', modbus_function, 'ILLEGAL DATA ADDRESS');
                break;
            case 3:
                this.emit('mb_exception', modbus_function, 'ILLEGAL DATA VALUE');
                break;
            case 4:
                this.emit('mb_exception', modbus_function, 'SLAVE DEVICE FAILURE');
                break;
            case 5:
                this.emit('mb_exception', modbus_function, 'ACKNOWLEDGE');
                break;
            case 6:
                this.emit('mb_exception', modbus_function, 'SLAVE DEVICE BUSY');
                break;            
            case 8:
                this.emit('mb_exception', modbus_function, 'MEMORY PARITY ERROR');
                break;
            case 0x0A:
                this.emit('mb_exception', modbus_function, 'GATEWAY PATH UNAVAILABLE');
                break;
            case 0x0B:
                this.emit('mb_exception', modbus_function, 'GATEWAY TARGET DEVICE FAILED TO RESPOND');
                break;
        }
    
   
    return excPDU;

}

module.exports = MakeModbusException;



var PDU = require('../pdu');


var MakeModbusException = function (modbus_function, exception_code) {

    var excPDU = new PDU();

    //setting modbus function to exception
    excPDU.modbus_function = modbus_function | 0x80;
    //setting exeption code
    excPDU.modbus_data[0] = exception_code;
    
    switch(exception_code){
        case 1:            
            this.emit('modbus_exception', 'ILLEGAL FUNCTION');  
          break;
        case 2:
            this.emit('modbus_exception','ILLEGAL DATA ADDRESS');
            break;
        case 3:
            this.emit('modbus_exception', 'ILLEGAL DATA VALUE');
            break;
        case 4:
            this.emit('modbus_exception', 'SLAVE DEVICE FAILURE');
            break;
        case 5:
            this.emit('modbus_exception', 'ACKNOWLEDGE');
            break;
        case 6:
            this.emit('modbus_exception', 'SLAVE DEVICE BUSY');
            break;
        case 7:
            this.emit('modbus_exception', 'NEGATIVE ACKNOWLEDGE');
            break;
        case 8:
            this.emit('modbus_exception', 'MEMORY PARITY ERROR');
            break;
      }

    return excPDU;

}

module.exports = MakeModbusException;



/**
 * Class representing a transaction See TCP message implementation.
*/
class Transaction {
    /**
  * Create a bolean register.
  * @param {number} primary_table 1 for coils 2 for inpusts.
  * @param {number} size total amount of references (inputs or coils).
  */
  constructor(){

    /**
    *Implementation of modbus register
    *@type {Buffer}
    */
    let buffer_size = 1;
    if(size < MAX_ITEM_NUMBER){
      (size % 8) ? buffer_size = Math.ceil(size/8) : buffer_size = size/8;
      this.size = size;
    }
    else{
      buffer_size = 8192;
      this.size = MAX_ITEM_NUMBER;
    } 

    this.registerBuffer = Buffer.alloc(buffer_size);

    if(primary_table == 0){
        this.reference = 0; //reference for coils
    }
    else{
      this.reference = 1; //  //reference for inputs
    }
    

  }

}

module.exports = Transaction;
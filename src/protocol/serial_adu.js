/**
** Modbus TCP Aplication Data Unit base class.
* @module protocol/serial_adu
* @author Hector E. Socarras.
* @version 0.4.0
*/

const ADU = require('./adu');

/**
*function to convert a value in 2 chars lenght buffer
*@param byte  number;
*@return {Buffer}
*/
function Byte2Chars (byte){

  var temp = Buffer.alloc(2);

  if(byte > 0x0F){
      //convierto el numero en su sttring equivalente en hexadecimal y lo escrbo en el buffer temp
      temp.write((byte & 0x0F).toString(16).toUpperCase(), 1);
      temp.write((byte >> 4).toString(16).toUpperCase());
  }
  else {

      temp.write(0x00.toString(16).toUpperCase());
      temp.write(byte.toString(16).toUpperCase(),1);
  }

  return temp;
}

module.exports = class SerialADU extends ADU {
    constructor(transmition_mode, aduRaw =Buffer.alloc(1)){
        super(aduRaw)  

        let _TransmitionMode ;
        Object.defineProperty(self, 'transmitionMode',{
            get: function(){
              return  _TransmitionMode;
            },
            set: function(transmition_mode){
                if(transmition_mode == 'ascii'){
                    _TransmitionMode = 'ascii';
                }
                else{
                    _TransmitionMode = 'rtu';
                }
            }
        })
        this.transmitionMode = transmition_mode;

        /**
        *modbus address
        *@type {number}
        */
        /**
        * modbus address. Value between 1 and 247
        * @type {number}
        * @throws {RangeError}
        */
        let mAddress = 247;
        Object.defineProperty(self, 'address',{
          get: function(){
            return mAddress;
          },
          set: function(address){
            if(address >= 0 && address <= 255){
              mAddress = address
            }
            else{
              throw new RangeError('Address must be a value fron 1 to 247', 'modbus_slave.js', '55');
            }
          }
        })

        //propiedad error cheking
        this.errorCheck = 0;
    }    

    /**
    *function to make the adu buffer from adu internals    
    */
    MakeBuffer(){

        //creando el buffer de la pdu
        this.pdu.MakeBuffer();

        if(this.transmision_mode == 'ascii'){

            //buffer temporal para el calculo de los caracteres
            var charBuffer = Buffer.alloc(2);  
      
            //size of aduBuffer = 1 start char + 2 address char + 2*pduBuffer + 2 char lrc + 2 char end
            var tempBuffer = Buffer.alloc(2*this.pdu.pduBuffer.length + 7);
            var l = tempBuffer.length;
      
            let rtuBuffer = Buffer.alloc(this.pdu.pduBuffer.length + 1)
            rtuBuffer.writeUInt8(this.address);
            this.pdu.pduBuffer.copy(rtuBuffer, 1);
      
            //caracter ascii de inicio ':'
            tempBuffer[0] = 0x3A;            
            charBuffer = Byte2Chars(this.address);
            charBuffer.copy(tempBuffer,1)
      
            for(var i = 0;i < this.pdu.pduBuffer.length;i++){
              charBuffer = Byte2Chars(this.pdu.pduBuffer[i])
              charBuffer.copy(tempBuffer,2*i+3)
            }
      
            this.errorCheck = this.GetLRC(rtuBuffer);

            tempBuffer.write(this.errorCheck.toString(16).toUpperCase(), l-4, 2,'ascii');
  
            //caracter ascii de fin 'CRLF'
            tempBuffer[l-2] = 0x0D;
            tempBuffer[l-1] = 0x0A;
            
        }
        else{
             
            tempBuffer = Buffer.alloc(this.pdu.pduBuffer.length + 3);  
            tempBuffer[0] = this.address;        
            this.pdu.pduBuffer.copy(tempBuffer,1);        
            this.errorCheck = this.GetCRC(tempBuffer);        
            tempBuffer.writeUInt16BE(this.errorCheck, tempBuffer.length - 2);        
            
        }
      
        this.aduBuffer = tempBuffer;
  
    }
  
    /**
    *function to parse the rtu buffer to make adu internals
    * @throws {string}
    */
    ParseBuffer(){

        let frameLength = this.aduBuffer.length;

        if(this.transmision_mode == "ascii"){

            let rtuBuffer;
            let startChar = this.aduBuffer[0];

            if(startChar == 0x3A){
                let carriageReturnChar = this.aduBuffer[frameLength - 2];
                let endChar = this.aduBuffer[frameLength - 1];
                
                if(carriageReturnChar == 0x0D && endChar == 0x0A){
                    this.address = Number('0x'+this.aduBuffer.toString('ascii',1,3));

                    //pdu normal en rtu entendible por el serial server
                    this.pdu.pduBuffer = Buffer.alloc(Math.floor((frameLength - 7)/2));

                    for(var i = 0; i < this.pdu.pduBuffer.length; i++){
                        this.pdu.pduBuffer[i]=Number('0x'+this.aduBuffer.toString('ascii',2*i+3 ,2*i+5));
                    }

                    this.errorCheck = Number('0x'+this.aduBuffer.toString('ascii', frameLength-4, frameLength-2));

                    return this.pdu.ParseBuffer();
                }
                else{
                  return false;
                }
            }
            else{
                return false;
            }
        }
        else{
            if(frameLength < 3){

                this.address = this.aduBuffer.readUInt8(0);
                this.pdu.pduBuffer = this.aduBuffer.slice(1,-2);
                this.errorCheck = this.aduBuffer.readUInt16BE(this.aduBuffer.length - 2);
                return this.pdu.ParseBuffer();
            }
            else{
              return false
            }
        }
    }
}



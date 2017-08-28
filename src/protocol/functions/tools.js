/*
*@author Hector E. Socarras
*@brief
*Se implementa funciones de utilidades para las modbus functions
*/


var ShiftBufferBits = function (buffer, num_of_bits, w) {
  /*
  *@author Hector E. Socarras
  *@brief
  *Desplaza a la isquierda o la derecha los bits dentro de un buffer.
  *poniendo a 0 los nuevos bits introducidos.
  *@param buffer objeto buffer sobre el q se efectua el corrimiento
  *@param num_of_bits numero entero con la cantidad de bits a desplazar.
  *@param w string con la direccion del desplazamiento 'R'right or 'L' left
  */
    //Inicializando el valor por defecto de la direccion a la derecha
    w || (w = 'r');

    var tempBuffer = new Buffer(buffer.length);
    var workBuffer = new Buffer(2);
    var resultBuffer = new Buffer(buffer.length);
    //copiando el buffer original
    buffer.copy(tempBuffer);

    if (w === 'l' || w === 'L') {
        workBuffer[1] = 0x00;
        //Haciendo un corrimiento hacia la izquierda
        for (var i = tempBuffer.length-1; i >= 0;i--){
            // Empesando por el ultimo byte,
            // buffer de ejemplo [01011110 11100111 10010011] desplazar 3
            //copiando el valor desplazado en 3 workBuffer[0] = 10011000
            //en la primera iteracion es igual al ultimo byte desplazado porque workBuffer[1] == 0
            workBuffer[0] = tempBuffer[i] << num_of_bits | workBuffer[1] ;

            //Guardando los bits desplazados en el byte procesado para la siguiente iteracion.
            //del byte procesado 10010011 se desplazan al byte de la izquierda los 3 primeros bits 100
            // workBuffer[1] = 10010011 >> 5 | 0x00 = 00000100
            workBuffer[1] = tempBuffer[i] >> (8-num_of_bits) | 0x00 ;


            resultBuffer[i]= workBuffer[0];


        }
        return resultBuffer;
    }
    else if (w === 'r' || w === 'R'){
        workBuffer[1] = 0x00;
        //Haciendo un corrimiento hacia la derecha
        for (var i = 0; i <= tempBuffer.length-1;i++){
            // empezando por el primer byte (extremo Izquierdo)
            // buffer de ejemplo [01011110 11100111 10010011] desplazar 3
            //copiando el valor desplazado en 3 workBuffer[0] = 00001011
            //en la primera iteracion es igual al primer byte desplazado porque workBuffer[1] == 0
            workBuffer[0] = tempBuffer[i] >> num_of_bits | workBuffer[1];

            //Guardando los bits desplazados en el byte procesado para la siguiente iteracion.
            //del byte procesado 01011110 se desplazan al byte de la derecha los 3 ultimos bits 110
            // workBuffer[1] = 01011110 << 5 | 0x00 = 11000000
            workBuffer[1] = tempBuffer[i] << (8-num_of_bits) | 0x00 ;


            resultBuffer[i]= workBuffer[0];

        }
        return resultBuffer;
    }
    else { throw 'error'};
}

var InvertBufferBytes = function(buffer){
  /*
  *@author Hector E. Socarras
  *@brief
  *Invierte el orden de los bytes de un buffer
  *
  *@param buffer objeto buffer sobre el q se invierte los bytes
  */
    var resultBuffer = new Buffer(buffer.length)

    for(var i = 0; i < buffer.length; i++ ){
        resultBuffer[i] = buffer[buffer.length-1 -i];
    }
    return resultBuffer;
}

function ExtractDigitalValue (Byte, offset){

  if(offset > 7 && offset <0){
    //throw error
    throw 'error on bit offset'
  }
  else{
    switch (offset) {
      case 0:
        if((Byte & 0x01) == 0x01){
          return true;
        }
        else {
          return false;
        }
        break;
      case 1:
        if((Byte & 0x02) == 0x02){
          return true;
        }
        else {
          return false;
        }
        break;
      case 2:
        if((Byte & 0x04) == 0x04){
          return true;
        }
        else {
          return false;
        }
        break;
      case 3:
        if((Byte & 0x08) == 0x08){
          return true;
        }
        else {
          return false;
        }
        break;
      case 4:
        if((Byte & 0x10) == 0x10){
          return true;
        }
        else {
          return false;
        }
        break;
      case 5:
        if((Byte & 0x20) == 0x20){
          return true;
        }
        else {
          return false;
        }
        break;
      case 6:
        if((Byte & 0x40) == 0x40){
          return true;
        }
        else {
          return false;
        }
        break;
      case 7:
        if((Byte & 0x80) == 0x80){
          return true;
        }
        else {
          return false;
        }
        break;
    }
  }
}

function WriteDigitalValue(Byte, offset, value){
  let newByte = 0x00;
  if(offset > 7 && offset <0){
    //throw error
    throw 'error on bit offset'
  }
  else{
    switch (offset) {
      case 0:
        if(value == true){
          newByte = Byte | 0x01
          return newByte;
        }
        else {
          newByte = Byte & 0xFE
          return newByte;
        }
        break;
      case 1:
        if(value == true){
          newByte = Byte | 0x02
          return newByte;
        }
        else {
          newByte = Byte & 0xFD
          return newByte;
        }
        break;
      case 2:
        if(value == true){
          newByte = Byte | 0x04
          return newByte;
        }
        else {
          newByte = Byte & 0xFB
          return newByte;
        }
        break;
      case 3:
        if(value == true){
          newByte = Byte | 0x08
          return newByte;
        }
        else {
          newByte = Byte & 0xF7
          return newByte;
        }
        break;
      case 4:
        if(value == true){
          newByte = Byte | 0x10
          return newByte;
        }
        else {
          newByte = Byte & 0xEF
          return newByte;
        }
        break;
      case 5:
        if(value == true){
          newByte = Byte | 0x20
          return newByte;
        }
        else {
          newByte = Byte & 0xDF
          return newByte;
        }
        break;
      case 6:
        if(value == true){
          newByte = Byte | 0x40
          return newByte;
        }
        else {
          newByte = Byte & 0xBF
          return newByte;
        }
        break;
      case 7:
        if(value == true){
          newByte = Byte | 0x80
          return newByte;
        }
        else {
          newByte = Byte & 0x7F
          return newByte;
        }
        break;
    }
  }
}

exports.ShiftBufferBits = ShiftBufferBits;

exports.InvertBufferBytes = InvertBufferBytes;

exports.ExtractDigitalValue = ExtractDigitalValue;

exports.WriteDigitalValue = WriteDigitalValue;

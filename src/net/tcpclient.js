/**
*@author Hector E. Socarras Cabrera
*@brief
*Clase base de un servidor tcp.
*
*En este archivo se define el cliente tcp como la primera capa de la libreria
*para modbus tcp.
*Un cliente TCP solo tiene una conexion Activa.
*/

const net = require('net');

module.exports = class TcpClient {
    constructor(OnDataTask){

        //objeto socket con la coneccion activa
        this.socket = null;

        //dispositivo a conectarse {ip, port, remoteAddress, timeout}
        this.slaveDevice = {};

        //mantener laconeccion activa una ves se cierre
        this.keepAliveConnection = false;

        //Funcion a ejecutar cuandose reciven datos
        this.onData = OnDataTask || function(data){console.log(data)};

        //Funcion a ejecutar cuando se establece la coneccion
        this.onConnect = function(){console.log('connection establish whit: ' + this.socket.remoteAddress)};

        this.onError = function(err){ console.log(err)};

        this.onEnd = function(){console.log('connection closed')};

        this.onTimeOut = function(){console.log('timeout')};

        this.onClose =  function(had_error){
            if(had_error){
                console.log('closed by error conexion')
            }
            else{
                console.log('closed');
            }
        }

        this.onWrited = function(data){console.log(data)};

    }

    Connect(){
        let self = this;

        try{
          var conn = net.createConnection(this.slaveDevice.port,this.slaveDevice.ip);
          //configurando el socket devuelto
          conn.on('connect',function(){
			  self.socket = conn;
              self.onConnect(conn);
          });

          conn.on('data', function(data){
              conn.setTimeout(0);
              self.onData(data);
          });

          conn.on('error', function(err){
            self.onError(err)
          })

          conn.on('timeout', function(){
              conn.setTimeout(0);
              self.onTimeOut();
          })

          conn.on('end', this.onEnd);

          conn.on('close',function(had_error){            
              self.socket = null;
              self.onClose(had_error);
          });

          
        }
        catch(e){
          self.onError(e);
        }
    }

    Disconnet(){
        //mando el paquete finn
        this.socket.end();
    }

    Write(data){

        if(this.socket == null){
            return -1;
        }
        else{
            this.socket.write(data);
            this.socket.setTimeout(this.slaveDevice.timeout);
        }
    }
}

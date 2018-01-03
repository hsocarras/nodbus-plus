/**
* Tcp Client  module.
* @module net/tcpclient.
* @author Hector E. Socarras.
* @version 0.4.0
*/

const net = require('net');

/**
 * Class representing a tcp client.
*/
class TcpClient {
  /**
  * Create a tcp client.
  */
    constructor(){

        /**
        *net.socket Object
        * @type {object}
        */
        this.socket = null;

        /**
        * slave ip address
        * @type {string}
        */
        this.slaveIp = '';
        /**
        * slave port
        * @type {number}
        */
        this.slavePort = 502;

        /**
        * slave time to respond
        * @type {number}
        */
        this.slaveTimeout = 50;


        /**
        * prevent than server close de connection for idle time
        * @type {bool}
        */
        this.keepAliveConnection = false;

        //Funcion a ejecutar cuandose reciven datos
        this.onData = function(data){console.log(data)};

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

        /**
        *  function to executed when event write is emited
        * @param {Buffer} buff
        */
        this.onWrite = null

    }

    get SlaveDevice(){
      return {ip:this.slaveIp, port:this.slavePort, timeout:this.slaveTimeout};
    }

    set SlaveDevice(slave){
      this.slaveIp = slave.ip;
      this.slavePort = slave.port;
      this.slaveTimeout = slave.timeout;
    }

    get isConnected(){
      if(this.socket == null){
        return false
      }
      else return true;
    }

    Connect(){
        let self = this;

        try{
          var conn = net.createConnection(this.slavePort,this.slaveIp);
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

          conn.on('end', function(){
            conn.end();
            self.onEnd();
          });

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
      let self = this;
        if(this.socket == null){
            return -1;
        }
        else{
            this.socket.write(data, 'utf8', function(){
              if(self.onWrite){
                self.onWrite(data);
              }
            });
            this.socket.setTimeout(this.slaveTimeout);
        }
    }
}

module.exports = TcpClient

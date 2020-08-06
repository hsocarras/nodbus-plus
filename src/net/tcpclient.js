/**
* Tcp Client  module.
* @module net/tcpclient.
* @author Hector E. Socarras.
* @version 0.8.0
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
        this.sockets = new Map();

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

    isConnected(id){
      return this.sockets.has(id);
    }

    Connect(slave){
        let self = this;
        let promise = new Promise(function(resolve, reject){
          try{
            var conn = net.createConnection(slave.port,slave.ip);
  
            //add Slave id to socket object
            conn.slaveID = slave.id;
            Object.defineProperty(conn, 'slaveID', {
              writable: false,
              enumerable: false,
              configurable: false
          } )

            //Set timeout of socket to 1 min
            conn.setTimeout(60000);
  
            //configurando el socket devuelto
            conn.once('connect',function(){              
              resolve(conn.slaveID)
            })

            conn.on('connect',function(){
                 self.sockets.set(slave.id, conn);
                 self.onConnect(conn.slaveID);
            });
           
  
            conn.on('data', function(data){                
                self.onData(conn.slaveID, data);
            });
  
            conn.on('error', function(err){
              self.onError(conn.slaveID, err)
            })

            conn.once('error', function(err){
              if(self.sockets.has(conn.slaveID)){
                return
              }
              else{
                reject(conn.slaveID);
              }              
            })
  
            conn.on('timeout', function(){                
                self.onTimeOut(conn.slaveID);
            })
  
            conn.on('end', function(){
              conn.end();
              self.onEnd(conn.slaveID);
            });
  
            conn.on('close',function(had_error){
              let key = conn.slaveID;
                self.sockets.delete(key);
                self.onClose(conn.slaveID, had_error);
            });            
            
          }
          catch(e){
            self.onError(e);
            reject(slave.id);
          }
        })

        return promise;
    }

    Disconnet(id){
      let self = this;
      if(this.sockets.has(id) == false){
        return Promise.resolve(id);
      }
      else{
        let promise = new Promise(function(resolve, reject){
          let socket = self.sockets.get(id);
          socket.destroy();
          self.sockets.delete(id);
          resolve(id)
        })
        return promise;
      }        
    }

    Write(id, request){
      let self = this;
        if(this.sockets.has(id) == false){
            return false;
        }
        else{
          let isSuccesfull
          let data = request.adu.aduBuffer;
          let socket = this.sockets.get(id);
            isSuccesfull = socket.write(data, 'utf8', function(){
              if(self.onWrite){
                self.onWrite(id, request);
                request.StartTimer();
              }
            });            

            return isSuccesfull;
        }
    }
}

module.exports = TcpClient

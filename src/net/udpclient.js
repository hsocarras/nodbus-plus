/**
* UDP Client  module.
* @module net/tcpclient.
* @author Hector E. Socarras.
* @version 0.8.0
*/

const dgram = require('dgram');

class UDPClient {
    constructor(type = 'udp4'){

        /**
        *net.socket Object
        * @type {object}
        */
       this.sockets = new Map();

        if(typeof type == 'string'){
            this.type = type
        }
        else{
            throw new TypeError('transport protocol should be a string')
        }
       

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
            var conn = dgram.createSocket(self.type);
            conn.connect(slave.port,slave.ip);
            
            //add Slave id to socket object
            conn.slaveID = slave.id;
            Object.defineProperty(conn, 'slaveID', {
              writable: false,
              enumerable: false,
              configurable: false
          } )

            //add Slave timeout to socket
            conn.slaveTimeout = slave.timeout;
  
            //configurando el socket devuelto
            conn.once('connect',function(){              
              resolve(conn.slaveID)
            })

            conn.on('connect',function(){
                 self.sockets.set(slave.id, conn);                 
                 self.onConnect(conn.slaveID);
            });
           
  
            conn.on('message', function(msg, rinfo){                
                self.onData(conn.slaveID, msg);
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
            
  
            conn.on('close',function(){
                let key = conn.slaveID;
                self.sockets.delete(key);
                self.onClose(conn.slaveID, false);
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
            socket.close();
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
                isSuccesfull = socket.send(data, 0, data.length, function(){
                    if(self.onWrite){
                    self.onWrite(id, request);
                    request.StartTimer();
                    }
                });            
    
                return isSuccesfull;
            }
    }
}

module.exports = UDPClient;
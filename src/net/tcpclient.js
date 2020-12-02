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
        *map Object
        *Key: slave id, data: socket used to send data to slave device
        * @type {object}
        */
        this.sockets = new Map();

        /**
         * Reverse lookup table
         * used to know which slave belong to a ip address, in case of tcp
         * gateway,  only one socket is used for all serial slave, instead to open a conection
         * for every slave on tcp gateway because commonly tcp gateway's server don't suport many 
         * connection
         */
        this.ipMap = new Map();

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
            let ipkey = slave.ip + ':' + slave.port.toString();

            //gateway case. To open only one conection for every slave
            if(self.ipMap.has(ipkey)){
              //if is already exist add the new slave id to de slaves asociate to that address
              let slaves = self.ipMap.get(ipkey);
              let conn = self.sockets.get(slaves[0]);
              slaves.push(slave.id);
              self.sockets.set(slave.id, conn);  
              if(self.isConnected){
                resolve(ipkey)
                self.onConnect(slave.id);
              }
              
            }
            else{
            
              var conn = net.createConnection(slave.port,slave.ip);           
              conn.id = ipkey;
              self.ipMap.set(conn.id, [slave.id])

              //Set timeout of socket to 1 min
              conn.setTimeout(60000);
    
              //configurando el socket devuelto
              conn.once('connect',function(){              
                resolve(ipkey);
                let slaves = self.ipMap.get(ipkey);
                slaves.forEach((id)=>{
                  self.sockets.set(id, conn);
                  self.onConnect(id);
                })
              })
           
  
              conn.on('data', function(data){                
                  self.onData(conn.id, data);
              });
    
              conn.on('error', function(err){
                self.onError(conn.id, err)
              })

              conn.once('error', function(err){                
                //if the connection exits, then was succsesfull establishes previously
                if(self.ipMap.has(conn.id)){
                  return
                }
                else{
                  
                  reject(conn.id);
                }              
              })
    
              conn.on('timeout', function(){                
                  self.onTimeOut(conn.id);
              })
    
              conn.on('end', function(){
                conn.end();
                self.onEnd(conn.id);
              });
    
              conn.on('close',function(had_error){
                
                let keys = self.ipMap.get(conn.id);

                if(keys){
                  keys.forEach(element => {
                    self.sockets.delete(element);
                    self.onClose(element, had_error);
                  });
                  self.ipMap.delete(conn.id); 
                }
              });  

            }          
            
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
      let conn = self.sockets.get(id);

      if(this.sockets.has(id) == false){
        return Promise.resolve(id);
      }
      else if(self.ipMap.get(conn.id).length > 1){
        //if there are more than one slave asociated to that connection. Gateway case.
        let socket = self.sockets.get(id);        
        let listofId = self.ipMap.get(socket.id);
        let index = listofId.indexOf(id);
        if(index != -1){
          listofId.splice(index, 1);
        }
       
        self.sockets.delete(id);
        return Promise.resolve(id);

      }
      else{
        let promise = new Promise(function(resolve, reject){
          let socket = self.sockets.get(id);
          
          socket.end();
          //watchdog for await the FIN packet of the other end of the socket
          let watchdogTimer = setTimeout(()=>{
            socket.destroy();
          }, 5000)

          //listener for the FIN packet of the other end
          socket.once('end',() => {
            self.ipMap.delete(socket.id)
            self.sockets.delete(id);
            clearTimeout(watchdogTimer);
            resolve(id)
          })          
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
              }
              request.StartTimer();
            });            

            return isSuccesfull;
        }
    }
}

module.exports = TcpClient

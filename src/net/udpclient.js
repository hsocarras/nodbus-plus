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

       /**
         * Reverse lookup table
         * used to know which slave belong to a ip address, in case of tcp
         * gateway,  only one socket is used for all serial slave, instead to open a conection
         * for every slave on tcp gateway because commonly tcp gateway's server don't suport many 
         * connection
         * * @type {Map object}
         */
        this.ipMap = new Map();

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
            let ipkey = slave.ip + ':' + slave.port.toString();

            //gateway case. To open only one conection for every slave
            if(self.ipMap.has(ipkey)){

              //if is already exist add the new slave id to de slaves asociate to that address
              let slaves = self.ipMap.get(ipkey);
              slaves.push(slave.id);
              self.sockets.set(slave.id, self.sockets.get(slaves[0]));  //add the same socket to the list
              resolve(slave.id)
              self.onConnect(slave.id);

            }
            else{
              var conn = dgram.createSocket(self.type);
              conn.id = ipkey;
              conn.connect(slave.port,slave.ip);
    
              //configurando el socket devuelto
              conn.once('connect',function(){              
                resolve(conn.slaveID)
              })

              conn.on('connect',function(){
                self.ipMap.set(conn.id, [slave.id])
                self.sockets.set(slave.id, conn);                  
                self.onConnect(slave.id);
              });
            
    
              conn.on('message', function(msg, rinfo){                
                  self.onData(conn.id, msg);
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
  
              conn.on('close',function(){
                let keys = self.ipMap.get(conn.id);
                keys.forEach(element => {
                  self.sockets.delete(element);
                  self.onClose(element, had_error);
                });
                self.ipMap.delete(conn.id);                
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
        if(this.sockets.has(id) == false){
          return Promise.resolve(id);
        }
        else if(self.ipMap.get(self.sockets.get(id)).length > 1){
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
            socket.close();
            self.ipMap.delete(socket.id)
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
                    }
                    request.StartTimer();
                });            
    
                return isSuccesfull;
            }
    }
}

module.exports = UDPClient;
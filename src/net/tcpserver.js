/**
**  Tcp server module.
* @module net/tcp_server.
* @author Hector E. Socarras.
* @version 0.4.0
*/

var net = require('net');

/**
 * Class representing a tcp server layer for modbus tcp.
 */
class TCPServer {
  /**
  * Create a Tcp Server.
  */
  constructor(){

    var self = this;

    /**
    * tcp server
    * @type {Object}
    */
    this.tcpServer = net.createServer();


    let connections = [];
    /**
    * list of connections
    * @type {Object[]}
    */
    Object.defineProperty(self,'activeConections',{
        get: function(){ return connections}
    })

    /**
    * listening status
    * @type {boolean}
    */
    Object.defineProperty(self, 'isListening',{
      get: function(){
        return self.tcpServer.listening;
      }
    });

    /**
    * Max connections
    * @type {number}
    */
    Object.defineProperty(self, 'maxConnections',{
      get: function(){
        return self.tcpServer.maxConnections;
      },
      set: function(max){
        self.tcpServer.maxConnections = max;
      }
    });

    /**
    * port
    * @type {number}
    */
    this.port = 502;

    /**
    * list of ip allowed
    * @type {string[]}
    */
    this.listAuthorizedIP = ['INADDR_ANY'];

    /**
    * list of ip denied
    * @type {string[]}
    */
    this.listForbidendIP  = ['NONE'];

    /**
    * Acces control function.
    * @param {object} net.socket
    * @return {bool}
    */
    function AllowConnection (socket) {

        var isForbidden = self.listForbidendIP.indexOf(socket.remoteAddres);
        var isAuthorized = self.listAuthorizedIP.indexOf(socket.remoteAddres);

        if(isForbidden == -1 && self.listAuthorizedIP.indexOf('INADDR_ANY') >= 0 ){
            return true
        }
        else if(isForbidden >= 0 ){
            return false
        }
        else if(isAuthorized >= 0  & isForbidden == -1){
            return true
        }
        else{
            return false
        }
    }

    //Socket config

    /**
    *  Inactivity time to close a connection
    * @type {number}
    */
    this.connectionTimeout = 0;

    //User listeners
    /**
    *  function to executed when event data is emited
    * @param {Buffer} data
    */
    this.onData = function(data){console.log(data)};

    /**
    *  function to executed when event listening is emited
    */
    this.onListening = function(){ console.log('listening')};

    /**
    *  function to executed when event connection is emited
    * @param {Object} net.socket
    */
    this.onConnection = function(){ console.log('new connection')};

    /**
    *  function to executed when event access-denied is emited
    * @param {Object} net.socket
    */
    this.onAccessDenied = null;

    /**
    *  function to executed when event error is emited
    * @param {Object} error
    */
    this.onError = function(err){ console.log(err)};

    /**
    *  function to executed when event close is emited
    */
    this.onServerClose = function(){ console.log('server close')};

    /**
    *  function to executed when event socket#close is emited
    */
    this.onConnectionClose = null;;

    /**
    *function to executed when event socket#end is emited
    */
    this.onClientEnd = null;

    /**
    *  function to executed when event write is emited
    * @param {Buffer} buff
    */
    this.onWrite = function(){};;

    this.tcpServer.on('error', function(err){
      self.onError(err);
    });

    this.tcpServer.on('close', function(){
      connections = [];
      self.onServerClose();
    });

    this.tcpServer.on('listening', function(){
      self.onListening()
    });

    this.tcpServer.on('connection', function(socket) {

      self.onConnection(socket);

        if(AllowConnection(socket)){

            //agrego el socket a la lista de conexiones activas
            connections.push(socket)

            //defining sockets behavior
            if(self.connectionTimeout > 0) {
              socket.setTimeout(self.connectionTimeout);
            }

            socket.on('data',function(data){

              var response = self.onData(data);

                if(response.length <= 1 ){
                    return;
                }
                else{
                    socket.write(response, 'utf8', function(){
                      if(self.onWrite){
                        self.onWrite(response);
                      }
                    });
                }
            });

            socket.on('error',self.onError);

            socket.on('timeout',function() {
                socket.end();
            })


            if(self.onClientEnd){
              socket.on('end', self.onClientEnd);
            }

            socket.on('close',function(){
                var index = connections.indexOf(socket);
                connections.splice(index,1);
            });

            if(self.onConnectionClose){
              socket.on('close', self.onConnectionClose);
            }
        }
        else{
            socket.end();
            if(self.onAccessDenied){
              self.onAccessDenied(socket);
            }
        }
    });

  }

  /**
  * Add a ip to list of allowed ip
  * @param {string} ip format aaa.bbb.ccc.ddd
  * @throws {string}
  */
  AddAuthorizedIP(ip){
    if(typeof(ip) == 'string'){
       this.listAuthorizedIP.push(ip);
    }
    else{
      throw 'error of ip format'
    }
  }

  /**
  * Remove a ip to list of allowed ip
  * @param {string} ip format aaa.bbb.ccc.ddd
  * @throws {string}
  */
  RemoveAuthorizedIP (ip){
       if(typeof(ip) == 'string'){
           var index = listAuthorizedIP.indexOf(ip)
           this.listAuthorizedIP.splice(index,i);
       }
       else{
         throw 'error of ip format'
       }
  }

  /**
  * Add a ip to list of forbiden ip
  * @param {string} ip format aaa.bbb.ccc.ddd
  * @throws {string}
  */
  AddForbidenIP (ip){
      if(typeof(ip) == 'string'){
         this.listForbidendIPIP.push(ip);
      }
      else{
        throw 'error of ip format'
      }
  }

  /**
  * Remove a ip to list of forbiden ip
  * @param {string} ip format aaa.bbb.ccc.ddd
  * @throws {string}
  */
  RemoveForbidendIP (ip){
       if(typeof(ip) == 'string'){
           var index = listAuthorizedIP.indexOf(ip)
           this.listForbidendIP.splice(index,i);
       }
       else{
         throw 'error of ip format'
       }
  }

  /**
  * Start the tcp server
  */
  Start (){
      try {
         this.tcpServer.listen(this.port)
      }
      catch(error){
          this.onError(error);
      }
  }

  /**
  * Stop the tcp server
  */
  Stop (){
      //cerrando el server
      this.tcpServer.close();
      var sockets = this.activeConections;
      sockets.forEach(function(element){
          element.destroy();
      });
  }

  /**
  * function to write in a conection
  * @param {objec} socket
  * @param {buffer} data
  */
  Write (socket,data){
      socket.write(data);
  }

}



module.exports = TCPServer;

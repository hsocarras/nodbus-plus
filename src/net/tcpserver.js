/**
*@author Hector E. Socarras Cabrera
*@brief
*Clase base de un servidor tcp.
*
*En este archivo se define el servidor tcp, la primera capa de la libreria
*para modbus tcp. Se encargara de la gestion de la comunicacion sobre tcp y pasara hacia la
*siguiente capa la ADU (Aplication data Unit) enviada en el paquete TCP por una aplicacion cliente.
*/


var net = require('net');

var NodbusTCPServer = function (OnDataTask){
    //deberia chequear que ondatatask sea una funcion en la proxima version

    var nodbusTcpServer = this;

    //arreglo de conexiones activas
    var connections =[];

    var isListening = false;

    //Reglas de filtrado para la funcion AllowConecction
    //reciviria un objeto resultado de parsear un json.
    var listAuthorizedIP = ['INADDR_ANY'];

    var listForbidendIP  = ['NONE'];

    this.port = 502;

    this.connectionTimeout = 60000;

    this.onData = OnDataTask || function(data){console.log(data)};

    this.onListening = function(){console.log('Server listening on port: '+ this.port)};

    this.onConnection = function(socket){console.log('New connection from: '+socket.remoteAddress)};

    this.onAccessDenied = function(socket){console.log('acces denied to' + socket.remoteAddress)};

    this.onError = function(err){ console.log(err)};

    this.onServerClose = function(){console.log('server closed')};

    this.onConnectionClose = function(){console.log('conection close')};

    this.onWrite = function(buff){console.log(buff)};

    this.tcpServer = net.createServer();

    //Maximo numero de conexiones q admite el servidor
    this.tcpServer.maxConnections = 10;

    this.tcpServer.on('listening',function(){
        isListening = true;
        nodbusTcpServer.onListening(nodbusTcpServer.port);
    });

    this.tcpServer.on('connection', function(socket) {
        if(AllowConnection(socket)){

            nodbusTcpServer.onConnection(socket);

            //agrego el socket a la lista de conexiones activas
            connections.push(socket)

            //Definiendo el tiempo de inactividad para cerrar la conexion
            socket.setTimeout(nodbusTcpServer.connectionTimeout);

            socket.on('data',function (data){

                var response = nodbusTcpServer.onData(data);

                if(response == -1 || response == undefined){
                    return;
                }
                else{
                    socket.write(response, 'utf8', function(){
                      nodbusTcpServer.onWrite(response);
                    });                    
                }

            });

            socket.on('error',function(err) {
                nodbusTcpServer.onError(err);
            });

            socket.on('timeout',function() {
                socket.end();
            })

            socket.on('end', function() {

            });

            socket.on('close',function(){
                //Elimino el socket de la connections_active
                nodbusTcpServer.onConnectionClose(socket);
                var index = connections.indexOf(socket);
                connections.splice(index,1);
            });


        }
        else{
            socket.end();
            nodbusTcpServer.onAccessDenied(socket);
        }
    });

    this.tcpServer.on('close', function() {
        isListening = false;
        nodbusTcpServer.onServerClose();
    });

    this.tcpServer.on('error', function(err) {
        nodbusTcpServer.onError(err);
    });

    Object.defineProperty(nodbusTcpServer,'ActiveConections',{
        get: function(){ return connections}
    })

    this.isListening = function(){
        return isListening;
    }

    var AllowConnection = function (socket) {
        /**
        *Funcion para el control da acceso.
        */
        var isForbidden = listForbidendIP.indexOf(socket.remoteAddres);
        var isAuthorized = listAuthorizedIP.indexOf(socket.remoteAddres);

        if(isForbidden == -1 && listAuthorizedIP.indexOf('INADDR_ANY') >= 0 ){
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

    this.addAuthorizedIP = function(ip){
        if(typeof(ip) == 'string'){
           listAuthorizedIP.push(ip);
        }
    }

    Object.defineProperty(nodbusTcpServer,'ListAuthorizedIP',{
        get: function(){ return listAuthorizedIP},

        set: function(list){listAuthorizedIP=list}
    });

    this.removeAuthorizedIP = function (ip){
         if(typeof(ip) == 'string'){
             var index = listAuthorizedIP.indexOf(ip)
             listAuthorizedIP.splice(index,i);
         }
    }

    this.addForbidenIP = function(ip){
        if(typeof(ip) == 'string'){
           listForbidendIPIP.push(ip);
        }
    }

    Object.defineProperty(nodbusTcpServer,'ListForbidendIP',{
        get: function(){ return listForbidendIP},

        set: function(list){listForbidendIP=list}
    });

    this.removeForbidendIP = function (ip){
         if(typeof(ip) == 'string'){
             var index = listAuthorizedIP.indexOf(ip)
             listForbidendIP.splice(index,i);
         }
    }
}

NodbusTCPServer.prototype.Start = function(){

    try {
       this.tcpServer.listen(this.port)
    }
    catch(error){
        console.log(error);
    }
}

NodbusTCPServer.prototype.Stop = function (){

    //cerrando el server
    this.tcpServer.close();
    var sockets = this.getActiveConections();
    sockets.forEach(function(element){
        element.end();
    });

}

NodbusTCPServer.prototype.Write = function(index,data){
    var activeConections = this.getActiveConections();
    activeConections[index].write(data);
}

module.exports = NodbusTCPServer;

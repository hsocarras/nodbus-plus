/**
** Modbus TCP Server Base Class module.
* @module protocol/modbus-slave
* @author Hector E. Socarras.
* @version 0.12.0
*/




const TcpADU = require('../protocol/tcp_adu');
const Header = require('./mbap_header');
const PDU = require('./pdu');
const ModbusSlave = require('./modbus_slave');
const SlaveFunctions = require('./server_utils/slave_functions');

/**
 * Class representing a modbus tcp server.
 * @extends ModbusDevice
*/
class ModbusServerTcp extends ModbusSlave {
  /**
  * Create a Modbus Slave.
  */
    constructor(mb_tcp_server_cfg){
        super('tcp', mb_tcp_server_cfg);

        var self = this;    
        
        const _NumberMaxOfSeverTransaction = mb_tcp_server_cfg.NumberMaxOfSeverTransaction || 32;
        Object.defineProperty(self, 'NumberMaxOfSeverTransaction',{
            get: function(){
            return _NumberMaxOfSeverTransaction;
            }
        })

        //Transactions  Stack
        this.transactionStack = new Array(_NumberMaxOfSeverTransaction).fill(null);
        
        //states
        this.globalState = 0 //0 stopped or iddle, 1 started or wait state
        
        /**
        * interface function for network layer
        */
        this.SendResponseMessage = function(connection_id, message_frame){};
    }  

    StartServer(){
        this.globalState = 1;        
    }

    StopServer(){
        this.globalState = 0;        
    }

    ResetServer(){
        //Clearing transaction stack
        for( let i = 0; i < this.transactionStack.length; i++){
            this.transactionStack[i] = null;
        }
    }

    /**
    * this function is the interface for tcp layer to send modbus message.    
    * See Modbus Message implementation Guide v1.0b InterfaceIndicationMsg Fig 19
    * @param {object} connection_id connection id used for user app to identificate a connection on tcp management layer.
    * @param {buffer} message_frame modbus indication's frame
    * @return void
    * 
    */
    ReceiveIndicationMessage(connection_id, message_frame){
        //Starting server activity
        if(this.globalState){
            this.CheckModbusADU(connection_id, message_frame);
        }
    }

    /**
    * this function implement the PDU checkin activity diagram Figure 16.    
    * See Modbus Message implementation Guide v1.0b
    * @param {object} connection_id connection id used for user app to identificate a connection on tcp management layer.
    * @param {buffer} message_frame modbus indication's frame
    * @return {object} Adu  if success, otherwise null
    * 
    */
    CheckModbusADU(connection_id, message_frame){  

        if(message_frame.length > 7){

            let header = new Header(message_frame.slice(0, 7));
            //parsing header           
            
            if(header.ParseBuffer() && header.protocolID == 0 && header.length <= PDU.MaxLength + 1){                
               
                let mbRequestPDU = new PDU(message_frame.slice(7));
                mbRequestPDU.ParseBuffer();

                let mbRequestADU = new TcpADU()
                mbRequestADU.header = header;
                mbRequestADU.pdu = mbRequestPDU;

                //Instanciate Transaction Object
                let  transaction = {
                    connectionID:connection_id,
                    request: mbRequestADU                   
                }

                let transactionIndex = this.transactionStack.indexOf(null);
                if(transactionIndex >= 0){
                    //means that somo index in transaction stack is empty(has a null value)
                    if(this.ValidateRequestPDU(mbRequestADU.pdu)){
                        //transaction accepted
                        this.transactionStack[transactionIndex] = transaction;                                                
                        
                    }
                    else{
                        //transaction rejected. exception 1
                        let resPDU = this.BuilModbusException(mbRequestPDU.modbus_function, 1);
                        let mbResponseAdu = MakeResponse(mbRequestADU.header, resPDU);                   
    
                        this.SendResponseMessage(connection_id, mbResponseAdu.buffer);
                    }
                }
                else{
                    //transaction rejected. exception 6
                    let resPDU = this.BuilModbusException(mbRequestPDU.modbus_function, 6);
                    let mbResponseAdu = MakeResponse(mbRequestADU.header, resPDU);                   

                    this.SendResponseMessage(connection_id, mbResponseAdu.buffer);

                }
            }
            
        }
        
    }  

    async ResolveTransaction(transaction_index){

        let transaction = this.transactionStack[transaction_index];
        let reqHeader = transaction.request.header;
        let resPDU = await this.MBServiceProcessing(transaction.request.pdu);
        let mbResponseAdu = MakeResponse(reqHeader, resPDU);                   

        this.SendResponseMessage(connection_id, mbResponseAdu.buffer);
        this.transactionStack[transaction_index] = null;
    }

   MakeResponse(req_header, resp_pdu){

        let mbResponseAdu = new TcpADU();
        mbResponseAdu.header = new Header();
        mbResponseAdu.pdu = resp_pdu;
        mbResponseAdu.header.unitID = req_header.unitID;
        mbResponseAdu.header.transactionID = req_header.transactionID;
        mbResponseAdu.header.length = resp_pdu.GetLength() + 1;
        mbResponseAdu.MakeBuffer();

        return mbResponseAdu
   }
   
}



module.exports = ModbusServerTcp;

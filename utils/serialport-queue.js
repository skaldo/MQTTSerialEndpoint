/**
 * Created by skaldo on 10/14/2014.
 */

/**
 * Low level queued SerialPort API
 * main usecase: send message, wait for
 * response and pass it as argument in
 * the callback function. For this behavior
 * use the the addTask API call.
 */

/**
 * USAGE:

 var SPQueue = require("./serialport-queue");

 var q = new SPQueue("/dev/ttys005", {
    baudrate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false
 });

 q.addTask(
 {
     command: cmd,
     callback: function(data){
         var frame = TBus.parse(data);
         var temp = devices[frame.sender[0]].parse(frame.data);
         console.log("received: "+temp);
     }
 }
 );

 q.on("received", function(data, received, issued){
    console.log("received: ", data);
    console.log("rx time: ", received);
    console.log("issue time: ", issued);
    });

 q.write("HELLOWORLD");
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var SerialPort = require("serialport").SerialPort;


var SerialPortQueue = function(sp, options) {
    var self = this;

    // timeout ID for no data received timeout
    self._noResponseTimeoutID;
    // no data received timeout
    self._noResponseTimeout = options.timeout || 1000;
    // timeoutID used to cancel not needed callbacks
    self._timeoutID;
    // for inconsistent data merging
    self._timeout = 200;
    // received data buffer
    self._received = new Buffer(0);
    // instance of the serialport
    self._serialPort = new SerialPort(sp, options);
    // serialport open flag
    self._serialPortOpen = false;
    // command queue
    self._commands = [];
    // issue - timestamp
    self._issuedTime = null;
    // received - timestamp
    self._receivedTime = null;

    // onopen callback
    self._serialPort.on("open", function () {
        self._serialPort.on('data', function (data) {
            if (self._timeoutID) {
                clearTimeout(self._timeoutID);
            }
            if (self._noResponseTimeoutID) {
                clearTimeout(self._noResponseTimeoutID);
            }
            self._received = Buffer.concat([self._received, data]);
            self._timeoutID = setTimeout(function () {
                self._dataReceived.apply(self);
            }, self._timeout);
        });

        self._serialPortOpen = true;
        self._next();
    });
};

util.inherits(SerialPortQueue, EventEmitter);

/**
 * DataReceived callback
 * @private
 */
SerialPortQueue.prototype._dataReceived = function(){
    this._receivedTime = new Date();
    this.emit("received", this._received, this._receivedTime, this._issuedTime);
    if(this._commands.length !== 0)
    {
        this._commands[0].callback(this._received, this._receivedTime, this._issuedTime);
        this._commands.shift();
        this._received = new Buffer(0);
        this._issuedTime = this._receivedTime = null;
        this._next();
        return;
    }
    this._received = new Buffer(0);
};

/**
 * Executes next task from the queue
 * @private
 */
SerialPortQueue.prototype._next = function(){
    if(this._commands.length === 0){
        //console.log("queue finished");
        return;
    }
    var self = this;
    this._noResponseTimeoutID = setTimeout(function () {
        self.emit("timeout", self._commands[0].command, self._issuedTime);
        self._commands.shift();
        self._next();
    }, this._noResponseTimeout);
    this._issuedTime = this._commands[0]._issued;
    this._serialPort.write(this._commands[0].command);
};

/**
 * Adds new task to the queue
 * @param command object {command: Buffer, callback: Function}
 * @returns {*} timestamp
 */
SerialPortQueue.prototype.addTask = function(command){
    command._issued = new Date();
    this._commands.push(command);
    if((this._commands.length === 1) && this._serialPortOpen)
    {
        this._next();
    }
    return command._issued;
};

/**
 * Write function when no custom callback needed
 * @param buff Buffer
 * @returns {*} timestamp
 */
SerialPortQueue.prototype.write = function (buff) {
    var issued;
    issued = this.addTask({
        command: buff,
        callback: function(){}
    });
    return issued;
};

module.exports = SerialPortQueue;

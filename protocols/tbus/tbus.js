/**
 * Created by skaldo on 10/21/14.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var protocol = require("./protocol.js");
var SPQueue = require("./../../utils/serialport-queue.js");

var address = new Buffer([0x00, 0x00, 0x00, 0x00]);

var TBus = function(sp, options) {
    var self = this;

    options.parser = require(__dirname + '/parser.js')();

    self.sp = sp;
    self._address = address;
    self._serialPortQueue = new SPQueue(sp, options);

    self._serialPortQueue.on("timeout", function(req, issued) {
        console.log("Frame issued on: " + issued + " timed out.");
        self.emit("timeout", issued);
    });

    self._serialPortQueue.on("received", function(data, received, issued){
        var frame;

        frame = protocol.parse(data);
        if(!frame.valid){
            debug("Received invalid T-Bus frame");
            return;
        }

        self.emit("frame", frame, received, issued);
    });
};

util.inherits(TBus, EventEmitter);

TBus.prototype.send = function(dest, cmd) {
    var self = this,
        command;

    command = protocol.prepareCommand(dest, self._address, cmd);
    self._serialPortQueue.write(command);
};

module.exports = TBus;
/**
 * Created by skaldo on 10/21/14.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug');

var protocol = require("./protocol.js");
var SPQueue = require("./../../utils/serialport-queue");

var address = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

var LoRa = function(sp, options) {
    var self = this;

    self.sp = sp;
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

util.inherits(LoRa, EventEmitter);

LoRa.prototype.send = function(dest, cmd) {
    var self,
        command;

    self = this;
    command = protocol.prepareCommand(dest, self._address, cmd);
    self._serialPortQueue.write(command);
};

module.exports = LoRa;
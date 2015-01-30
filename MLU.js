/**
 * Created by skaldo on 10/21/14.
 */

/*
USAGE:
 MLU.on("data", function(d){
 console.log("received: ", d.data);
 console.log("rx time: ", d.received);
 console.log("issue time: ", d.issued);
 console.log("BUS: ", d.bus);
 });

 MLU.schedule("tbus", "* * * * * *", [0x07, 0x00, 0x00, 0x01], [0x01]);
 */


var util = require('util');
var EventEmitter = require('events').EventEmitter;

var TBusQueue = require("./protocols/tbus/tbus.js");
var MLUSettings = require("./MLUSettings.js");
var TBusTasks = require("./tasks/tasks.js");

var MLU = function(){
    var self;

    self = this;

    //self._TBusQueue = new TBus("/dev/ttys005", MLUSettings.serialPorts.tbus.settings);
    self._TBusQueue = new TBus(MLUSettings.serialPorts.tbus.name, MLUSettings.serialPorts.tbus.settings);
    self._tBusTasks = new TBusTasks(self._TBusQueue);

    self._TBusQueue.on("frame", function(frame, received, issued){
        self.emit("data", {
            bus: "tbus",
            data: frame,
            issued: issued,
            received: received
        });
    });
};

util.inherits(MLU, EventEmitter);

MLU.prototype.schedule = function(bus, cronString, address, command){
    var self;

    self = this;
    if(bus.toLowerCase() === "tbus"){
        self._tBusTasks.schedule(cronString, address, command);
    }
};

MLU.prototype.send = function(bus, address, command){
    var self;

    self = this;
    if(bus.toLowerCase() === "tbus"){
        self._TBusQueue.send(address, command);
    }
};

module.exports = MLU;
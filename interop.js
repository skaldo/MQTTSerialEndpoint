/**
 * Created by skaldo on 11/19/14.
 */

/*
    EXAMPLE USAGE:
     var Interop = require("./interop.js");

     var interfacesSettings = [{
     identifier: 'tbus1', //used in the MQTT
     protocol: 'tbus',
     sp: '/dev/tty.usbserial-AH000KNV',
     spConfig: {
     baudrate: 9600,
     dataBits: 8,
     parity: 'none',
     stopBits: 1,
     flowControl: false,
     timeout: 1000
     }
     }];

     var interop = new Interop(interfacesSettings);

     interop.on("data", function(identifier, protocol, time, from, data){
     console.log(identifier, protocol, time, from, data);
     });

     //interop.send('tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);
     interop.schedule("* * * * * *", 'tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);
*/

var util = require('util');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var Tasks = require('./tasks/tasks.js');

var Interop = function(interfacesSettings){
    var self = this,
        protocols;

    self._interfaces = {};
    self._tasks = new Tasks();

    protocols = fs.readdirSync('./protocols');

    // TODO: dynamic interfaces loading
    self._availableInterfaces = {};

    for(var i=0; i<protocols.length; i++){
        self._availableInterfaces[protocols[i]] = require('./protocols/'+protocols[i]+'/'+protocols[i]+'.js');
    }

    // initialization of the interfaces from the config
    for(var i=0; i<interfacesSettings.length; i++){
        self.addInterface(interfacesSettings[i]);
    }
};

util.inherits(Interop, EventEmitter);

Interop.prototype.addInterface = function(interfaceSettings){
    var self = this;

    if(self._interfaces[interfaceSettings.identifier]){
        console.error("The "+interfaceSettings.identifier+" identifier is not unique!");
        return false;
    }
    self._interfaces[interfaceSettings.identifier] = new self._availableInterfaces[interfaceSettings.protocol](
        interfaceSettings.sp,
        interfaceSettings.spConfig
    );

    // register event handler
    self._interfaces[interfaceSettings.identifier].on("frame", function(frame, received){
        self.emit("data", interfaceSettings.identifier, interfaceSettings.protocol, received, frame.sender, frame.data);
    });

    return true;
};

Interop.prototype.send = function(identifier, address, data){
    var self = this;

    if(!self._interfaces[identifier]){
        console.error("The interface with identifier "+identifier+" does not exist");
        return false;
    }
    self._interfaces[identifier].send(address, data);
    return true;
};

Interop.prototype.schedule = function(cronString, identifier, address, data){
    var self = this;

    if(!self._interfaces[identifier]){
        console.error("The interface with identifier "+identifier+" does not exist");
        return false;
    }
    self._tasks.schedule(cronString, self._interfaces[identifier], address, data);
    return true;
};

Interop.prototype.getIdentifiers = function(){
    var selft = this,
        identifiers = [];
    for(var k in self._interfaces) identifiers.push(k);
    return identifiers;
};

module.exports = Interop;
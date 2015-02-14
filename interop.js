/**
 * Created by skaldo on 11/19/14.
 */

/*
Class used as an API providing an abstraction layer between the application and the low level bus systems.
It does implement a scheduling mechanism, see example usage.

EXAMPLE USAGE:
    var Interop = require("./interop.js");

    // Settings of the interfaces. The protocol names have to correspond with
    // the protocols defined in the protocols folder.
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
    }];

    var interop = new Interop(interfacesSettings);

    interop.on("data", function(identifier, protocol, time, from, data){
    console.log(identifier, protocol, time, from, data);
    });

    // Send single command to the bus
    interop.send('tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);
    //Cron-like scheduling of the recurrent commands
    interop.schedule("* * * * * *", 'tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);

*/

var util = require('util');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var Tasks = require(__dirname + '/tasks/tasks.js');

/**
 * Class constructor, initializes the interfaces.
 * @param interfacesSettings
 * @constructor
 */
var Interop = function(interfacesSettings){
    var self = this,
        protocols;

    self._interfaces = {};
    self._tasks = new Tasks();

    protocols = fs.readdirSync(__dirname + '/protocols');

    // TODO: dynamic interfaces loading
    self._availableInterfaces = {};

    for(var i=0; i<protocols.length; i++){
        self._availableInterfaces[protocols[i]] = require(__dirname + '/protocols/'+protocols[i]+'/'+protocols[i]+'.js');
    }

    // initialization of the interfaces from the config
    for (var protocolName in interfacesSettings){
        for(var i=0;i<interfacesSettings[protocolName].length; i++){
            self.addInterface(interfacesSettings[protocolName][i], i, protocolName);
        }
    }
};

util.inherits(Interop, EventEmitter);

/**
 * Adds new interface and does all the necessary setup.
 * @param interfaceSettings
 * @param id
 * @param protocolName
 * @returns {boolean}
 */
Interop.prototype.addInterface = function(interfaceSettings, id, protocolName){
    var self = this;

    if(!self._interfaces[protocolName]){
        self._interfaces[protocolName] = [];
    }

    self._interfaces[protocolName][id] = new self._availableInterfaces[protocolName](
        interfaceSettings.sp,
        interfaceSettings.spConfig
    );

    // register event handler
    self._interfaces[protocolName][id].on("frame", function(frame, received){
        self.emit("data", id, protocolName, received, frame.sender, frame.data);
    });

    return true;
};

/**
 * Send method used to send the data to the physical device attached on the bus.
 * @param id
 * @param address
 * @param data
 * @returns {boolean}
 */
Interop.prototype.send = function(protocolName, id, address, data){
    var self = this;

    id = parseInt(id);

    if(!self._interfaces[protocolName][id]){
        console.error("The interface with name "+protocolName+" and id "+id+" does not exist");
        return false;
    }
    self._interfaces[protocolName][id].send(address, data);
    return true;
};

/**
 * Schedules recurring command transmission.
 * @param cronString
 * @param id
 * @param address
 * @param data
 * @returns {boolean}
 */
Interop.prototype.schedule = function(cronString, protocolName, id, address, data){
    var self = this;

    id = parseInt(id);

    if(!self._interfaces[protocolName][id]){
        console.error("The interface with name "+protocolName+" and id "+id+" does not exist");
        return false;
    }
    self._tasks.schedule(cronString, self._interfaces[protocolName][id], address, data);
    return true;
};

/**
 * Gets the ids of the interfaces.
 * @returns {Array}
 */
Interop.prototype.getInterfaces = function(){
    var self = this;

    return self._interfaces;
};

module.exports = Interop;
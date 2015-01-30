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

var Tasks = require('./tasks/tasks.js');

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

    protocols = fs.readdirSync('./protocols');

    // TODO: dynamic interfaces loading
    self._availableInterfaces = {};

    for(var i=0; i<protocols.length; i++){
        self._availableInterfaces[protocols[i]] = require('./protocols/'+protocols[i]+'/'+protocols[i]+'.js');
    }

    // initialization of the interfaces from the config
    for(i=0; i<interfacesSettings.length; i++){
        self.addInterface(interfacesSettings[i]);
    }
};

util.inherits(Interop, EventEmitter);

/**
 * Adds new interface and does all the necessary setup.
 * @param interfaceSettings
 * @returns {boolean}
 */
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

/**
 * Send method used to send the data to the physical device attached on the bus.
 * @param identifier
 * @param address
 * @param data
 * @returns {boolean}
 */
Interop.prototype.send = function(identifier, address, data){
    var self = this;

    if(!self._interfaces[identifier]){
        console.error("The interface with identifier "+identifier+" does not exist");
        return false;
    }
    self._interfaces[identifier].send(address, data);
    return true;
};

/**
 * Schedules recurring command transmission.
 * @param cronString
 * @param identifier
 * @param address
 * @param data
 * @returns {boolean}
 */
Interop.prototype.schedule = function(cronString, identifier, address, data){
    var self = this;

    if(!self._interfaces[identifier]){
        console.error("The interface with identifier "+identifier+" does not exist");
        return false;
    }
    self._tasks.schedule(cronString, self._interfaces[identifier], address, data);
    return true;
};

/**
 * Gets the identifiers of the interfaces.
 * @returns {Array}
 */
Interop.prototype.getIdentifiers = function(){
    var self = this,
        identifiers = [];

    for(var k in self._interfaces){
        identifiers.push(k);
    }

    return identifiers;
};

module.exports = Interop;
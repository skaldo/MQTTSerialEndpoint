/**
 * Created by skaldo on 10/21/14.
 */

/*
Staring point of the application.
Creates an interop for the interfaces defined in the config.json and starts the MQTT interface.
 */

// Load the settings.
var settings = require('./config.json');
// Load the interop.
var Interop = require('./interop.js');
// Load the MQTT interface.
var MQTTInterface = require('./MQTTInterface.js');

// Create new instance of teh interop.
var interop = new Interop(settings.interfaces);

// Create new MQTT interface.
var mqtt = new MQTTInterface(interop);
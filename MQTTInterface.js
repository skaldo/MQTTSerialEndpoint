/**
 * Created by skaldo on 10/22/14.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var server = require('./server_config.json');

var mqtt = require('mqtt');

var MLUID = 1;

/*
MQTT URIs:
    MLU/:ID:/schedule
        {bus, cron, address, command}
    MLU/:ID:/execute
        {bus, address, command}
 */

/**
 * Class used to subscribe to the MQTT channel and pass the appropriate requests
 * to the interop as well as pass the received data to the MQTT broker.
 * @param interop
 * @constructor
 */
var MQTTInterface = function(interop){
    var self = this;

    self._interop = interop;

    self._interop.on("data", function(identifier, protocol, time, from, data){
        var address;

        address = from.toString('hex');
        data = data.toString('hex');

        self._client.publish('MLUs/'+MLUID+'/data/'+identifier+'/'+address, data);
        console.log(identifier, protocol, time, from, data);
    });

    self._client = mqtt.createClient(server.port, server.address);
    self._client.subscribe('MLUs/'+MLUID+'/schedule/#');
    self._client.subscribe('MLUs/'+MLUID+'/send/#');
    self._client.subscribe('MLUs/'+MLUID+'/reboot/#');

    self._client.publish('MLUs/'+MLUID+'/presence', 'MLU #'+MLUID+' connected.');

    self._client.on('message', function (topic, data) {
        data = JSON.parse(data);
        console.log(data);
        var cmd,
            topicArray;

        topic = topic.replace('MLUs/'+MLUID+'/', '');
        topicArray = topic.split('/');

        cmd = topicArray.shift();

        switch (cmd) {
            case 'schedule':
                self.onSchedule(topicArray, data);
                return;
            case 'send':
                self.onSend(topicArray, data);
                return;
            case 'reboot':
                self._client.publish('MLUs/'+MLUID, "reboot command is not supported");
                return;
            default:
                return;
        }
    })
};

util.inherits(MQTTInterface, EventEmitter);

/**
 * Callback called when a schedule command is received bz the MQTT Client.
 * @param topic
 * @param data
 */
MQTTInterface.prototype.onSchedule = function(topic, data){
    var self = this,
        identifier,
        address,
        success = false;

    identifier = topic[0];
    address = new Buffer(topic[1], 'hex');

    success = self._interop.schedule(data.cronString, identifier, address, data.data);
    self._client.publish('MLUs/'+MLUID+'/ack/schedule/'+topic[0]+'/'+topic[1], JSON.stringify(success));
};

/**
 * Callback called when a send command is received bz the MQTT Client.
 * @param topic
 * @param data
 */
MQTTInterface.prototype.onSend = function(topic, data){
    var self = this,
        identifier,
        address;

    identifier = topic[0];
    address = new Buffer(topic[1], 'hex');

    self._interop.send(identifier, address, data.data);
};

module.exports = MQTTInterface;
/**
 * Created by skaldo on 10/22/14.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var server = require('./server_config.json');

var mqtt = require('mqtt');

var sys = require('sys');
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) };

var MLUID = 1;

/*
MQTT URIs:
 MLUs/1/schedule/tbus/0/07000001
 MLUs/1/send/tbus/0/07000001
Payload:
 {"cronString":"* * * * * *","data":[1]}
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

    self._interop.on("data", function(id, protocol, time, from, data){
        var address;

        address = from.toString('hex');
        data = data.toString('hex');

        self._client.publish('MLUs/'+MLUID+'/data/'+protocol+'/'+id+'/'+address, data);
        console.log(id, protocol, time, from, data);
    });

    self._client = mqtt.createClient(server.port, server.address);
    self._client.subscribe('MLUs/'+MLUID+'/schedule/#');
    self._client.subscribe('MLUs/'+MLUID+'/send/#');
    self._client.subscribe('MLUs/'+MLUID+'/reboot/#');

    self._client.publish('MLUs/'+MLUID+'/presence', 'MLU #'+MLUID+' connected.');
    self._client.publish('MLUs/'+MLUID+'/availableCommands', JSON.stringify(['schedule', 'send', 'reboot']));

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
                self.onReboot(topicArray, data);
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
        id,
        protocolName,
        address,
        success;

    protocolName = topic[0];
    id = topic[1];
    address = new Buffer(topic[2], 'hex');

    success = self._interop.schedule(data.cronString, protocolName, id, address, data.data);
    self._client.publish('MLUs/'+MLUID+'/ack/schedule/'+topic[0]+'/'+topic[1]+'/'+topic[2], JSON.stringify(success));
};

/**
 * Callback called when a send command is received by the MQTT Client.
 * @param topic
 * @param data
 */
MQTTInterface.prototype.onSend = function(topic, data){
    var self = this,
        id,
        protocolName,
        address;

    protocolName = topic[0];
    id = topic[1];
    address = new Buffer(topic[2], 'hex');

    self._interop.send(protocolName, id, address, data.data);
};

/**
 * Callback called when a reboot command is received by the MQTT Client.
 * @param topic
 * @param data
 */
MQTTInterface.prototype.onReboot = function(topic, data){
    var self = this;

    self._client.publish('MLUs/'+MLUID+'/ack/reboot/', '');
    exec("shutdown -r now", puts);
};

module.exports = MQTTInterface;
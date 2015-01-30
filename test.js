/**
 * Created by skaldo on 11/19/14.
 */

/*
Test script, subscribes to all the topics and publish a schedule or send command.
*/

var mqtt = require('mqtt');
var server = require('./server_config.json');

var client = mqtt.createClient(server.port, server.address);

client.subscribe('#');

client.on('message', function (topic, message) {
    console.log(topic);
    console.log(message);
});

//Send command
//client.publish('MLUs/1/send/tbus1/07000001', '01');

//Schedule command
client.publish('MLUs/1/schedule/tbus1/07000001', JSON.stringify({
    cronString: "* * * * * *",
    data: [0x01]
}));

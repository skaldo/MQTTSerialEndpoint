/**
 * Created by skaldo on 11/19/14.
 */

var mqtt = require('mqtt');
var server = require('./server_config.json');

var client = mqtt.createClient(server.port, server.address);

client.subscribe('#');

client.on('message', function (topic, message) {
    console.log(topic);
    console.log(message);
});

//client.publish('MLUs/1/send/tbus1/07000001', '01');

client.publish('MLUs/1/schedule/tbus1/07000001', JSON.stringify({
    cronString: "* * * * * *",
    data: [0x01]
}));

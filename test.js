/**
 * Created by skaldo on 10/23/14.
 */

var mqtt = require('mqtt');
var server = require('./server_config.json');

var client = mqtt.createClient(server.port, server.address);

var message = {};
message.bus = 'tbus';
//message.cron = '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *';
message.cron = '* * * * * *';
message.address = new Buffer([0x07, 0x00, 0x00, 0x01]);
message.command = new Buffer([0x01]);

client.subscribe('#');

client.on('message', function (topic, message) {
    console.log(topic, message);
});

client.publish('MLUs/1/schedule/', JSON.stringify(message));


//interop.schedule("* * * * * *", 'tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);

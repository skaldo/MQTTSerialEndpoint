/**
 * Created by skaldo on 10/21/14.
 */

var settings = require('./config.json');
var Interop = require('./interop.js');
var MQTTInterface = require('./MQTTInterface.js');

var interop = new Interop(settings.interfaces);

var interface = new MQTTInterface(interop);




/*
//interop.send('tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);
interop.schedule("* * * * * *", 'tbus1', [0x07, 0x00, 0x00, 0x01], [0x01]);
interop.schedule("* * * * * *", 'tbus1', [0x07, 0x00, 0x00, 0x02], [0x01]);
*/

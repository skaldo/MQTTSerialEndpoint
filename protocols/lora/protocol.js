/**
 * Created by skaldo on 10/12/2014.
 */

/*
 * Export of the Node.js T-Bus module
 */
var proto = module.exports = function() {
    var lora = function(){};
    // mixin T-Bus class functions
    lora.__proto__ = proto;
};

proto.prepareCommand = function(dest, src, cmd, payload) {
    var command;

    src = new Buffer(src);
    dest = new Buffer(dest);
    cmd = new Buffer([cmd]);
    payload = new Buffer(payload);

    command = Buffer.concat([dest, src, cmd, payload]);
    return command;
};

/**
 * Parses the buffer or string and returns LoRa frame object
 * @param string input buffer or string
 * @returns {{sender: null, receiver: null, data: null, valid: boolean}}
 */
proto.parse = function(string) {
    var buffer,
        LoRaFrame;

    buffer = new Buffer(string);
    LoRaFrame = {
        sender: null,
        receiver: null,
        data: null,
        valid: false
    };

    // initialization of new Buffer instance in order to keep the original memory safe
    try {
        LoRaFrame.receiver = new Buffer(buffer.slice(0, 8));
        /*
        LoRaFrame.receiver = new Buffer(buffer.slice(0, 8));
        LoRaFrame.sender = new Buffer(buffer.slice(8, 17));
        LoRaFrame.data = new Buffer(buffer.slice(7, buffer.length));
        */
        LoRaFrame.data = new Buffer(buffer.slice(8, buffer.length));
        LoRaFrame.valid = true;
    }
    catch (exp){
        console.log("error while parsion LoRa frame.");
    }

    return LoRaFrame;
};
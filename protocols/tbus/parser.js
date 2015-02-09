/**
 * Created by skaldo on 2/9/2015.
 */
'use strict';

module.exports = function () {
    var syncbyte = 0x81;
    var syncByteOffset = -1;
    var frameLength = 0;
    var data = new Buffer(0);
    var getSyncByteOffset = function (buff) {
        for (var i = 0; i < buff.length; i++) {
            if (buff[i] === syncbyte) {
                return i;
            }
        }
        return -1;
    };

    return function (emitter, buffer) {
        if (syncByteOffset === -1) {
            syncByteOffset = getSyncByteOffset(buffer);
        }
        if (syncByteOffset > -1) {
            data = Buffer.concat([data, buffer]);
            // buffer contains the length data
            if (data.length > 11) {
                frameLength = 13 + data.readUInt16BE(syncByteOffset + 9);
            }
            if(data.length === frameLength){
                emitter.emit('data', data);
                frameLength = 0;
                syncByteOffset = -1;
                data = new Buffer(0);
            }
        }
    }
};
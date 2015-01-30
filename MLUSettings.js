/**
 * Created by skaldo on 10/22/14.
 */

var SerialPorts = {
    tbus: {
        //name: "/dev/ttyUSB0",
        name: "/dev/ttys005",
        //name: "/dev/tty.usbserial-AH000KNV",
        settings: {
            baudrate: 9600,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            flowControl: false,
            timeout: 1000
        }
    }
};

module.exports.serialPorts = SerialPorts;
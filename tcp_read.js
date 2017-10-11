var r=require('/Users/luca/repo/libsbp/javascript/sbp/sbp.js');
var net = require('net');
var crc16buf = require('/Users/luca/repo/libsbp/javascript/sbp/msg').crc16;
var client = new net.Socket();
var HOST='192.168.0.222';
var PORT='55555';
var validate_crc = true;

const delta_report = 0;
const SYNCWORD = '55';

var num_frames = 0;
var MAX_FRAMES = 3;

var myData = Buffer.alloc(0);

client.connect(PORT, HOST, function() {
  console.log("Client connected");
});

client.setTimeout(5000, function() {  client.destroy(); });

var offset = 0;

client.on('data', function(data) {
  myData = Buffer.concat([myData, data]);

  while ((myData.length > 8) && ((idx = myData.indexOf(SYNCWORD,0,'hex')) != -1)) {

    /* payload starts at byte 6, check we have enough data to parse it*/
    if (myData.length < idx+6) {
      break;
    }

    var msg_type = myData.readUInt16LE(idx+1);
    var len = myData.readUInt8(idx+5);
    console.log("\n\nmsg_type " + msg_type.toString(16) + " len " + len);

    /* Check we can go all the way to the CRC */
    if (myData.length < idx+8+len) {
      break;
    }

    /* Validate CRC */
    var crc16 = myData.readUInt16LE(idx+6+len);
    var mycrc = crc16buf(myData.slice(idx+1,idx+6+len));
    if (validate_crc && (crc16 != mycrc)) {
      console.err("CRC does not match! Calculated " + mycrc.toString(16)  + " read " + crc16.toString(16));
      myData = myData.slice(idx+len);
      continue;
    }

    if (msg_type == 74) {
      var tow = myData.readUInt32LE(idx+6);
      var now = Date.now();
      delta = now - tow;
      if (offset == 0) {
        offset = delta;
      }
      delta -= offset;
      delta = Math.abs(delta);
      if (delta > delta_report) {
        console.log("TOW is " + tow + " now is " + now + " delta is " + delta);
        }
    }

    myData = myData.slice(idx+len);

    num_frames++;
    if (num_frames == MAX_FRAMES) {
      process.exit(-1);
    }
  }
});

client.on('close', function() {
  console.log('Connection closed');
});

client.on('error', function(error) {
  console.log('Error Connection: ' + error);
});



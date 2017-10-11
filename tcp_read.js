var net = require('net');
var msg = require('/Users/luca/repo/libsbp/javascript/sbp/msg');
var client = new net.Socket();
var HOST='192.168.0.222';
var PORT='55555';
var validate_crc = true;

const delta_report = 0;
const SYNCWORD = '55';

const MAX_DT = 100;

var num_frames = 0;
var MAX_FRAMES = -1;

var myData = Buffer.alloc(0);

client.connect(PORT, HOST, function() {
  console.log("Client connected");
});

client.setTimeout(5000, function() {  client.destroy(); });


var last_tow = 0;
var last_time = 0;

client.on('data', function(data) {
  myData = Buffer.concat([myData, data]);

  while ((myData.length > 8) && ((idx = myData.indexOf(SYNCWORD,0,'hex')) != -1)) {

    /* payload starts at byte 6, check we have enough data to parse it*/
    if (myData.length < idx+6) {
      break;
    }

    var msg_type = myData.readUInt16LE(idx+1);
    var len = myData.readUInt8(idx+5);

    /* Check we can go all the way to the CRC */
    if (myData.length < idx+8+len) {
      break;
    }

    /* Validate CRC */
    var crc16 = myData.readUInt16LE(idx+6+len);
    var mycrc = msg.crc16(myData.slice(idx+1,idx+6+len));
    if (validate_crc && (crc16 != mycrc)) {
      console.log("CRC does not match! Calculated " + mycrc.toString(16)  + " read " + crc16.toString(16));
      console.log("len " + len);
      myData = myData.slice(idx+len);
      continue;
    }

    var sbpmsg = msg.decode(myData.slice(idx));
    //console.log(sbpmsg);

    if (sbpmsg.sbp.msg_type == 0x4a) {
      //console.log(sbpmsg.messageType);
      tow = sbpmsg.fields.header.t['tow'];
      var now = Date.now();
      if (last_tow != 0) {
        delta = tow - last_tow;
        delta_host_time = now - last_time;
        if (delta > MAX_DT || delta_host_time > MAX_DT) {
          console.log("\tERROR delta " + delta + " host_time_delta " + delta_host_time);
          console.log("\ttow " + tow + " now " + now);
        }
      }
      last_tow = tow;
      last_time = now;
    }

    myData = myData.slice(idx+len+8);

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



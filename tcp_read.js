var net = require('net');
var client = new net.Socket();
var HOST='192.168.0.222';
var PORT='55555';

var delta_report = 0;

var myData = Buffer.alloc(100);

client.connect(PORT, HOST, function() {
  console.log("Client connected");
});

client.setTimeout(5000, function() {  client.destroy(); });

var offset = 0;

client.on('data', function(data) {
  myData = Buffer.concat([myData, data]);

  while (myData.length > 8 && (i = myData.indexOf('55',0,'hex')) != -1) {
    // console.log("i is " + i);

    if (myData.length < i+8) {
      break;
    }

    var msg_type = myData.readUInt16LE(i+1);
    var len = myData.readUInt8(i+5);

    if (myData.length < i+8+len) {
      break;
    }

    // console.log("msg_type: " + msg_type.toString(16) + " length " + len);
    if (msg_type == 74) {
      var tow = myData.readUInt32LE(i+6);
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

    myData = myData.slice(i+len);
  }
});

client.on('close', function() {
  console.log('Connection closed');
});

client.on('error', function(error) {
  console.log('Error Connection: ' + error);
});



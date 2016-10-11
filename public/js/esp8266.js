ws =  null;
queryLoop = null;
var blocked;
var gcodeQueue; gcodeQueue = [];
var heap;

function initEsp8266() {
  $('#espConnectBtn').on('click', function() {
    var espIP = $('#espIp').val();
    startWS(espIP);
  });
}


function espQueue(data) {
  data = data.split('\n')
  for (i=0; i<data.length; i++) {
    addQ(data[i])
    // console.log(data[i])
  }
}

function addQ(gcode) {
  gcodeQueue.push(gcode);
}

function uploadLine() {
  if (gcodeQueue.length > 0 && !blocked) {
      var gcode = gcodeQueue.shift()
      // console.log('Sent: '  + gcode + ' Q: ' + gcodeQueue.length)
      $('#queueCnt').html('Queued: ' + gcodeQueue.length)
      lastSent = gcode
      sendGcode(gcode + '\n');
      blocked = true;
    }


}

function espUpload() {
    // espQueue("M28 "+ $('#saveasname').val() + "\n")
    g = prepgcodefile();
    espQueue(g);
    // espQueue("M29\n");
    uploadLine();
}

function stopWS() {
  // Close WS if already opened
  if (ws) {
    ws.close();
    ws = null;
  }
  $('#espConnectBtn').show();
  $('#espDisconnectBtn').hide();
}

// Start WebSocket
function startWS(url) {
  if (url === undefined )
    url = document.location.host;
  stopWS();
  ws = new WebSocket('ws://'+url+'/');
  saveSetting('espIpAddress', url);
  ws.binaryType = "arraybuffer";


  ws.onopen = function(e) {
    printLog("ESP8266 Connected to "+url, successcolor, 'wifi');
    $('#espConnectBtn').hide();
    $('#espDisconnectBtn').show();
    console.log(e);
    sendGcode('version');
    // queryLoop = setInterval(function() {
    //   // console.log('StatusChkc')
    //     sendGcode('?');
    // }, 200);
  };

  ws.onclose = function(e){
    printLog("ESP8266 closed! ", errorcolor, 'wifi');
    $('#espConnectBtn').show();
    $('#espDisconnectBtn').hide();
    console.log(e);
  };

  ws.onerror = function(e){
    printLog("ESP8266 Error! ", errorcolor, 'wifi');
    $('#espConnectBtn').show();
    $('#espDisconnectBtn').hide();
    console.log(e);
  };

  ws.onmessage = function(e){
    var data = "";
    if(e.data instanceof ArrayBuffer){
      var bytes = new Uint8Array(e.data);
      for (var i = 0; i < bytes.length; i++) {
        data += String.fromCharCode(bytes[i]);
      }
    } else {
      data = e.data;
    }
    console.log(data);

    $('#syncstatus').html('Socket OK');
    isConnected = true;
    if (data.indexOf("ok") == 0) { // Got an OK so we are clear to send
      printLog(data, '#cccccc', "wifi")
      blocked = false;
      uploadLine()
    } else if (data.indexOf('<') == 0) {
      updateStatus(data);
    } else {
      printLog(data, msgcolor, "wifi")
    }

  };
}

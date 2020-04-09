// clay
const Clay = require('pebble-clay');
const clayConfig = require('./config.json');
const clay = new Clay(clayConfig, null, { autoHandleEvents: false });
var configuration = null;

Pebble.addEventListener('showConfiguration', function(e) {
    Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
    if (e && !e.response) {
        return;
    }
    //console.log('web view closed');
    configuration = clay.getSettings(e.response, false);
    localStorage.setItem("configuration", JSON.stringify(configuration));
    //console.log(JSON.stringify(configuration));
});

Pebble.addEventListener("ready",
    function(e) {
        configuration = JSON.parse(localStorage.getItem("configuration"));
        if (configuration){
           // great 
        } else {
            Pebble.showSimpleNotificationOnPebble("Configuration Needed", "Please visit the watch face configuration page inside the Pebble phone app.");
        }
    }
);

Pebble.addEventListener('appmessage', function(e) {
    var actionText = e.payload["0"];
    sendActionToEndpoint(actionText);
    console.log("actionText");
    console.log(actionText);
});

function sendActionToEndpoint(actionText){
    var req = new XMLHttpRequest();
    console.log("Endpoint: " + configuration.EndpointURL.value);
    req.open("POST", configuration.EndpointURL.value);
    req.setRequestHeader("Content-Type", "application/json");
    req.onload = function(e) {
      if (req.readyState == 4) {
        if(req.status == 200) {
          console.log("response");
          console.log(response);
          var response = JSON.parse(req.responseText);
          if(response['actionResponse']) {
            var actionResponse = response['actionResponse'];
            Pebble.sendAppMessage({'ActionResponse':actionResponse});
          } else {
            Pebble.sendAppMessage({'ActionResponse':'I have nothing to say.'});
          }
        } else {
	    //Non-200 status code
	    console.log("endpointError::statuscode:" + req.status);
	    if (req.status == 404) {
		Pebble.sendAppMessage({'ActionResponse':'Error: I could not find the endpoint. '});
	    } else if (req.status == 403 || req.status == 401) {
		Pebble.sendAppMessage({'ActionResponse':'Error: Permission denied. Check your secret is correct.'});
	    } else {
		Pebble.sendAppMessage({'ActionResponse':'I could not get a response from the endpoint.'});
  	    }
        }
      }
    }
    req.send(JSON.stringify({
      action: actionText,
      secret: configuration.SecretPassword.value,
    }));
}
  

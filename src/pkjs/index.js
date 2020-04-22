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
    if(configuration.StartDictationOnLaunch.value) {
      Pebble.sendAppMessage({"StartDictationOnLaunch":(configuration.StartDictationOnLaunch.value ? 1 : 0)});
      console.log(configuration.StartDictationOnLaunch.value);
      console.log((configuration.StartDictationOnLaunch.value ? 1 : 0));
    }
    //console.log(JSON.stringify(configuration));
});

Pebble.addEventListener("ready",
    function(e) {
        configuration = JSON.parse(localStorage.getItem("configuration"));
        if (configuration){
           // great 
        } else {
            // Pebble.showSimpleNotificationOnPebble("Configuration Needed", "Please visit the watch face configuration page inside the Pebble phone app.");
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
          var response = JSON.parse(req.responseText);
          console.log("response");
          console.log(JSON.stringify(response));
          if(response.actionResponse && response.actionStatus) {
	    if (isNaN(response.actionStatus)) {
            	Pebble.sendAppMessage({
            	  'ActionResponse':'I reached the endpoint but the response was incomplete.',
            	  'ActionStatus': 0
            	});
	    } else {
	            Pebble.sendAppMessage({
	              'ActionResponse': response.actionResponse,
	              'ActionStatus': response.actionStatus
	            });
	    }
          } else {
            Pebble.sendAppMessage({
              'ActionResponse':'I reached the endpoint but the response was incomplete.',
              'ActionStatus': 0
            });
          }
        } else {
          //Non-200 status code
          console.log("endpointError::statuscode:" + req.status);
          if (req.status == 404) {
            Pebble.sendAppMessage({
              'ActionResponse':'Sorry, but I could not find the endpoint.',
              'ActionStatus': 3
            });
          } else if (req.status == 403 || req.status == 401) {
            Pebble.sendAppMessage({
              'ActionResponse':'Permission denied. Check to see if your secret password is correct.',
              'ActionStatus':2
            });
          } else {
            Pebble.sendAppMessage({
              'ActionResponse':'I could not get a response from the endpoint.',
              'ActionStatus':0
            });
          }
        }
      }
    }
    req.send(JSON.stringify({
      action: actionText,
      secret: configuration.SecretPassword.value,
    }));
}
  


// status codes for ActionStatus:
// 0 = generic failed
// 1 = generic success
// 2 = auth failed
// 3 = not found
// 4 = pin sent success
// 5 = calendar success
// 6 = reminder success 
// 7 = lights success
// 8 = clock / timer success
// 9 = music success
// 10 = home success
// etc
//
// I based these status codes on existing images / assets that would be convenient to implement. Try to send one of these codes. If none fit just use the generic success.

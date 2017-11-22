'use strict';

var awsIot = require('aws-iot-device-sdk');
var SerialPort = require("serialport");

var config = require('./config');
var thing_shadow = awsIot.thingShadow(config);
var status = undefined;

var port = new SerialPort.SerialPort("/dev/ttyS0", {
  parser: SerialPort.parsers.readline('\n'),
  baudrate: 9600
});


port.on("data", function (data) {
  
  if (status === undefined)
    return;
  
  try {
    var msg = JSON.parse(data);
    status = msg.status;
    var event = {"objectId": config.clientId, "event": status}
    
    var desired = {"state": {"desired": {"status": status}}};
    thing_shadow.update(config.clientId, desired);
  }
  catch (error) {
    console.log(error);
  }
});


thing_shadow.on('connect', function () {

  console.log("Connected to AWS Iot.");
  
  thing_shadow.register(config.clientId, {}, function () {
    
    console.log("Registered " + config.clientId);
    
    thing_shadow.get(config.clientId);
  });
});


thing_shadow.on('status', function (thingName, stat, clientToken, stateObject) {
  
  // console.log('1.    received ' + stat + ' on ' + thingName + ': ' +
  //     JSON.stringify(stateObject));
  var new_status = undefined; 

  if (stateObject.state == undefined)
    return;

  if (stateObject.state.reported && stateObject.state.reported.status) {
    new_status = stateObject.state.reported.status;
  }

  if (stateObject.state.desired && stateObject.state.desired.status) {
    
    new_status = stateObject.state.desired.status;
    var report = {"state": {"reported": {"status": status}, "desired": null}};
    thing_shadow.update(thingName, report);
  
  }

  // update physical status
  if (new_status !== undefined) {

    if (status === undefined || status != new_status) {
      status = new_status;
      console.log("write status: " + status);
      port.write(status + '\n');
    }
    
  }

});


thing_shadow.on('delta', function (thingName, stateObject) {
  
  // console.log('2.    delta on ' + thingName + ': ' +
  //     JSON.stringify(stateObject));

  if (stateObject.state && stateObject.state.status) {

    var report = {"state": {"reported": {"status": stateObject.state.status}, "desired": null}};
    
    thing_shadow.update(thingName, report);
    
    // update physical status
    // port.write(status);
  }

});


thing_shadow.on('close', function() {
  console.log("AWS IoT closed");
});


thing_shadow.on('error', function(err) {
  console.log(err);
});


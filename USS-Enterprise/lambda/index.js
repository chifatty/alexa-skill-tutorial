'use strict';
module.change_code = 1;

const Alexa = require('alexa-sdk');
const DatabaseHelper = require('./database_helper');
const databaseHelper = new DatabaseHelper();

const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-northeast-1'});
const iotData = new AWS.IotData({endpoint: 'your_endpoint'});

// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'your_app_Id'
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', 'Hello');
    },
    'QueryLocationIntent': function () {
        var deviceId = this.event.context.System.device.deviceId
        var $this = this
        if (deviceId) {
            databaseHelper.readMetaData(deviceId).then(function(result) {
                if (result && result.location) {
                    $this.emit(':ask', 'Current location is ' + result.location);
                }
                else {
                    var metaData = {'location': 'livingroom'};
                    databaseHelper.storeMetaData(deviceId, metaData);
                    $this.emit(':ask', 'The current location is set to livingroom');
                }
            });
        }
    },
    'ChangeLocationIntent': function () {
        var deviceId = this.event.context.System.device.deviceId;
        var $this = this
        if (this.event.request.intent &&
            this.event.request.intent.slots) {
            if (this.event.request.intent.slots.location &&
                this.event.request.intent.slots.location.value) {
                var location = this.event.request.intent.slots.location.value;
            }
        }
        if (deviceId && location) {
            var metaData = {'location': location};
            databaseHelper.readMetaData(deviceId).then(function(result) {
                if (result && result.location) {
                    databaseHelper.storeMetaData(deviceId, metaData);
                    $this.emit(':ask', 'The current location is set to ' + location);
                }
                else {
                    databaseHelper.updateMetaData(deviceId, metaData);
                    $this.emit(':ask', 'The current location is set to livingroom');
                }
            });
        }
    },
    'QueryStatusIntent': function () {
        if (this.event.request.intent &&
            this.event.request.intent.slots) {
            if (this.event.request.intent.slots.location &&
                this.event.request.intent.slots.location.value) {
                var location = this.event.request.intent.slots.location.value;
            }
            if (this.event.request.intent.slots.status &&
                this.event.request.intent.slots.status.value) {
                var status = this.event.request.intent.slots.status.value;
            }
        }
        if (status) {
            checkStatus(this, location, status);
        }
        else {
            queryStatus(this, location);
        }
    },
    'SwitchIntent': function () {
        var $this = this;
        if (!this.event.request.intent ||
            !this.event.request.intent.slots ||
            !this.event.request.intent.slots.operation ||
            !this.event.request.intent.slots.operation.value) {
            this.emit(':ask', 'Sorry, I can not understand.');
        }
        else {
            var operation = this.event.request.intent.slots.operation.value
            if (this.event.request.intent.slots.location && 
                this.event.request.intent.slots.location.value) {
                var location =  this.event.request.intent.slots.location.value
            }
            switchLight(this, operation, location);
        }
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        // this.attributes['endedSessionCount'] += 1;
        // this.emit(':saveState', true); // Be sure to call :saveState to persist your session attributes in DynamoDB
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'bye');
    }
 };

var checkStatus = function (alexa, location, status) {
    findLightsAtLocation(alexa, location, function (results, location) {
        var deviceCount = results.length;
        if (deviceCount == 0) {
            alexa.emit(':ask', 'There are no lights in the ' + location);
        }
        else {
            var params = {thingName: ''};
            var querys = new Array();
      
            results.forEach(deviceId => {
              params.thingName = deviceId;
              querys.push(iotData.getThingShadow(params).promise());
            });
            Promise.all(querys).then(results => {
                console.log(results);
                for (var i = 0; i < results.length; i++) {
                    var data = JSON.parse(results[i]["payload"]);
                    if (status == 'on' && data.state.reported.status == 'on') {
                        alexa.emit(':ask', 'Yes, The light in ' + location + ' is on');
                        return;
                    }
                    if (status == 'off' && data.state.reported.status == 'on') {
                        alexa.emit(':ask', 'No, The light in ' + location + ' is on');
                        return;
                    }
                }
                if (status == 'on') {
                    alexa.emit(':ask', 'No, The light in ' + location + ' is off');
                }
                else {
                    alexa.emit(':ask', 'Yes, The light in ' + location + ' is off');
                }
                
            }).catch (error => {
                console.log(error);
            });
        }
    });
}

var queryStatus = function (alexa, location) {
    findLightsAtLocation(alexa, location, function (results, location) {
        var deviceCount = results.length;
        if (deviceCount == 0) {
            alexa.emit(':ask', 'There are no lights in the ' + location);
        }
        else {
            var params = {thingName: ''};
            var querys = new Array();
      
            results.forEach(deviceId => {
              params.thingName = deviceId;
              querys.push(iotData.getThingShadow(params).promise());
            });
            Promise.all(querys).then(results => {
                console.log(results);
                for (var i = 0; i < results.length; i++) {
                    var data = JSON.parse(results[i]["payload"]);
                    var status = data.state.reported.status;
                    if (status == 'on') {
                        alexa.emit(':ask', 'The light in ' + location + ' is on');
                        return;
                    }
                }
                alexa.emit(':ask', 'The light in ' + location + ' is off');
            }).catch (error => {
                console.log(error);
            });
        }
    });
}

var switchLight = function (alexa, operation, location) {
    findLightsAtLocation(alexa, location, function (results, location) {
        var deviceCount = results.length;
        if (deviceCount == 0) {
            alexa.emit(':ask', 'There are no lights in the ' + location);
        }
        else {
            var payload = {state: {desired: {status: operation}}};
            var params = {payload : JSON.stringify(payload)};
            var updates = new Array();
      
            results.forEach(deviceId => {
                params.thingName = deviceId;
                updates.push(iotData.updateThingShadow(params).promise());
            });
      
            Promise.all(updates).then(result => {
                console.log(result);
                alexa.emit(':ask', 'command confirmed');
            }).catch (error => {
                console.log(error);
            });
        }
    });
 }

var findLightsAtLocation = function (alexa, location, callback) {
    if (location == undefined) {
        var deviceId = alexa.event.context.System.device.deviceId;
        databaseHelper.readMetaData(deviceId).then(function(result) {
            var location = result.location;
            if (location == undefined) {
                location = 'livingroom';
            }
            findLightsAtLocation(alexa, location, callback);
        });
    }
    else {
        databaseHelper.findLightsAtLocation(location).then(function (result) {
            callback(result, location);
        });
    }
}
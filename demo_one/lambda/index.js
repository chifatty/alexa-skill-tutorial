'use strict';
module.change_code = 1;

const Alexa = require('alexa-sdk');

// Called when the session starts.
exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'your_app_Id'
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', 'Welcome to demo one');
    },
    'HelloIntent': function () {
        var name = this.event.request.intent.slots.name.value;
        this.emit(':tell', 'Hello, ' + name);
    },
    'PlanIntent': function () {
        var intentObj = this.event.request.intent;
        if (intentObj.confirmationStatus !== 'CONFIRMED') {
            if (this.event.request.dialogState === 'STARTED') {
                this.emit(':delegate');
            } else if (this.event.request.dialogState !== 'COMPLETED'){
                this.emit(':delegate');
            } else {
                this.emit(':tell', 'Done')
            }
        }
        else {
            this.emit(':tell', 'Confirmed')
        }
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
    }
};
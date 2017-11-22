'use strict';
module.change_code = 1;

const Alexa = require('alexa-sdk');

// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'your_app_Id';
    alexa.dynamoDBTableName = 'demo_two';
    alexa.registerHandlers(newSessionHandlers, stateOneHandlers, stateTwoHandlers);
    alexa.execute();
};

var states = {
    ONE: '_ONE',
    TWO: '_TWO'
};

var newSessionHandlers = {
    'LaunchRequest': function () {
        this.emit('NewSession');
    },
    'NewSession': function() {
        if (typeof(this.attributes['name']) != 'undefined') {
            this.handler.state = states.TWO;
            console.log("this.handler.state = " + this.handler.state)
            this.emit(':ask', 'Welcome to demo two');
        }
        else {
            this.handler.state = states.ONE;
            console.log("this.handler.state = " + this.handler.state)
            this.emit(':ask', 'Welcome to demo two');
        }
    },
    'Unhandled': function() {
        this.emit('NewSession');
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.emit(':tail', 'Goodbye!');
    }
};

var stateOneHandlers = Alexa.CreateStateHandler(states.ONE, {
    'LaunchRequest': function () {
        this.emit('NewSession');
    },
    'HelloIntent': function () {
        if (this.event.request.dialogState === 'STARTED') {
            this.emit(':delegate');
        } else if (this.event.request.dialogState !== 'COMPLETED'){
            this.emit(':delegate');
        } else {
            this.handler.state = states.TWO;
            var name = this.event.request.intent.slots.name.value;
            this.attributes['name'] = name;
            this.emit(':tell', 'Hi ' + name + ', Nice to meet you, ');
        }
    },
    'ResetIntent': function () {
        this.handler.state = '';
        this.attributes['name'] = undefined;
        this.emit(':tell', 'Goodbye!')
    },
    'Unhandled': function() {
        this.handler.state = '';
        console.log("UNHANDLED");
        this.emitWithState('NewSession');
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.emit(':saveState', true);
    }
});

var stateTwoHandlers = Alexa.CreateStateHandler(states.TWO, {
    'LaunchRequest': function () {
        this.emit('NewSession');
    },
    'HelloIntent': function () {
        var name = this.attributes['name'];
        this.emit(':tell', 'Nice to see you again, ' + name);
    },
    'ResetIntent': function () {
        this.handler.state = '';
        this.attributes['name'] = undefined;
        this.emit(':tell', 'Goodbye!')
    },
    'Unhandled': function() {
        this.handler.state = '';
        console.log("UNHANDLED");
        this.emitWithState('NewSession');
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.emit(':saveState', true);
    }
});

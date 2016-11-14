require('node-import');
imports('config/index');

var express = require('express');
var moment = require('moment');
var router = express.Router();
const leave_status = require('../service/leave/status');
var leave = require('../service/leave/apply');
var _session = require('../service/session');
var cancel_leave = require('../service/leave/cancel');
var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token, {
    logLevel: 'error',
    dataStore: new MemoryDataStore()
});

rtm.start();

// Wait for the client to connect
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    var user = rtm.dataStore.getUserById(rtm.activeUserId);
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);
    console.log('Connected to ' + team.name + ' as ' + user.name);
});

var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    var time = moment().format('h:mm:ss');
    var user = rtm.dataStore.getUserById(message.user);
    if (user == undefined) {
        return;
    }
//    var setId = user.name;
    var dm = rtm.dataStore.getDMByName(user.name);
    if (dm == undefined) {
        return;
    }

    if (!_session.exists(user.name)) {
        _session.start(user.name);
    }
    var text = message.text;
    if (!_session.get(user.name, 'command')) {
        _session.set(user.name, 'command', message.text);
        text = false;
    }

    var _command = _session.get(user.name, 'command');
    if (_command == 'hello' || _command == 'hi' || _command == 'helo' || _command == 'hey') {
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
    } else if (_command == 'leave') {
        

        if(text){
              if (!_session.get(user.name, 'sub_command')) {
                    _session.set(user.name, 'sub_command', text);
                }
                        var _subCommand = _session.get(user.name, 'sub_command');
                        if (_subCommand == 'apply') {
                            var id = message.user;
                            leave._apply(message, dm, id, time, rtm, user, function (response) {
                            });
                        } else if ( _subCommand == 'status') {
                            leave_status.fetch(message, dm, rtm, function (req, response, msg) {
                            });
                        }
                 
            
        }else{
            rtm.sendMessage('These are the different options for you: \n 1. apply \n 2. status', dm.id);
        }
        
       
    } else if (_command == 'help') {
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (_command == 'cancel') {
        var id = message.user;
        cancel_leave.cancel(message, dm, id, time, rtm, user, function (req, response, msg) {
        });
    } else {
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options" + '.', dm.id);
    }
});

module.exports = router;

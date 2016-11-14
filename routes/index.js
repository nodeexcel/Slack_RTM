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

    if (!_session.get(user.name, 'command')) {
        _session.set(user.name, 'command', message.text);
    }

    var _command = _session.get(user.name, 'command');
    if (_command == 'hello' || _command == 'hi' || _command == 'helo' || _command == 'hey') {
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
    } else if (_command == 'leave') {
        rtm.sendMessage('These are the different options for you: \n 1. apply \n 2. status', dm.id);
        var _subCommand = _session.get(user.name, 'sub_command');
        if (message.text == 'apply' || _subCommand == 'apply') {
            if (!_session.get(user.name, 'sub_command')) {
                _session.set(user.name, 'sub_command', message.text);
            }
            var id = user.name;
            leave._apply(message, dm, id, rtm, user, function (response) {
            });
        } else if (message.text == 'status' || _subCommand == 'apply') {
            if (!_session.get(user.name, 'sub_command')) {
                _session.set(user.name, 'sub_command', message.text);
            }
            leave_status.fetch(message, dm, rtm, function (req, response, msg) {
            });
        }
    } else if (_command == 'help') {
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (_command == 'cancel') {
        var id = user.name;
        cancel_leave.cancel(message, dm, id, rtm, user, function (req, response, msg) {
        });
    } else {
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options" + '.', dm.id);
    }
});

module.exports = router;
require('node-import');
imports('config/index');

var express = require('express');
var router = express.Router();
var leave_status = require('../service/leave/status');
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

    if (!_session.exists(message.user)) {
        _session.start(message.user);
    }
    var text = message.text;
    if (!_session.get(message.user, 'command')) {
        _session.set(message.user, 'command', message.text);
        text = false;
    }

    var _command = _session.get(message.user, 'command');
    if (_command == 'hello' || _command == 'hi' || _command == 'helo' || _command == 'hey') {
        _session.touch(message.user);
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
    } else if (_command == 'leave') {
        _session.touch(message.user);
        if (text) {
            if (!_session.get(message.user, 'sub_command')) {
                _session.set(message.user, 'sub_command', text);
            }
            var _subCommand = _session.get(message.user, 'sub_command');
            if (_subCommand == 'apply') {
                var id = message.user;
                leave._apply(message, dm, id, rtm, user, function (response) {
                });
            } else if (_subCommand == 'status') {
                leave_status.fetch(message, dm, rtm, function (req, response, msg) {
                });
            }
        } else {
            rtm.sendMessage('These are the different options for you: \n 1. apply \n 2. status', dm.id);
        }
    } else if (_command == 'help') {
        _session.touch(message.user);
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (_command == 'cancel') {
        _session.touch(message.user);
        var id = message.user;
        cancel_leave.cancel(message, dm, id, rtm, user, function (req, response, msg) {
        });
    } else {
        _session.touch(message.user);
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options" + '.', dm.id);
    }
});

module.exports = router;

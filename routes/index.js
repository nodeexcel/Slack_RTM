require('node-import');
imports('config/index');

var express = require('express');
var moment = require('moment');
var router = express.Router();
var leave_status = require('../service/leave/status');
var leave = require('../service/leave/apply');
var _session = require('../service/session');
var cancel_leave = require('../service/leave/cancel');
var _checkUser = require('../service/isAdmin');
var _users = require('../service/leave/users');
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
    var dm = rtm.dataStore.getDMByName(user.name);
    if (dm == undefined) {
        return;
    }
    var setId = dm.id;
    if (!_session.exists(setId)) {
        _session.start(setId);
    }
    _session.set(setId, 'rtm', rtm);
    var text = message.text;
    if (text == 'exit') {
        _session.destroy(setId, rtm);
        return;
    }
    if (!_session.get(setId, 'command')) {
        _session.set(setId, 'command', message.text);
        text = false;
    }
    var _command = _session.get(setId, 'command');
    if (_command == 'hello' || _command == 'hi' || _command == 'helo' || _command == 'hey') {
        _session.touch(setId);
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
    } else if (_command == 'leave') {
        _session.touch(setId);
        var _role = _session.get(setId, 'role');
        if (text) {
            if (!_session.get(setId, 'sub_command')) {
                _session.set(setId, 'sub_command', text);
            }
            var _subCommand = _session.get(setId, 'sub_command');
            if (_subCommand == 'apply') {
                leave._apply(message, dm, setId, rtm, user, function (response) {
                });
            } else if (_subCommand == 'status') {
                leave_status.fetch(message, dm, setId, rtm, function (req, response, msg) {
                });
            } else if (_subCommand == 'users' && (_role == 'admin' || _role == 'hr')) {
                _users.userDetail(message, dm, setId, rtm, function (res) {
                });
            } else {
                _session.set(setId, 'sub_command', false);
                rtm.sendMessage("I don't understand" + " " + message.text + ". So please choose from above options.", dm.id);
            }
        } else {
            if (!_session.get(setId, 'role')) {
                _checkUser.checkType('U0FJMLYR1', function (res) {
                    _session.set(setId, 'role', res['U0FJMLYR1'].role);
                    _role = _session.get(setId, 'role');
                    if (_role == 'admin' || _role == 'hr') {
                        rtm.sendMessage('These are more options for you: \n 3. users', dm.id);
                    }
                });
            }
            rtm.sendMessage('These are the different options for you: \n 1. apply \n 2. status', dm.id);
        }
    } else if (_command == 'help') {
        _session.touch(setId);
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (_command == 'cancel') {
        _session.touch(setId);
        cancel_leave.cancel(message, dm, setId, rtm, user, function (req, response, msg) {
        });
    } else {
        _session.touch(setId);
        _session.set(setId, 'command', false);
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options" + '.', dm.id);
    }
});

module.exports = router;

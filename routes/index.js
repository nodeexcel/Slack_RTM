require('node-import');
imports('config/index');
var express = require('express');
var router = express.Router();
var _leaveStatus = require('../service/leave/status');
var leave = require('../service/leave/apply');
var _session = require('../service/session');
var _cancelLeave = require('../service/leave/cancel');
var _checkUser = require('../service/isAdmin');
var _users = require('../service/leave/users');
var _summary = require('../service/leave/summary');
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
        _session.destroy(setId, rtm, 'Goodbye!');
        return;
    }
    if (!_session.get(setId, 'command')) {
        _session.set(setId, 'command', message.text);
        text = false;
    }
    var _command = _session.get(setId, 'command');
    if (_command == 'hello' || _command == 'hi' || _command == 'helo' || _command == 'hey' || _command == 'help') {
        _session.touch(setId);
        _session.set(setId, 'command', false);
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (_command == 'leave') {
        _session.touch(setId);
        var _role = _session.get(setId, 'role');
        if (text) {
            if (!_session.get(setId, 'sub_command')) {
                _session.set(setId, 'sub_command', text);
            }
            var _subCommand = _session.get(setId, 'sub_command');
            if (_subCommand == 'apply') {
                _session.touch(setId);
                leave._apply(message, dm, setId, rtm, user, function (response) {
                });
            } else if (_subCommand == 'status') {
                rtm.sendMessage('Please Wait..', dm.id);
                _session.touch(setId);
                _leaveStatus.getLeaveStatus(message, dm, setId, rtm, function (req, response, msg) {
                });
            } else if (_subCommand == 'cancel') {
                rtm.sendMessage('Please Wait..', dm.id);
                _session.touch(setId);
                _cancelLeave.cancel(_role, message, dm, setId, rtm, user, function (req, response, msg) {
                });
            } else if (_subCommand == 'users' && (_role == 'admin' || _role == 'hr')) {
                _session.touch(setId);
                _users.userDetail(message, dm, setId, rtm, function (res) {
                });
            } else if (_subCommand == 'summary' && (_role == 'admin' || _role == 'hr')) {
                _session.touch(setId);
                _summary.userSummary(message, dm, setId, rtm, function (res) {
                });
            } else {
                _session.touch(setId);
                _session.set(setId, 'sub_command', false);
                rtm.sendMessage("I don't understand" + " " + message.text + ". So please choose from given options.", dm.id);
            }
        } else {
            _session.touch(setId);
            rtm.sendMessage('These are the different options for you: \n 1. apply (Apply leave using this option) \n 2. status (Check the status of your leaves using this option) \n 3. cancel (Cancel your leaves using this option)', dm.id);
            if (!_session.get(setId, 'role')) {
                _session.touch(setId);
                _checkUser.checkType(message.user, function (res) {
                    _session.touch(setId);
                    _session.set(setId, 'role', res[message.user].role);
                    _role = _session.get(setId, 'role');
                    if (_role == 'admin' || _role == 'hr') {
                        _session.touch(setId);
                        rtm.sendMessage('Since your an ' + _role + ', there more options for you: \n 4. users (Reject, cancel or see status of users using this option) \n 5. summary (show upcoming leaves)', dm.id);
                    }
                });
            }
        }
    } else {
        _session.touch(setId);
        _session.set(setId, 'command', false);
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options.", dm.id);
    }
});

module.exports = router;

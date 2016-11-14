require('node-import');
imports('config/index');

var express = require('express');
var moment = require('moment');
var router = express.Router();
const leave_status = require('../service/leave/status');
var leave = require('../service/leave/apply');
var to_session = require('../service/session');
var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token, {
    logLevel: 'error',
    dataStore: new MemoryDataStore()
});

rtm.start();

var p = 0;

// Wait for the client to connect
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    var user = rtm.dataStore.getUserById(rtm.activeUserId);
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);
    console.log('Connected to ' + team.name + ' as ' + user.name);
});

var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    var time = moment().format('h:mm:ss');
    var user = rtm.dataStore.getUserById(message.user)
    if (user == undefined) {
        return;
    }
    var dm = rtm.dataStore.getDMByName(user.name);
    if (dm == undefined) {
        return;
    }
    var dateFormat = "DD-MM-YYYY";
    var date = moment(message.text, dateFormat, true).isValid();
    console.log(p + "::::: msg");
    if (p == 0) {
        to_session.start(id, time);
    }
    to_session.set(id, 'command', message.text);
    var result = to_session.get(id, 'command');
    if (result == 'hello' || result == 'hi' || result == 'helo' || result == 'hey') {
        rtm.sendMessage('hello ' + user.name + '!', dm.id);
    } else if (result == 'leave') {
        rtm.sendMessage('These are the different options for you: \n 1. apply \n 2. status', dm.id);
    } else if (result == 'help') {
        rtm.sendMessage('These are the different options for you: \n 1. leave', dm.id);
    } else if (result == 'status' || p == 1) {
        p = 1;
        leave_status.fetch(message, dm, rtm, function (req, response, msg) {
        });
    } else if (result == 'apply' || p == 2) {
        p = 2;
        var id = message.user;
        leave._apply(message, dm, id, date, time, rtm, user, function (response) {
            p = response * 1;
        });
    } else {
        rtm.sendMessage("I don't understand" + " " + message.text + ". " + "Please use 'help' to see all options" + '.', dm.id);
    }
});

module.exports = router;
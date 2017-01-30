var _session = require('../session');
var moment = require('moment');
var request = require('request');
require('node-import');
imports('config/index');

exports._lunch_start = function (message, dm, id, rtm, user, _subCommand, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'lunch_break', lunch: _subCommand, "userslack_id": user.id}
    }, function (error, response, body) {
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
        } else {
            var p = JSON.parse(body);
            rtm.sendMessage(user.name + '! ' + p.data, dm.id);
            _session.destroy(id, rtm, 'You have completed your task successfully!!');
        }
    });
};
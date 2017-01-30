var _session = require('../session');
var moment = require('moment');
var request = require('request');
var _ = require('lodash');
require('node-import');
imports('config/index');

exports._get_lunch_stats = function (message, dm, id, rtm, user, _subCommand, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": _subCommand, "userslack_id": 'U0FJZ0KDM'}
    }, function (error, response, body) {
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
        } else {
            var p = JSON.parse(body);
            if (p.error == 1) {
                rtm.sendMessage(user.name + '! ' + p.data.message, dm.id);
            } else {
                _.forEach(p.data, function (value, key) {
                    rtm.sendMessage(value, dm.id)

                });
                _session.destroy(id, rtm, 'You have completed your task successfully!!');
            }
        }
    });
};
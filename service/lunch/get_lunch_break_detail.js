var _session = require('../session');
var moment = require('moment');
var request = require('request');
require('node-import');
imports('config/index');

exports._get_lunch_break_detail = function (message, dm, id, rtm, user, _subCommand, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": _subCommand, "userslack_id": user.id}
    }, function (error, response, body) {
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
        } else {
            var p = JSON.parse(body);
            if (p.error == 1) {
                rtm.sendMessage(user.name + '! ' + p.data.message, dm.id);
            } else {
                rtm.sendMessage(user.name + '! ', dm.id);
                for (i = 0; i < p.data.length; i++) {
                    rtm.sendMessage('your lunch start at ' + p.data[i].lunch_start + ' and lunch end at ' + p.data[i].lunch_start, dm.id);
                }
                _session.destroy(id, rtm, 'You have completed your task successfully!!');
            }
        }
    });
};
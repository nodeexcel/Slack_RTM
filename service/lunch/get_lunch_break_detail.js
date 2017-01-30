var _session = require('../session');
var moment = require('moment');
var request_send = require('../slack/send');
require('node-import');
imports('config/index');

exports._get_lunch_break_detail = function (message, dm, id, rtm, user, _subCommand, callback) {
    url = config.leaveApply_API_URL;
    paramaters = {"action": _subCommand, "userslack_id": 'U0FJZ0KDM'};
    request_send.cancel(message, paramaters, url, function (response, error, msg) {
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
        } else {
            var p = JSON.parse(response);
             if (p.error == 1) {
                rtm.sendMessage(user.name + '! ' + p.data.message, dm.id);
            } else {
                rtm.sendMessage(user.name + '! ', dm.id);
                for (i = 0; i < p.data.length; i++) {
                    rtm.sendMessage('your lunch start at ' + p.data[i].lunch_start + ' and lunch end at ' + p.data[i].lunch_start + ' and total time is ' +p.data[i].total_time +'min', dm.id);
                }
                _session.destroy(id, rtm, 'You have completed your task successfully!!');
            }
        }
    });
};
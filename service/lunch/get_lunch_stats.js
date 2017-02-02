var _session = require('../session');
var moment = require('moment');
var request_send = require('../slack/send');
var _ = require('lodash');
require('node-import');
imports('config/index');

exports._get_lunch_stats = function (message, dm, id, rtm, user, _subCommand, callback) {
    url = config.leaveApply_API_URL;
    paramaters = {"action": _subCommand, "userslack_id": 'U0FJQUFMG'};
    request_send.cancel(message, paramaters, url, function (response, error, msg) {
        var records = '';
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
            _session.destroy(id, rtm, "You have not completed your task successfully!! Please use 'help' to see all options.");
        } else {
            var p = JSON.parse(response);
            if (p.error == 1) {
                if (p.data.message) {
                    rtm.sendMessage(user.name + '! ' + p.data.message, dm.id);
                } else {
                    rtm.sendMessage(user.name + '! ' + p.message, dm.id);
                }
                _session.destroy(id, rtm, "You have not completed your task successfully!! Please use 'help' to see all options.");
            } else {
                _.forEach(p.data, function (value, key) {
                    records = records + value + '\n';
                });
                rtm.sendMessage(records, dm.id);
                _session.destroy(id, rtm, 'You have completed your task successfully!!');
            }
        }
    });
};
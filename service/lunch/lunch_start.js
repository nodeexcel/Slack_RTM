var _session = require('../session');
var moment = require('moment');
var request_send = require('../slack/send');
require('node-import');
imports('config/index');

exports._lunch_start = function (message, dm, id, rtm, user, _subCommand, callback) {
    url = config.leaveApply_API_URL;
    paramaters = {"action": 'lunch_break', lunch: _subCommand, "userslack_id": user.id};
    request_send.cancel(message, paramaters, url, function (response, error, msg) {
        if (error) {
            rtm.sendMessage('oops! some error occured', dm.id);
        } else {
            console.log( response );
            var p = JSON.parse(response);
            console.log( p );
            console.log( user.name + '! ' + p.data, dm.id );
            rtm.sendMessage(user.name + '! ' + p.data, dm.id);
            _session.destroy(id, rtm, 'You have completed your task successfully!!');
        }
    });
};
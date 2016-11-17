var request = require('request');
require('node-import');
imports('config/index');

exports.leaveApply = function (id, from, to, number_of_day, reason, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'apply_leave', "userslack_id": id, "from_date": from,
            "to_date": to, "no_of_days": number_of_day, "reason": reason}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var p = JSON.parse(body);
            callback(p.error);
        }
    });
};
var request = require('request');
require('node-import');
imports('config/index');

exports.checkType = function (id, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'get_role_from_slackid', "userslack_id": id}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};

exports.userList = function (id, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'get_enable_user', "userslack_id": id}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};

exports.getUserLeave = function (id, user_id, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'get_all_leaves_of_user', "userslack_id": id, "user_id": user_id}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};

exports.cancelLeave = function (id, user_id, date, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'cancel_applied_leave_admin', "userslack_id": id, "user_id": user_id, "date": date}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};
require('node-import');
imports('config/index');
var request = require('request');
var cache = {};

exports.checkType = function (id, callback) {
    if (cache[id]) {
        callback(cache);
    } else {
        cache[id] = {};
        request({
            url: config.leaveApply_API_URL, //URL to hit
            method: 'GET',
            qs: {"action": 'get_role_from_slackid', "userslack_id": id}
        }, function (error, response, body) {
            if (error) {
                callback(error);
            } else {
                var res = JSON.parse(body);
//                callback(res);
                cache[id]['role'] = res.role.toLowerCase();
                callback(cache);
            }
        });
    }

};

exports.userList = function (id, callback) {
    if (cache[id]['userList'] != undefined) {
        callback(cache);
    } else {
        request({
            url: config.leaveApply_API_URL, //URL to hit
            method: 'GET',
            qs: {"action": 'get_enable_user', "userslack_id": id}
        }, function (error, response, body) {
            if (error) {
                callback(error);
            } else {
                var res = JSON.parse(body);
//                callback(res);
                cache[id]['userList'] = res;
                callback(cache);
            }
        });
    }
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

exports.approveLeave = function (id, leaveId, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'approve_decline_leave_of_user', "userslack_id": id, "leave_id": leaveId, "leave_status": 'Approved'}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};

exports.allLeaves = function (id, callback) {
    request({
        url: config.leaveApply_API_URL, //URL to hit
        method: 'GET',
        qs: {"action": 'get_user_current_status', "userslack_id": id}
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            var res = JSON.parse(body);
            callback(res);
        }
    });
};
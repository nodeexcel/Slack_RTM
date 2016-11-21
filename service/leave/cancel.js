require('node-import');
imports('config/index');
var request = require('request');
var request_send = require('../slack/send');
var _session = require('../session');
var moment = require('moment');

exports.cancel = function (role, message, dm, id, rtm, user, callback) {
    var _task = _session.get(id, 'task');
    if (!_task) {
//        rtm.sendMessage('Please wait..', dm.id);
        var pending_message = '';
        request({
            url: config.leaveApply_API_URL, //URL to hit
            method: 'POST',
            qs: {"action": 'get_my_leaves', "userslack_id": message.user}
        }, function (error, response, body) {
            if (error) {
                callback(error);
            } else {
                if (body == '') {
                    rtm.sendMessage("You don't have any upcoming leaves", dm.id);
                } else {
                    var allData = JSON.parse(body);
                    if (allData.data && allData.data.leaves) {
                        for (i = 0; i < allData.data.leaves.length; i++) {
                            var leaveFrom = allData.data.leaves[i].from_date;
                            var leaveTo = allData.data.leaves[i].to_date;
                            var leaveStatus = allData.data.leaves[i].status;
                            var myFrom = moment(leaveFrom, 'DD-MMMM-YYYY').format('Do MMM YYYY');
                            var myTo = moment(leaveTo, 'DD-MMMM-YYYY').format('Do MMM YYYY');
                            if (leaveStatus.toLowerCase() == "pending") {
                                pending_message = pending_message + 'Leave from: ' + myFrom + ' to: ' + myTo + '\n';
                            }
                        }
                        if (pending_message != '') {
                            url = config.url_chat;
                            var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Pending", "text":"' + pending_message + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                            request_send.message(message, paramaters, pending_message, url, function (response, error, msg) {
                                var res = JSON.parse(response);
                                if (res.ok == true) {
                                    rtm.sendMessage(user.name + '!' + ' can you please provide me the details \n from (DD-MM-YYYY) ', dm.id);
                                    _session.set(id, 'task', 'from');
                                } else if (res.ok == false) {
                                    rtm.sendMessage("invalid information", dm.id);
                                }
                            });
                        } else {
                            rtm.sendMessage("You don't have any pending leave", dm.id);
                            _session.destroy(id, rtm, 'You have completed your task successfully!!');
                            callback(0);
                        }
                    } else {
                        rtm.sendMessage('Oops! Some error occurred. We are looking into it. In the mean time you can check your leave status of HR system.', dm.id);
                    }
                }
            }
        });
    } else if (_task) {
        var paramaters = {};
        if (role == 'admin' || role == 'hr') {
            if (_task == 'from') {
                var dateFormat = "DD-MM-YYYY";
                var date = moment(message.text, dateFormat, true).isValid();
                if (date) {
                    _session.touch(id);
                    _session.set(id, 'from', message.text);
                    _session.set(id, 'task', 'userId');
                    rtm.sendMessage('Please enter your user id: ', dm.id);
                } else {
                    _session.touch(id);
                    rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
                }
            } else if (_task == 'userId') {
                _session.touch(id);
                var getFrom = _session.get(id, 'from');
                _session.set(id, 'userId', message.text);
                var userId = _session.get(id, 'userId');
                var myFromDate = moment(getFrom, 'DD-MM-YYYY').format('YYYY-MM-DD');
                url = config.leaveApply_API_URL;
                paramaters = {"action": 'cancel_applied_leave_admin', "userslack_id": message.user, "user_id": userId, "date": myFromDate};
                request_send.cancel(message, paramaters, url, function (response, error, msg) {
                    var resp = JSON.parse(response);
                    if (resp.error == 0) {
                        _session.set(id, 'task', false);
                        _session.set(id, 'sub_command', false);
                        rtm.sendMessage('Your applied leave for ' + getFrom + ' has been cancelled.', dm.id);
                        _session.destroy(id, rtm, 'You have completed your task successfully!!');
                        callback(0);
                    } else if (resp.error == 1) {
                        _session.set(id, 'task', false);
                        _session.set(id, 'sub_command', false);
                        rtm.sendMessage(resp.data.message, dm.id);
                        _session.destroy(id, rtm, "You have not completed your task successfully!! Please use 'help' to see all options.");
                        callback(0);
                    }
                });
            } else {
                _session.touch(id);
                _session.set(id, 'task', false);
                rtm.sendMessage("I don't understand" + " " + message.text + ". So please choose from above options.", dm.id);
            }
        } else {
            if (_task == 'from') {
                var dateFormat = "DD-MM-YYYY";
                var date = moment(message.text, dateFormat, true).isValid();
                if (date) {
                    _session.touch(id);
                    _session.set(id, 'from', message.text);
                    var getFrom = _session.get(id, 'from');
                    var myFromDate = moment(getFrom, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    url = config.leaveApply_API_URL;
                    paramaters = {"action": 'cancel_applied_leave', "userslack_id": message.user, "date": myFromDate};
                    request_send.cancel(message, paramaters, url, function (response, error, msg) {
                        var resp = JSON.parse(response);
                        if (resp.error == 0) {
                            _session.set(id, 'task', false);
                            _session.set(id, 'sub_command', false);
                            rtm.sendMessage('Leave applied has been cancelled.', dm.id);
                            _session.destroy(id, rtm, 'You have completed your task successfully!!');
                            callback(0);
                        } else if (resp.error == 1) {
                            _session.set(id, 'task', false);
                            _session.set(id, 'sub_command', false);
                            rtm.sendMessage(resp.data.message, dm.id);
                            _session.destroy(id, rtm, 'You have not completed your task successfully!!');
                            callback(0);
                        }
                    });
                } else {
                    _session.touch(id);
                    rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
                }
            } else {
                _session.touch(id);
                _session.set(id, 'task', false);
                rtm.sendMessage("I don't understand" + " " + message.text + ". So please choose from above options.", dm.id);
            }
        }
    }
};
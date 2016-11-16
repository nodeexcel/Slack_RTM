var request = require('request');
var request_send = require('../slack/send');
var _session = require('../session');
var moment = require('moment');
require('node-import');
imports('config/index');

exports.cancel = function (role, message, dm, id, rtm, user, callback) {
    var _task = _session.get(id, 'task');
    console.log('------------');
    console.log(_task);
    if (!_task) {
        rtm.sendMessage('Please wait..', dm.id);
        var pending_message = '';
        request({
            url: config.leaveApply_API_URL, //URL to hit
            method: 'POST',
            qs: {"action": 'get_my_leaves', "userslack_id": 'U0FJMLYR1'}
        }, function (error, response, body) {
            if (error) {
                callback(error);
            } else {
                if (body == '') {
                    rtm.sendMessage("You don't have any upcoming leaves", dm.id);
                } else {
                    var data1 = JSON.parse(body);
                    if (data1.data && data1.data.leaves) {
                        for (i = 0; i < data1.data.leaves.length; i++) {
                            var leaveFrom = data1.data.leaves[i].from_date;
                            var leaveTo = data1.data.leaves[i].to_date;
                            var leaveStatus = data1.data.leaves[i].status;
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
                                    _session.start(id);
                                    _session.set(id, 'task', 'from');
                                } else if (res.ok == false) {
                                    rtm.sendMessage("invalid information", dm.id);
                                }
                            });
                        }
                    } else {
                        rtm.sendMessage('Oops! Some error occurred. We are looking into it. In the mean time you can check your leave status of HR system.', dm.id);
                    }
                }
            }
        });
    } else if (_task) {
        if (_task == 'from') {
            var dateFormat = "DD-MM-YYYY";
            var date = moment(message.text, dateFormat, true).isValid();
            if (date) {
                _session.touch(id);
                _session.set(id, 'from', message.text);
                var getFrom = _session.get(id, 'from');
                var myFromDate = moment(getFrom, 'DD-MM-YYYY').format('YYYY-MM-DD');
                if (myFromDate != '') {
                    url = config.leaveApply_API_URL;
                    var action = '';
                    if (role == 'admin' || role == 'hr') {
                        _session.set(id, 'task', 'setUserId');
                        action = 'cancel_applied_leave';
                    } else {
                        action = 'cancel_applied_leave_admin';
                    }
                    var paramaters = {"action": action, "userslack_id": 'U0FJMLYR1', "date": myFromDate};
                    request_send.cancel(message, paramaters, url, function (response, error, msg) {
                        var resp = JSON.parse(response);
                        if (resp.error == 1) {
                            _session.destroy(id, rtm, resp.data.message);
                            rtm.sendMessage(resp.data.message, dm.id);
                            callback(0);
                        } else if (resp.error == 0) {
                            _session.destroy(id, rtm, resp.data.message);
                            rtm.sendMessage(resp.data.message, dm.id);
                            callback(0);
                        }
                    });
                }
            } else {
                _session.touch(id);
                rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
            }
        } else if (_task == 'setUserId') {
            _session.touch(id);
            _session.set(id, 'setUserId', message.text);
        } else {
            rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
        }
    }
};
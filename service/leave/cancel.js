var request = require('request');
const request_send = require('../slack/send');
var to_session = require('../session');
var moment = require('moment');
require('node-import');
imports('config/index');

exports.cancel = function (message, dm, id, date, time, rtm, user, callback) {
    to_session.exists(function (res) {
        var check_session = res[id] ? true : false;
        if (!check_session) {
            var pending_message = '';
            request({
                url: config.url, //URL to hit
                method: 'POST',
                qs: {"action": 'get_my_leaves', "userslack_id": message.user}
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
                                var leave = data1.data.leaves[i].from_date;
                                var leave1 = data1.data.leaves[i].to_date;
                                var leave2 = data1.data.leaves[i].status;
                                if (data1.data.leaves[i].status == "Pending") {
                                    pending_message = pending_message + 'Leave from: ' + data1.data.leaves[i].from_date + ' to: ' + data1.data.leaves[i].to_date + '\n';
                                }
                            }
                            if (pending_message != '') {
                                url = config.url_chat;
                                var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Pending", "text":"' + pending_message + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                                request_send.message(message, paramaters, pending_message, url, function (response, error, msg) {
                                    var res = JSON.parse(response);
                                    if (res.ok == true) {
                                        rtm.sendMessage(user.name + '!' + ' can you please provide me the details \n from (DD-MM-YYYY) ', dm.id);
                                        to_session.start(id, time, callback);
                                        to_session.set(id, 'command', 'from');
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
        } else if (check_session) {
            var result = to_session.get(id, 'command');
            if (result == 'from') {
                if (date) {
                    to_session.touch(id);
                    to_session.set(id, 'from', message.text);
                    var getFrom = to_session.get(id, 'from');
                    var myFromDate = moment(getFrom, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    if (myFromDate != '') {
                        url = config.leaveApply_API_URL;
                        var paramaters = {"action": 'cancel_applied_leave', "userslack_id": message.user, "date": myFromDate};
                        request_send.cancel(message, paramaters, url, function (response, error, msg) {
                            var resp = JSON.parse(response);
                            if (resp.error == 1) {
                                to_session.destory(id);
                                rtm.sendMessage(resp.data.message, dm.id);
                                callback(0);
                            } else if (resp.error == 0) {
                                to_session.destory(id);
                                rtm.sendMessage(resp.data.message, dm.id);
                                callback(0);
                            }
                        });
                    }
                }
            } else {
                rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
            }
        }
    });
};
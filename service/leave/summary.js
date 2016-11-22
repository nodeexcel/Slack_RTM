require('node-import');
imports('config/index');
var _session = require('../session');
var _user = require('../isAdmin');
var request_send = require('../slack/send');
var moment = require('moment');
var async = require("async");
var _underscore = require('underscore');

exports.userSummary = function (message, dm, id, rtm, callback) {
    var leaveListApprove = '', leaveListCancel = '', leaveListPending = '';
    var url = config.url_chat;
    var task = _session.get(id, 'task');
    if (!task) {
        var p = 0;
        rtm.sendMessage('Please Wait..', dm.id);
        _session.touch(id);
        _user.allLeaves(message.user, function (res) {
            _session.touch(id);
            if (res.error == 0) {
                _session.touch(id);
                var allkeys = _underscore.keys(res.data);
                if (allkeys.length > 0) {
                    p++;
                    for (var a = 0; a < allkeys.length; a++) {
                        var myKey = allkeys[a];
                        var allUserLeaves = res.data[myKey];
                        for (var b = 0; b < allUserLeaves.length; b++) {
                            var row = allUserLeaves[b];
                            var leaveFrom = moment(row.from_date, 'YYYY-MM-DD').format('Do MMM YYYY');
                            var leaveTo = moment(row.to_date, 'YYYY-MM-DD').format('Do MMM YYYY');
                            if (row.status == 'Cancelled Request') {
                                leaveListCancel = leaveListCancel + p + ') ' + myKey + ' ' + leaveFrom + ' to: ' + leaveTo + '\n';
                                p++;
                            } else if (row.status == 'Pending') {
                                leaveListPending = leaveListPending + p + ') ' + myKey + ' ' + leaveFrom + ' to: ' + leaveTo + '\n';
                                p++;
                            } else if (row.status == 'Approved') {
                                leaveListApprove = leaveListApprove + p + ') ' + myKey + ' ' + leaveFrom + ' to: ' + leaveTo + '\n';
                                p++;
                            }
                        }
                    }
                    async.parallel([
                        function (callback) {
                            _session.touch(id);
                            if (leaveListApprove != '') {
                                var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Approved", "text":"' + leaveListApprove + '", "fallback": "Message Send to Employee","color": "#36a64f"}]'};
                                request_send.message(message, paramaters, leaveListApprove, url, function (error, response, msg) {
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        }, function (callback) {
                            _session.touch(id);
                            if (leaveListPending != '') {
                                var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Pending", "text":"' + leaveListPending + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                                request_send.message(message, paramaters, leaveListPending, url, function (error, response, msg) {
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        }, function (callback) {
                            _session.touch(id);
                            if (leaveListCancel != '') {
                                var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Cancelled", "text":"' + leaveListCancel + '", "fallback": "Message Send to Employee","color": "#F2801D"}]'};
                                request_send.message(message, paramaters, leaveListCancel, url, function (error, response, msg) {
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        }
                    ], function (err) {
                        if (err) {
                            rtm.sendMessage(err, dm.id);
                        } else {
                            _session.touch(id);
                            _session.destroy(id, rtm, 'You have completed your task successfully!!');
                            callback(0);
                        }
                    });
                } else {
                    _session.destroy(id, rtm, "No leaves available!! Please use 'help' to see all options.");
                }
            } else {
                _session.destroy(id, rtm, "You have not completed your task successfully!! Please use 'help' to see all options.");
            }
        });
    } else {
        _session.touch(id);
        rtm.sendMessage("I don't understand" + " " + message.text + ". Please use 'help' to see all options.", dm.id);
    }
};
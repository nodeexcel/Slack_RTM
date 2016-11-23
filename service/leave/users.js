require('node-import');
imports('config/index');
var _session = require('../session');
var _user = require('../isAdmin');
var request_send = require('../slack/send');
var moment = require('moment');
var async = require("async");

exports.userDetail = function (message, dm, id, rtm, callback) {
    var usersList = '', leaveListApprove = '', leaveListCancel = '', leaveListPending = '';
    var validLeaves = [];
    var task = _session.get(id, 'task');
    if (!task) {
        rtm.sendMessage('Please Wait..', dm.id);
        _session.touch(id);
        _user.userList(message.user, function (res) {
            _session.touch(id);
            var savedUserList = res[message.user].userList;
            if (savedUserList.error == 0) {
                for (i = 0; i < savedUserList.data.length; i++) {
                    var row = savedUserList.data[i];
                    var userName = row.name;
                    var userId = row.user_Id;
                    usersList = usersList + '#' + userId + ' ' + userName + '\n';
                }
                _session.touch(id);
                url = config.url_chat;
                var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "List of users in hr system", "text":"' + usersList + '", "fallback": "Message Send to Employee","color": "#36a64f"}]'};
                request_send.message(message, paramaters, usersList, url, function (error, response, msg) {
                    _session.set(id, 'task', 'setUserId');
                    rtm.sendMessage('Let me know which user you want to see leave status. Enter the User Id - ', dm.id);
                });
            } else {
                rtm.sendMessage('Oops! Some error occurred. We are looking into it.', dm.id);
            }
        });
    } else if (task == 'setUserId') {
        _session.touch(id);
        rtm.sendMessage('Please Wait..', dm.id);
        _user.userList(message.user, function (result) {
            var find = false;
            var allUserList = result[message.user].userList;
            for (var a = 0; a < allUserList.data.length; a++) {
                var row = allUserList.data[a];
                if (row.user_Id == message.text) {
                    find = true;
                }
            }
            if (find == false) {
                rtm.sendMessage('Please enter a valid user id. Please enter user id again: ', dm.id);
            } else {
                _user.getUserLeave(message.user, message.text, function (res) {
                    var savedLeaveList = res;
                    _session.touch(id);
                    var month = moment().format('M');
                    var year = moment().format('YYYY');
                    var startMonth = moment('01-' + month + '-' + year, 'DD-MM-YYYY').unix();
                    if (month * 1 == 1 || month * 1 == 3 || month * 1 == 5 || month * 1 == 7 || month * 1 == 8 || month * 1 == 10 || month * 1 == 12) {
                        var endMonth = moment('31-' + month + '-' + year, 'DD-MM-YYYY').unix();
                    } else if (month * 1 == 4 || month * 1 == 6 || month * 1 == 9 || month * 1 == 11) {
                        endMonth = moment('30-' + month + '-' + year, 'DD-MM-YYYY').unix();
                    } else if (month * 1 == 2) {
                        endMonth = moment('28-' + month + '-' + year, 'DD-MM-YYYY').unix();
                    }
                    if (savedLeaveList.length > 0) {
                        for (i = 0; i < savedLeaveList.length; i++) {
                            var row = savedLeaveList[i];
                            var userId = row.user_Id;
                            var status = row.status;
                            var reason = row.reason;
                            var fromDate = row.from_date;
                            var toDate = row.to_date;
                            var days = row.no_of_days;
                            var unixfromDate = moment(fromDate, 'YYYY-MM-DD').unix();
                            if (((unixfromDate * 1) >= (startMonth * 1) && (unixfromDate * 1) <= (endMonth * 1)) && status.toLowerCase() == 'approved') {
                                validLeaves.push(row);
                                leaveListApprove = leaveListApprove + (i + 1) + ") " + moment(fromDate, 'YYYY-MM-DD').format('Do MMM YYYY') + " to " + moment(toDate, 'YYYY-MM-DD').format('Do MMM YYYY') + ' Reason: ' + reason + ' Days# ' + days + '\n';
                            } else if (((unixfromDate * 1) >= (startMonth * 1) && (unixfromDate * 1) <= (endMonth * 1)) && status.toLowerCase() == 'pending') {
                                validLeaves.push(row);
                                leaveListPending = leaveListPending + (i + 1) + ") " + moment(fromDate, 'YYYY-MM-DD').format('Do MMM YYYY') + " to " + moment(toDate, 'YYYY-MM-DD').format('Do MMM YYYY') + ' Reason: ' + reason + ' Days# ' + days + '\n';
                            } else if (((unixfromDate * 1) >= (startMonth * 1) && (unixfromDate * 1) <= (endMonth * 1)) && status.toLowerCase() == 'cancelled request') {
                                validLeaves.push(row);
                                leaveListCancel = leaveListCancel + (i + 1) + ") " + moment(fromDate, 'YYYY-MM-DD').format('Do MMM YYYY') + " to " + moment(toDate, 'YYYY-MM-DD').format('Do MMM YYYY') + ' Reason: ' + reason + ' Days# ' + days + '\n';
                            }
                        }
                        _session.touch(id);
                        _session.set(id, 'leaveList', validLeaves);
                        url = config.url_chat;
                        async.parallel([
                            function (callback) {
                                _session.touch(id);
                                if (leaveListApprove != '') {
                                    var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Approved leaves for ' + userId + '", "text":"' + leaveListApprove + '", "fallback": "Message Send to Employee","color": "#36a64f"}]'};
                                    request_send.message(message, paramaters, leaveListApprove, url, function (error, response, msg) {
                                        _session.set(id, 'task', 'leaveAction');
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            },
                            function (callback) {
                                _session.touch(id);
                                if (leaveListPending != '') {
                                    var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Pending leaves for ' + userId + '", "text":"' + leaveListPending + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                                    request_send.message(message, paramaters, leaveListPending, url, function (error, response, msg) {
                                        _session.set(id, 'task', 'leaveAction');
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            }, function (callback) {
                                _session.touch(id);
                                if (leaveListCancel != '') {
                                    var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Cancelled leaves for ' + userId + '", "text":"' + leaveListCancel + '", "fallback": "Message Send to Employee","color": "#F2801D"}]'};
                                    request_send.message(message, paramaters, leaveListCancel, url, function (error, response, msg) {
                                        _session.set(id, 'task', 'leaveAction');
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            }
                        ], function (err, record) {
                            if (err) {
                                rtm.sendMessage(err, dm.id);
                            } else {
                                _session.touch(id);
                                if (leaveListApprove != '' || leaveListCancel != '' || leaveListPending != '') {
                                    rtm.sendMessage('These are your options: \n 1. cancel (Cancel leave using this option) \n 2. reject (Reject leave using this option) \n 3. approve (Approve leave using this option)', dm.id);
                                } else {
                                    _session.destroy(id, rtm, 'There is no applied leave for you!!');
                                }
                            }
                        });
                    } else {
                        rtm.sendMessage("Oops! This user was not applied any leave. Please use 'help' to see all options.", dm.id);
                    }
                });
            }
        });
    } else if (task == 'leaveAction') {
        var storedList = _session.get(id, 'leaveList');
        var existingList = storedList.length;
        var approve = 0, cancel = 0, pending = 0;
        for (var a = 0; a < existingList; a++) {
            var row = storedList[a];
            if (row.status == 'Approved') {
                approve++;
            } else if (row.status == 'Cancelled Request') {
                cancel++;
            } else if (row.status == 'Pending') {
                pending++;
            }
        }
        _session.touch(id);
        if (!_session.get(id, 'sub_task')) {
            _session.set(id, 'sub_task', message.text);
        }
        var _subtask = _session.get(id, 'sub_task');
        if (_subtask == 'cancel' || _subtask == 'reject') {
            _session.touch(id);
            _session.set(id, 'sub_task', 'cancelLeave');
            rtm.sendMessage('Please enter the serial number of leave which you want to ' + _subtask + '.', dm.id);
        } else if (_subtask == 'cancelLeave') {
            _session.touch(id);
            var serial = (message.text * 1) - 1;
            if (serial < (existingList * 1)) {
                _session.touch(id);
                var deleteRecord = storedList[serial];
                var userId = deleteRecord.user_Id;
                var date = deleteRecord.from_date;
                _user.cancelLeave(message.user, userId, date, function (res) {
                    if (res.error == 0) {
                        _session.touch(id);
                        rtm.sendMessage(res.data.message, dm.id);
                        _session.destroy(id, rtm, 'You have completed your task successfully!!');
                        callback(0);
                    } else {
                        rtm.sendMessage('Oops! Some problem occurred. We are looking into it. In the mean time you can use HR system to cancel this leave', dm.id);
                    }
                });
            } else {
                _session.touch(id);
                rtm.sendMessage('Invalid Serial Number. So please enter again a valid serial number.', dm.id);
            }
        } else if (_subtask == 'approve') {
            if (pending > 0) {
                _session.touch(id);
                _session.set(id, 'sub_task', 'approveLeave');
                rtm.sendMessage('Please enter the serial number of leave which you want to ' + _subtask + '.', dm.id);
            } else {
                _session.destroy(id, rtm, "You have not any pending leave!! Please use 'help' to see all options.");
            }
        } else if (_subtask == 'approveLeave') {
            _session.touch(id);
            var serial = (message.text * 1) - 1;
            if (serial < (existingList * 1)) {
                _session.touch(id);
                var deleteRecord = storedList[serial];
                var leaveId = deleteRecord.id;
                _user.approveLeave(message.user, leaveId, function (res) {
                    if (res.error == 0) {
                        _session.touch(id);
                        rtm.sendMessage(res.message, dm.id);
                        _session.destroy(id, rtm, 'You have completed your task successfully!!');
                        callback(0);
                    } else {
                        rtm.sendMessage('Oops! Some problem occurred. We are looking into it. In the mean time you can use HR system to approve this leave', dm.id);
                    }
                });
            } else {
                _session.touch(id);
                rtm.sendMessage('Invalid Serial Number. So please enter again a valid serial number.', dm.id);
            }
        } else {
            _session.touch(id);
            rtm.sendMessage("I don't understand" + " " + message.text + ". Do you wish to cancel or reject any leave?", dm.id);
        }
    }
};
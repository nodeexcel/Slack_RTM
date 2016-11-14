var leave_ = require('../leaveApply');
var to_session = require('../session');
var moment = require('moment');
require('node-import');
imports('config/index');

exports._apply = function (message, dm, id, time, rtm, user, callback) {
    to_session.exists(function (res) {
        var check_session = res[id] ? true : false;
        if (!check_session) {
            to_session.start(id, time, callback);
            to_session.set(id, 'command', 'from');
            rtm.sendMessage(user.name + '!' + ' can you please provide me the details \n from (DD-MM-YYYY) ', dm.id);
        } else if (check_session) {
            var result = to_session.get(id, 'command');
            if (result == 'from') {
                var dateFormat = "DD-MM-YYYY";
                var date = moment(message.text, dateFormat, true).isValid();
                if (date) {
                    to_session.touch(id);
                    to_session.set(id, 'from', message.text);
                    to_session.set(id, 'command', 'to');
                    rtm.sendMessage('to (DD-MM-YYYY)', dm.id);
                } else {
                    rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
                }
            } else if (result == 'to') {
                var dateFormat = "DD-MM-YYYY";
                var date = moment(message.text, dateFormat, true).isValid();
                if (date) {
                    to_session.touch(id);
                    to_session.set(id, 'to', message.text);
                    to_session.set(id, 'command', 'reason');
                    rtm.sendMessage('reason', dm.id);
                } else {
                    rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format to (DD-MM-YYYY)', dm.id);
                }
            } else if (result == 'reason') {
                var getFrom = to_session.get(id, 'from');
                var getTo = to_session.get(id, 'to');
                to_session.touch(id);
                var reason = message.text;
                to_session.set(id, 'reason', message.text);
                rtm.sendMessage('Please wait...', dm.id);
                var fromDate = moment(getFrom, "DD-MM-YYYY");
                var toDate = moment(getTo, "DD-MM-YYYY");
                var duration = toDate.diff(fromDate, 'days');
                var number_of_day = duration + 1;
                if (number_of_day > 0) {
                    var myFromDate = moment(getFrom, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    var myToDate = moment(getTo, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    leave_.leaveApply(id, myFromDate, myToDate, number_of_day, reason, function (status) {
                        if (status == 0) {
                            to_session.destory(id);
                            rtm.sendMessage('Your leave has been submitted approval!', dm.id);
                            callback(0);
                        } else {
                            to_session.destory(id);
                            rtm.sendMessage('Oops! Some problem occurred. We are looking into it. In the mean time you can use HR system to apply your leave', dm.id);
                            callback(0);
                        }
                    });
                } else {
                    to_session.set(id, 'command', 'from');
                    rtm.sendMessage('You must have to apply leave for more than one day !', dm.id);
                }
            }
        }
    });
};
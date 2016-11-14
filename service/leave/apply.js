var leave_ = require('../leaveApply');
var _session = require('../session');
var moment = require('moment');
require('node-import');
imports('config/index');

exports._apply = function (message, dm, id, rtm, user, callback) {

    console.log('aaply chala');

//    var exist = _session.exists(function (res) {
    var check_session = _session.exists(id) ? true : false;

    console.log(check_session);

    if (!check_session) {
        _session.start(id);
        _session.set(id, 'task', 'from');
        rtm.sendMessage(user.name + '!' + ' can you please provide me the details \n from (DD-MM-YYYY) ', dm.id);
    } else if (check_session) {
        console.log(id);
        var task = _session.get(id, 'task');
        if (task == 'from') {
            var dateFormat = "DD-MM-YYYY";
            var date = moment(message.text, dateFormat, true).isValid();
            if (date) {
                _session.touch(id);
                _session.set(id, 'from', message.text);
                _session.set(id, 'task', 'to');
                rtm.sendMessage('to (DD-MM-YYYY)', dm.id);
            } else {
                rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format from (DD-MM-YYYY)', dm.id);
            }
        } else if (task == 'to') {
            var dateFormat = "DD-MM-YYYY";
            var date = moment(message.text, dateFormat, true).isValid();
            if (date) {
                _session.touch(id);
                _session.set(id, 'to', message.text);
                _session.set(id, 'task', 'reason');
                rtm.sendMessage('reason', dm.id);
            } else {
                rtm.sendMessage('Invalid Date. So please enter a valid date again in proper format to (DD-MM-YYYY)', dm.id);
            }
        } else if (task == 'reason') {
            var getFrom = _session.get(id, 'from');
            var getTo = _session.get(id, 'to');
            _session.touch(id);
            var reason = message.text;
            _session.set(id, 'reason', message.text);
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
                        _session.destory(id);
                        rtm.sendMessage('Your leave has been submitted approval!', dm.id);
                        callback(0);
                    } else {
                        _session.destory(id);
                        rtm.sendMessage('Oops! Some problem occurred. We are looking into it. In the mean time you can use HR system to apply your leave', dm.id);
                        callback(0);
                    }
                });
            } else {
                _session.set(id, 'task', 'from');
                rtm.sendMessage('You must have to apply leave for more than one day !', dm.id);
            }
        }
    }
//    });
};
var request = require('request');
const request_send = require('../slack/send');

require('node-import');
imports('config/index');

exports.fetch = function (message, dm, rtm) {
    var approved_message = '';
    var pending_message = '';
    var cancelled_message = '';
    request({
        url: config.url, //URL to hit
        method: 'POST',
        qs: {"action": 'get_my_leaves', "userslack_id": message.user}
    }, function (error, response, body) {
        if (error) {
            console.log(error);
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
                        if (data1.data.leaves[i].status == "Approved") {
                            approved_message = approved_message + 'Leave from: ' + data1.data.leaves[i].from_date + ' to: ' + data1.data.leaves[i].to_date + '\n';
                            console.log(approved_message)
                        } else if (data1.data.leaves[i].status == "Pending") {
                            pending_message = pending_message + 'Leave from: ' + data1.data.leaves[i].from_date + ' to: ' + data1.data.leaves[i].to_date + '\n';
                        } else if (data1.data.leaves[i].status == "Cancelled Request") {
                            cancelled_message = cancelled_message + 'Leave from: ' + data1.data.leaves[i].from_date + ' to: ' + data1.data.leaves[i].to_date + '\n';
                        }
                    }
                    if (approved_message != '') {
                        url = config.url_chat;
                        var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Approved", "text":"' + approved_message + '", "fallback": "Message Send to Employee","color": "#36a64f"}]'};
                        request_send.message(message, paramaters, approved_message, url, function (error, response, msg) {
                        });
                    }
                    if (pending_message != '') {
                        url = config.url_chat;
                        var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Pending", "text":"' + pending_message + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                        request_send.message(message, paramaters, pending_message, url, function (error, response, msg) {
                        });
                    }
                    if (cancelled_message != '') {
                        url = config.url_chat;
                        var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Cancelled", "text":"' + cancelled_message + '", "fallback": "Message Send to Employee","color": "#F2801D"}]'};
                        request_send.message(message, paramaters, cancelled_message, url, function (error, response, msg) {
                        });
                    }
                } else {
                    rtm.sendMessage('Oops! Some error occurred. We are looking into it. In the mean time you can check your leave status of HR system.', dm.id);
                }
            }
        }
    });
};
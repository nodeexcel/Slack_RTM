var request = require('request');
const request_send = require('../slack/send');

require('node-import');
imports('config/index');

exports.cancel = function (message, dm, rtm) {
    var pending_message = '';
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
                        if (data1.data.leaves[i].status == "Pending") {
                            pending_message = pending_message + 'Leave from: ' + data1.data.leaves[i].from_date + ' to: ' + data1.data.leaves[i].to_date + '\n';                        }
                    }
                    if (pending_message != '') {
                        url = config.url_chat;
                        var paramaters = {"token": process.env.SLACK_API_TOKEN || '', "channel": message.channel, "attachments": '[{ "pretext": "Status : Pending", "text":"' + pending_message + '", "fallback": "Message Send to Employee","color": "#AF2111"}]'};
                        request_send.message(message, paramaters, pending_message, url, function (response, error, msg) {
                            var res = JSON.parse(response);
                            if(res.ok == true){
                               rtm.sendMessage("date from when leave start \n from(dd-mm-yyyy)", dm.id);
                               var from = '2016-11-13'
                               if(from != ''){
                                url = config.url_chat;
                                var paramaters = {"action": 'cancel_applied_leave', "date": from};
                                request_send.message(message, paramaters, url, function (response, error, msg) {
                                });
                               }
                            }else if(res.ok == false){
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
};
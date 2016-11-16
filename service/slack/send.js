var request = require('request');

exports.message = function (message, paramaters, message_data, url, callback) {
    request({
        url: url, //URL to hit
        method: 'POST',
        qs: paramaters
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            message_data = '';
            callback(body);
        }
    });
};

exports.cancel = function (message, paramaters, url, callback) {
    request({
        url: url, //URL to hit
        method: 'POST',
        qs: paramaters
    }, function (error, response, body) {
        if (error) {
            callback(error);
        } else {
            callback(body);
        }
    });
};
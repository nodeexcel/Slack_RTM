var session = {};

exports.exists = function (cb) {
    cb(session);
};

exports.get = function (id, key, callback) {
    if (session[id]) {
        return session[id][key];
    } else {
        return false;
    }
};

exports.touch = function (id, time) {
    if (session[id]) {
        session[id].start = time;
        clearTimeout(session[id].timeout);
        session[id].timeout = setTimeout(function () {
            destory(id);
        }, 50000000);
    } else {
    }
};

exports.set = function (id, key, value) {
    if (session[id]) {
        session[id][key] = value;
    } else {
    }
};

exports.start = function (id, time) {
    session[id] = {};
    session[id].start = time;
    session[id].timeout = setTimeout(function () {
        destory(id);
    }, 5000000);
};

exports.destory = function (id) {
    session[id] = {};
    delete session[id];
};
// Copyright (C) 2015  Lari Tikkanen
// Released under the GPLv3
// See LICENSE for details.

var net = require('net');
var util = require('util');
var ircMsg = require('irc-message');
var repl = require('repl');
var rfc = require('./rfc');

var bot = global.bot = (function () {
    var socket = new net.Socket();
    socket.setNoDelay(true);
    socket.setEncoding('utf8');

    socket.on('connect', function() {
        bot.nick('lagBot');
        bot.user('lagbot', 'nlagbot');
    });

    socket.on('close', function(had_error) {
        if(had_error) {
            process.exit(1);
        } else {
            process.exit();
        }
    });

    return {
        connect: function (host, port) {
            socket.connect(port, host)
                .pipe(ircMsg.createStream())
                .on('data', function (message) {
                    try {
                        console.log(message.raw);
                        if (message.command in rfc) {
                            message.command = rfc[message.command];
                        }
                        irc[message.command](message.prefix, message.params);
                    } catch (e) {
                        if (e instanceof TypeError) {
                            console.log(util.format('Not implemented:', message.command));
                        } else {
                            console.log(e);
                        }
                    }
                });
        },
        sendLine: function (line) {
            console.log(line);
            if (!line.match(new RegExp('\\r\\n$'))) {
                line += '\r\n';
            }
            socket.write(line, 'utf-8');
        },
        raw: function (line) {
            bot.sendLine(line);
        },
        away: function (message) {
            if(typeof message === "undefined") {
                message='';
            }
            bot.sendLine(util.format('AWAY :%s', message));
        },
        back: function () {
            bot.away();
        },
        invite: function (nickname, channel) {
            bot.sendLine(util.format('INVITE', nickname, channel));
        },
        join: function (channels, keys) {
            if(typeof keys === "undefined") {
                keys='';
            }
            bot.sendLine(util.format('JOIN', channels, keys));
        },
        kick: function (channel, client, message) {
            if(typeof message === "undefined") {
                message='';
            }
            bot.sendLine(util.format('KICK', client, message));
        },
        mode: function (target, flags, args) {
            if(typeof args === "undefined") {
                args='';
            }
            bot.sendLine(util.format('MODE', target, flags, args));
        },
        msg: function (msgtarget, message) {
            bot.privmsg(msgtarget, message);
        },
        nick: function (nickname) {
            bot.sendLine(util.format('NICK', nickname));
        },
        notice: function (msgtarget, message) {
            bot.sendLine(util.format('NOTICE %s :%s', msgtarget, message));
        },
        part: function (channels, message) {
            if(typeof message === "undefined") {
                message='';
            }
            bot.sendLine(util.format('PART %s :%s', channels, message));
        },
        password: function (password) {
            bot.sendLine(util.format('PASS', password));
        },
        pong: function (server1) {
            bot.sendLine(util.format('PONG :%s', server1));
        },
        privmsg: function (msgtarget, message) {
            bot.sendLine(util.format('PRIVMSG %s :%s', msgtarget, message));
        },
        quit: function (message) {
            if(typeof message === "undefined") {
                message='';
            }
            bot.sendLine(util.format('QUIT :%s', message));
        },
        topic: function (channel, topic) {
            bot.sendLine(util.format('TOPIC %s :%s', channel, topic));
        },
        user: function (user, realname) {
            bot.sendLine(util.format('USER %s %s %s :%s', user, '0', '*', realname));
        }
    };
})();

function privmsgReceived(user, channel, message) {
    console.log(util.format('%s <%s> %s', channel, user.split('!', 1), message))
}

var irc = {
    PING: function (prefix, params) {
        bot.pong(params[0]);
    },
    PRIVMSG: function (prefix, params) {
        privmsgReceived(prefix, params[0], params[-1]);
    },
    RPL_WELCOME: function (prefix, params) {
        bot.join('#channel');
    }
};

bot.connect('irc.quakenet.org', 6667);

repl.start({ prompt: '> ', ignoreUndefined: true });
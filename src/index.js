var mailer  = require('../bin/mail');

var comment = require('./comment');

var validator = require('validator');

var app = require('./app');

var u = require('underscore');

var express = require('express');

var path = require('path');

var counter = 0x861005;
require('./auth');

app.use(express.static(path.resolve(__dirname, '../client')));


app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'https://www.iyuxy.com');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('X-Powered-By', '3.2.1');
    if(req.method=='OPTIONS') res.send(200);
    else  next();
});

app.get('/comment/:id', function(req, res) {
    // 限制请求来源
    // if (req.headers.referer !== 'https://shuoba.iyuxy.com/demos.html' && req.headers.referer.indexOf('https://www.iyuxy.com') === -1){
    //     res.status(403).end();
    //     return;
    // }
    comment.getComment({pageId: parseInt(req.params.id, 10)}, function (data) {
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end(JSON.stringify(u.sortBy(data, 'time')));
    }, function () {
        res.status(503).end();
    });
});

app.post('/comment/:id', function (req, res) {
    // 限制请求来源
    // if (req.headers.referer !== 'https://shuoba.iyuxy.com/demos.html' && req.headers.referer.indexOf('https://www.iyuxy.com') === -1){
    //     res.status(403).end();
    //     return;
    // }
    var commentContent = {
        title: req.body.title,
        url: req.body.url,
        pageId: parseInt(req.params.id, 10),
        email: req.body.email,
        nickname: req.body.nickname,
        comment: req.body.comment,
        website: req.body.website,
        avatar_url: req.body.avatar_url,
        parentId: req.body.parentId || '0'
    };
    commentContent._id = commentContent.pageId + '' + new Date().getTime() + counter ++;
    if (commentContent.parentId !== '0') {
        comment.getComment({pageId: commentContent.pageId, _id: commentContent.parentId}, function (data) {
            data = data[0];
            console.log(1)
            console.log(data);
            console.log(2)
            if (validator.isEmail(data.email)) {
                mailer.commentNotice({
                    to: data.email,
                    nickName: data.nickname,
                    fromNickName: commentContent.nickname,
                    title: data.title,
                    pageUrl: commentContent.url
                });
            }
        }, function () {
            res.status(503).end();
        });
    }

    mailer.mailToOwner({
        fromNickName: commentContent.nickname,
        title: commentContent.title,
        pageUrl: commentContent.url
    });

    var resContent = {
        success: true,
        data: {
            _id: commentContent._id
        }
    };
    commentContent.time = new Date().getTime();
    comment.insertComment(commentContent, function () {
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end(JSON.stringify(resContent));
    }, function () {
        res.status(503).end();
    });
});

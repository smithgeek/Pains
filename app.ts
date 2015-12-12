////// <reference path="./typings/tsd.d.ts" />

import http = require('http');
import express = require('express');
import path = require('path');
import favicon = require('serve-favicon');
import logger = require('morgan');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
var config = require("./config.json");

import routes = require('./routes/index');

import data = require('./data');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('port', config.port);
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

function addTopic(data: data.DataModule, request: any, response: any) {
  var topic = request.body.Name.trim();
  if(topic != "") {
    data.add(topic);
    response.redirect('/');
  }
  else {
    response.send(400);
  }
}

app.post('/api/AddPain', (request, response) => {
    addTopic(data.Instance.pains, request, response);
});

app.post('/api/AddLike', (request, response) => {
    addTopic(data.Instance.likes, request, response);
});

function addComment(topicType: string, data: data.DataModule, request: any, response: any){
  var topic = request.body.Name.trim();
  var comment = request.body.Comment;
  if(topic != "" && comment != ""){
    data.addComment(topic, comment);
    response.redirect('/' + topicType + 'Comments/' + topic);
    response.send(200);
  }
  else {
    response.send(40);
  }    
}

app.post('/api/AddPainComment', (request, response) => {
    addComment('Pain', data.Instance.pains, request, response);
});

app.post('/api/AddLikeComment', (request, response) => {
    addComment('Like', data.Instance.likes, request, response);
});

app.get('/api/GetTopPains', function(request, response) {
  response.send(200, data.Instance.pains.getTop());
});

app.get('/api/GetTopLikes', function(request, response) {
  response.send(200, data.Instance.likes.getTop());
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err: any = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var data = require('./data');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/api/AddPain', function(request, response) {
  var topic = request.body.Pain.trim();
  if(topic != "") {
    data.addPain(topic);
    response.redirect('/');
  }
  else {
    response.send(400);
  }
});

app.post('/api/AddComment', function(request, response) {
  var topic = request.body.Pain.trim();
  var comment = request.body.Comment;
  if(topic != "" && comment != ""){
    data.addComment(topic, comment);
    response.redirect('/comments/' + topic);
  }
  else {
    response.send(40);
  }
});

app.get('/api/GetTopPains', function(request, response) {
  response.send(200, data.getTopPains());
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

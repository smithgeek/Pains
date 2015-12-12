////// <reference path="../typings/tsd.d.ts" />

import express = require('express');
var router = express.Router();
import data = require('../data');
var config = require('../config.json')

/* GET home page. */
router.get('/', function(req, res, next) {
  var redirect = false;
  if(req.query.page != null){
    var page = req.query.page;
    if(page == "comments" && req.query.pain != null){
      res.redirect("/comments/" + req.query.pain);
      redirect = true;
    }
  }
  if(!redirect) {
    res.render('index', { title: config.appName, allPains: data.Instance.pains.getAll(), allLikes: data.Instance.likes.getAll() });
  }
});

router.get('/PainComments/:pain', function(req, res, next) {
  res.render('comments', { name: req.params.pain, comments: data.Instance.pains.getComments(req.params.pain), topicType: 'Pain' });
});

router.get('/LikeComments/:like', function(req, res, next) {
  res.render('comments', { name: req.params.like, comments: data.Instance.likes.getComments(req.params.like), topicType: 'Like' });
});

export = router;

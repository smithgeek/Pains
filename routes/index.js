var express = require('express');
var router = express.Router();
var data = require('../data.js');

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
    res.render('index', { title: 'Pains', allPains: data.getAllPains() });
  }
});

router.get('/comments/:pain', function(req, res, next) {
  res.render('comments', { pain: req.params.pain, comments: data.getComments(req.params.pain) });
});

module.exports = router;

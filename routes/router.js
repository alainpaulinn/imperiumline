const express = require('express');
router = express.Router();

//middleware for user redirections concerning sessions
const redirectToHome = (req, res, next) => {
  if(!req.session.userId){
    res.redirect('/connect');
  }
  else{
    next();
  }
}
const redirectToLogin = (req, res, next) => {
  if(req.session.userId){
    res.redirect('/');
  }
  else{
    next();
  }
}

router.get('/', redirectToHome, (req, res) => {
  res.render('index')
});

router.get('/connect', redirectToLogin, (req, res) => {
    res.render('connect')
});

router.get('/images', redirectToLogin, (req, res) => {
  res.render('connect')
});

module.exports = router;

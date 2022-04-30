const fs = require('fs')
const path = require('path');
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

const checkImageAccess = (req, res, next) => {
  if(req.session.userId){
    res.redirect('/connect');
  }
  else{
    next();
  }
}

router.get('/', redirectToHome, (req, res) => { res.render('index') });
router.get('/connect', redirectToLogin, (req, res) => { res.render('connect') });
router.get('/signUp', redirectToLogin, (req, res) => { res.render('signUp') });

router.get('/profiles*', function (req, res) {
  console.log(req.session.userId)
  if (!req.session.userId || !req.session){
    res.sendStatus(404); 
    return console.log("no session found - cannot serve the file");
  }
  if (req.session.userId != undefined) {
    let pathString = path.join(__dirname,'..', req.originalUrl);
    console.log(pathString);
    if (fs.existsSync(pathString)) {
      fs.createReadStream(pathString).pipe(res);
      console.log("The file exists", pathString);
    } else {
      res.sendStatus(404);
      console.log("The file does not exist");
    }
  }
});
router.get('/audio*', function (req, res) {
  console.log(req.session.userId)
  if (!req.session.userId || !req.session){
    res.sendStatus(404); 
    return console.log("no session found - cannot serve the file");
  }
  if (req.session.userId != undefined) {
    let pathString = path.join(__dirname,'..', req.originalUrl);
    console.log(pathString);
    if (fs.existsSync(pathString)) {
      fs.createReadStream(pathString).pipe(res);
      console.log("The file exists", pathString);
    } else {
      res.sendStatus(404);
      console.log("The file does not exist");
    }
  }
});

module.exports = router;

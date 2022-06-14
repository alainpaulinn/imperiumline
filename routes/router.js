const fs = require('fs')
const path = require('path');
const express = require('express');
router = express.Router();
const db = require('../db/db.js')

//middleware for user redirections concerning sessions
const redirectToHome = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/connect');
  }
  else {
    next();
  }
}
const redirectToLogin = (req, res, next) => {
  if (req.session.userId) {
    res.redirect('/');
  }
  else {
    next();
  }
}

function checkAccess(req, res) {
  if (!req.session.userId || !req.session.email) return res.redirect('/connect')
  var email = req.session.email;
  return db.query('SELECT id, name, surname FROM user WHERE email = ?', [email], async (err, user) => {
    if (err) return console.log(err)
    if (user.length < 1) return console.log("Cannot find the user with email " + email);
    let access = {
      NAdmin: await getAdminAccess(user[0].id),
      SAdmin: await getSuperadminAccess(user[0].id),
      name: user[0].name + ' ' + user[0].surname
    } // SAdmin means super admin, NAdmin means normal admin
    return access
  })
}

router.get('/', redirectToHome, (req, res) => {
  res.render('index', {
    access: {
      NAdmin: "correct",
      SAdmin: checkAccess(req, res).SAdmin,
      name: checkAccess(req, res).name,
    }
  })
  // console.log("checkAccess", checkAccess(req, res))
});
router.get('/connect', redirectToLogin, (req, res) => { res.render('connect') });
router.get('/signUp', redirectToLogin, (req, res) => { res.render('signUp') });
router.get('/admin', redirectToHome, (req, res) => { res.render('admin') });

router.get('/profiles*', function (req, res) {
  console.log(req.session.userId)
  if (!req.session.userId || !req.session) {
    res.sendStatus(404);
    return console.log("no session found - cannot serve the file");
  }
  if (req.session.userId != undefined) {
    let pathString = path.join(__dirname, '..', req.originalUrl);
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
  if (!req.session.userId || !req.session) {
    res.sendStatus(404);
    return console.log("no session found - cannot serve the file");
  }
  if (req.session.userId != undefined) {
    let pathString = path.join(__dirname, '..', req.originalUrl);
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

router.get('/cover*', function (req, res) {
  console.log(req.session.userId)
  if (!req.session.userId || !req.session) {
    res.sendStatus(404);
    return console.log("no session found - cannot serve the file");
  }
  if (req.session.userId != undefined) {
    let pathString = path.join(__dirname, '..', req.originalUrl);
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

function getSuperadminAccess(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `admin_id` FROM `superadmins` WHERE `admin_id` = ?', [userID], async (err, admins) => {
      if (err) return console.log(err)
      if (admins.length > 0) { resolve(true) }
      else resolve(false)
    })
  })
}
function getAdminAccess(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `admin_id` FROM `admins` WHERE `admin_id` = ?', [userID], async (err, admins) => {
      if (err) return console.log(err)
      if (admins.length > 0) { resolve(true) }
      else resolve(false)
    })
  })
}
getAdminAccess(4).then(console.log)
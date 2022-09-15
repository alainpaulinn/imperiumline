const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pwValidator = require('./pwValidator');

//const exphbs = require('express-handlebars')
//var ejs = require('ejs');

const db = require('../db/db.js')

exports.register = (req, res) => {
    //console.log(req.body);

    const { name, surname, email, password, password_confirm } = req.body;
    //check for required fiels
    if (!name || !surname || !email || !password || !password_confirm) {
        return res.render('signUp', {
            register_message_failure: 'All fields are required',
            email: email,
            name: name,
            surname: surname,
            password: password,
            password_confirm: password_confirm
        })
    }
    db.query('SELECT email FROM user WHERE email = ?', [email], async (err, result) => {
        //if errors on select
        if (err) {
            console.log(err);
            return res.render('signUp', {
                register_message_failure: 'An Error occurred while registering. Please try again later.',
                name: name,
                surname: surname,
                password: password,
                password_confirm: password_confirm
            })
        }

        //if user already exists
        else if (result.length > 0) {
            return res.render('signUp', {
                register_message_failure: 'this email is already registered by another user',
                name: name,
                surname: surname,
                password: password,
                password_confirm: password_confirm
            })
        }
        //if passwords do not match
        else if (password !== password_confirm) {
            return res.render('signUp', {
                register_message_failure: 'The given passwords do not match',
                name: name,
                surname: surname,
                email: email
            })
        }

        else if (!pwValidator.validate(password)) {
            return res.render('signUp', {
                register_message_failure: 'The specified password does not meet the minimum requirements for a secure password.  Minimum length 8, Maximum length 100, Must have uppercase letters, Must have lowercase letters, Must have at least 2 digits, Should not have spaces, Must not include common known things or places easily guessable passwords', 
                name: name,
                surname: surname,
                email: email
            })
          }

        let hashed_salted_password = await bcrypt.hash(password, 10);
        //now register the user in the DB
        db.query("INSERT INTO user SET ?", { name: name, surname: surname, email: email, password: hashed_salted_password, positionId: 1, company_id: 1 }, (err, result) => {
            //if we get some errors while registering the user
            if (err) {
                console.log(err);
            }
            //if registration successfull
            else {
                // res.render('signUp', {
                //     register_message_success: "The account is registered successfully. Go ahead with Login"
                // })
                res.render('connect', {
                    login_message_success: 'The account is registered successfully. Go ahead with Login',
                })
            }
        })
    })

}

exports.login = (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT email FROM user WHERE email = ?', [email], async (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        if (result.length <= 0) {
            return res.render('connect', {
                login_message_failure: 'No user with such login',
                email: email,
                password: password,
            })
        }

        else {
            db.query('SELECT password FROM user WHERE email = ?', [email], async (err, result) => {
                if (err) {
                    res.render('connect', {
                        login_message_failure: 'An error occured while loggin in. Please Try again',
                        email: email,
                        password: password,
                    })
                    return console.log(err);
                }
                else {
                    let userAuthenticated = await bcrypt.compare(password, result[0].password);
                    if (userAuthenticated) {
                        db.query('SELECT `id`, `name`, `surname`, `email`, `company_id`, `registration_date` FROM `user` WHERE `email`= ?', [email], async (err, result) => {
                            req.session.userId = result[0].id;
                            req.session.email = result[0].email;
                            req.session.name = result[0].name;
                            req.session.surname = result[0].surname;
                            req.session.company_id = result[0].company_id
                            req.session.registration_date = result[0].registration_date;

                            console.log(req.session);

                            res.redirect('../')
                        })
                    }
                    else {
                        res.render('connect', {
                            login_message_failure: 'Password Incorrect',
                            email: email
                        })
                    }
                }
            })
        }
    })
}

exports.logout = (req, res) => {
    if (req.session.userId) {
        req.session.destroy();
        res.redirect('/')
    }
    else {
        res.render('connect', {
            login_message_failure: 'Not Logged in',
            email: email
        })
    }
}
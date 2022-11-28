const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pwValidator = require('./pwValidator');
const nodemailer = require("nodemailer");

//const exphbs = require('express-handlebars')
//var ejs = require('ejs');

const db = require('../db/db.js')

exports.register = (req, res) => {
    //console.log(req.body);

    const { register_name, register_surname, register_email, register_password, register_password_confirm } = req.body;
    const name = register_name
    const surname = register_surname
    const email = register_email
    const password = register_password
    const password_confirm = register_password_confirm
    //check for required fiels
    if (!name || !surname || !email || !password || !password_confirm) {
        return res.render('signUp', {
            register_message_failure: 'All fields are required',
            register_email: email,
            register_name: name,
            register_surname: surname,
            register_password: password,
            register_password_confirm: password_confirm
        })
    }
    db.query('SELECT email FROM user WHERE email = ?', [email], async (err, result) => {
        //if errors on select
        if (err) {
            console.log(err);
            return res.render('signUp', {
                register_message_failure: 'An Error occurred while registering. Please try again later.',
                register_name: name,
                register_surname: surname,
                register_password: password,
                register_password_confirm: password_confirm
            })
        }

        //if user already exists
        else if (result.length > 0) {
            return res.render('signUp', {
                register_message_failure: 'this email is already registered by another user',
                register_name: name,
                register_surname: surname,
                register_password: password,
                register_password_confirm: password_confirm
            })
        }
        //if passwords do not match
        else if (password !== password_confirm) {
            return res.render('signUp', {
                register_message_failure: 'The given passwords do not match',
                register_name: name,
                register_surname: surname,
                register_email: email
            })
        }

        else if (!pwValidator.validate(password)) {
            return res.render('signUp', {
                register_message_failure: 'The specified password does not meet the minimum requirements for a secure password.  Minimum length 8, Maximum length 100, Must have uppercase letters, Must have lowercase letters, Must have at least 2 digits, Should not have spaces, Must not include common known things or places easily guessable passwords',
                register_name: name,
                register_surname: surname,
                register_email: email
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
exports.recovery = (req, res) => {
    console.log(req.body)
    const { email } = req.body;
    db.query('SELECT id, name, surname, email FROM user WHERE email = ?', [email], async (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        else if (result.length <= 0) {
            console.log('recovery email does not exist', email)
        }

        else {
            try {
                let emails = [result[0].email]
                let name = result[0].name
                let surname = result[0].surname
                let subject = "Password reset link"
                let text = "Hello To you all"
                let html = `<b>Hello ${name} ${surname}</b>`
                let info = await sendEmail(emails, subject, text, html)
                console.log('recovery email sent', info)
                if(info.messageId){
                    let link = info.messageId.split('@')[0]
                    db.query('UPDATE `pwrecoverylinks` SET `isexpired` = 1 WHERE `userID` IS ?', [userID], async (err, InsertResult) => {}) // expire all previous links
                    db.query('INSERT INTO `pwrecoverylinks`(`userID`, `link`, `isexpired`) VALUES (?,?,?)', [userID, link, 0], async (err, InsertResult) => {

                    })
                }
                
                
            } catch (error) {

            }
        }
    })

    res.render('recovery', {
        recovery_message_success: `Thank you for taking the recovery action, If your email and account exists in our database, on the provided email (${email}) you will receive a password reset link. PLEASE CHECK ALSO THE SPAM FOLDER. If you have not yet received the link wait 30min and try again.`,
    })
}

async function sendEmail(emails, subject, text, html) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: { // do not fail on invalid certs
            rejectUnauthorized: false,
            servername: process.env.SMTP_HOSTNAME
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Imperium Line" <app@imperiumline.com>', // sender address
        to: emails.join(", "), // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html, // html body
    });

    console.log("Message sent: %s", info);
    return info;
}

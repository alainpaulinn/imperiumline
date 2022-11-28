const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pwValidator = require('./pwValidator');
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require('uuid');

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
                let link = uuidv4();
                let emails = [result[0].email]
                let name = result[0].name
                let surname = result[0].surname
                let userID = result[0].id
                let subject = "Password reset link"
                let text = "Hello To you all"
                let html = createForgotPasswordHTML(name, surname, link)
                let info = await sendEmail(emails, subject, text, html)
                console.log('recovery email sent', info)
                if(info.messageId){
                    console.log('link sent', link)
                    db.query('DELETE FROM `pwrecoverylinks` WHERE `userID` = ?', [userID], async (err, updateResult) => {
                        if(err) return console.log(err)
                    }) // expire all previous links
                    db.query('INSERT INTO `pwrecoverylinks`(`userID`, `link`, `isexpired`) VALUES (?,?,?)', [userID, link, 0], async (err, InsertResult) => {
                        if(err) return console.log(err)
                    })
                }
                
                
            } catch (error) {
                console.log(error)
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

function createForgotPasswordHTML(name, surname, link){
    return `
    <!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
    
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
        <!--[if !mso]><!-->
        <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css">
        <!--<![endif]-->
        <style>
            * {
                box-sizing: border-box;
            }
    
            body {
                margin: 0;
                padding: 0;
            }
    
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: inherit !important;
            }
    
            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
            }
    
            p {
                line-height: inherit
            }
    
            .desktop_hide,
            .desktop_hide table {
                mso-hide: all;
                display: none;
                max-height: 0px;
                overflow: hidden;
            }
    
            @media (max-width:660px) {
                .desktop_hide table.icons-inner {
                    display: inline-block !important;
                }
    
                .icons-inner {
                    text-align: center;
                }
    
                .icons-inner td {
                    margin: 0 auto;
                }
    
                .image_block img.big,
                .row-content {
                    width: 100% !important;
                }
    
                .mobile_hide {
                    display: none;
                }
    
                .stack .column {
                    width: 100%;
                    display: block;
                }
    
                .mobile_hide {
                    min-height: 0;
                    max-height: 0;
                    max-width: 0;
                    overflow: hidden;
                    font-size: 0px;
                }
    
                .desktop_hide,
                .desktop_hide table {
                    display: table !important;
                    max-height: none !important;
                }
            }
        </style>
    </head>
    
    <body style="background-color: #1453a3; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #1453a3;">
            <tbody>
                <tr>
                    <td>
                        <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tbody>
                                <tr>
                                    <td>
                                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-image: url('https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4186/gradient-back-to-school.png'); background-position: center top; background-repeat: repeat; color: #000000; width: 640px;" width="640">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 0px; padding-bottom: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                        <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                            <tr>
                                                                <td class="pad" style="padding-left:20px;padding-right:20px;padding-top:5px;text-align:center;width:100%;">
                                                                    <h1 style="margin: 0; color: #ffffff; direction: ltr; font-family: Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif; font-size: 40px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;"><span class="tinyMce-placeholder">Hi ${name} ${surname}!</span></h1>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        <table class="heading_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:20px;padding-right:20px;padding-top:20px;text-align:center;width:100%;">
                                                                    <h2 style="margin: 0; color: #ffffff; direction: ltr; font-family: Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif; font-size: 23px; font-weight: 400; letter-spacing: 1px; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;"><span class="tinyMce-placeholder">Do not lose your Imperium Line account!</span></h2>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        <table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:20px;padding-right:20px;padding-top:10px;">
                                                                    <div style="font-family: sans-serif">
                                                                        <div class style="font-size: 14px; mso-line-height-alt: 21px; color: #ffffff; line-height: 1.5; font-family: Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif;">
                                                                            <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 27px;"><span style="font-size:18px;">Someone requested to reset your password, if it was you click here to reset your password, else ignore this message</span></p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        <table class="button_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:45px;padding-left:10px;padding-right:10px;text-align:center;">
                                                                    <div class="alignment" align="center">
                                                                        [if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://${process.env.HOSTING_DOMAIN}/recover/${link}" target="_blank" style="text-decoration:none;display:block;color:#ffffff;background-color:transparent;border-radius:30px;width:75%;border-top:2px solid #FFFFFF;font-weight:400;border-right:2px solid #FFFFFF;border-bottom:2px solid #FFFFFF;border-left:2px solid #FFFFFF;padding-top:5px;padding-bottom:5px;font-family:Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif;font-size:20px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:20px;display:inline-block;letter-spacing:normal;"><span dir="ltr" style="font-size: 16px; word-break: break-word; line-height: 2; mso-line-height-alt: 32px;"><strong><span style="font-size: 20px;" dir="ltr" data-mce-style="font-size: 20px;">Reset password</span></strong></span></span></a>
                                                                        [if mso]></center></v:textbox></v:roundrect><![endif]
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tbody>
                                <tr>
                                    <td>
                                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 640px;" width="640">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 0px; padding-bottom: 15px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                                        <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                            <tr>
                                                                <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                                                    <div class="alignment" align="center" style="line-height:10px"><img class="big" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4186/blue-bottom.png" style="display: block; height: auto; border: 0; width: 640px; max-width: 100%;" width="640"></div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                    </td>
                </tr>
            </tbody>
        </table><!-- End -->
    </body>
    
    </html>`
}
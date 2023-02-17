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
                let url = 'https://'+ process.env.SMTP_HOSTNAME + '/recover/' + link
                let urlText = 'ResetPassword'
                let html = createForgotPasswordHTML(name, surname, url, urlText)
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

function createForgotPasswordHTML(name, surname, url, urlText){
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
      <title>New Assignment</title>
      <style type="text/css">
        /* reset */
        article,
        aside,
        details,
        figcaption,
        figure,
        footer,
        header,
        hgroup,
        nav,
        section,
        summary {
          display: block
        }
    
        audio,
        canvas,
        video {
          display: inline-block;
          *display: inline;
          *zoom: 1
        }
    
        audio:not([controls]) {
          display: none;
          height: 0
        }
    
        [hidden] {
          display: none
        }
    
        html {
          font-size: 100%;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%
        }
    
        html,
        button,
        input,
        select,
        textarea {
          font-family: sans-serif
        }
    
        body {
          margin: 0
        }
    
        a:focus {
          outline: thin dotted
        }
    
        a:active,
        a:hover {
          outline: 0
        }
    
        h1 {
          font-size: 2em;
          margin: 0 0.67em 0
        }
    
        h2 {
          font-size: 1.5em;
          margin: 0 0 .83em 0
        }
    
        h3 {
          font-size: 1.17em;
          margin: 1em 0
        }
    
        h4 {
          font-size: 1em;
          margin: 1.33em 0
        }
    
        h5 {
          font-size: .83em;
          margin: 1.67em 0
        }
    
        h6 {
          font-size: .75em;
          margin: 2.33em 0
        }
    
        abbr[title] {
          border-bottom: 1px dotted
        }
    
        b,
        strong {
          font-weight: bold
        }
    
        blockquote {
          margin: 1em 40px
        }
    
        dfn {
          font-style: italic
        }
    
        mark {
          background: #ff0;
          color: #000
        }
    
        p,
        pre {
          margin: 1em 0
        }
    
        code,
        kbd,
        pre,
        samp {
          font-family: monospace, serif;
          _font-family: 'courier new', monospace;
          font-size: 1em
        }
    
        pre {
          white-space: pre;
          white-space: pre-wrap;
          word-wrap: break-word
        }
    
        q {
          quotes: none
        }
    
        q:before,
        q:after {
          content: '';
          content: none
        }
    
        small {
          font-size: 75%
        }
    
        sub,
        sup {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline
        }
    
        sup {
          top: -0.5em
        }
    
        sub {
          bottom: -0.25em
        }
    
        dl,
        menu,
        ol,
        ul {
          margin: 1em 0
        }
    
        dd {
          margin: 0 0 0 40px
        }
    
        menu,
        ol,
        ul {
          padding: 0 0 0 40px
        }
    
        nav ul,
        nav ol {
          list-style: none;
          list-style-image: none
        }
    
        img {
          border: 0;
          -ms-interpolation-mode: bicubic
        }
    
        svg:not(:root) {
          overflow: hidden
        }
    
        figure {
          margin: 0
        }
    
        form {
          margin: 0
        }
    
        fieldset {
          border: 1px solid #c0c0c0;
          margin: 0 2px;
          padding: .35em .625em .75em
        }
    
        legend {
          border: 0;
          padding: 0;
          white-space: normal;
          *margin-left: -7px
        }
    
        button,
        input,
        select,
        textarea {
          font-size: 100%;
          margin: 0;
          vertical-align: baseline;
          *vertical-align: middle
        }
    
        button,
        input {
          line-height: normal
        }
    
        button,
        html input[type="button"],
        input[type="reset"],
        input[type="submit"] {
          -webkit-appearance: button;
          cursor: pointer;
          *overflow: visible
        }
    
        button[disabled],
        input[disabled] {
          cursor: default
        }
    
        input[type="checkbox"],
        input[type="radio"] {
          box-sizing: border-box;
          padding: 0;
          *height: 13px;
          *width: 13px
        }
    
        input[type="search"] {
          -webkit-appearance: textfield;
          -moz-box-sizing: content-box;
          -webkit-box-sizing: content-box;
          box-sizing: content-box
        }
    
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-decoration {
          -webkit-appearance: none
        }
    
        button::-moz-focus-inner,
        input::-moz-focus-inner {
          border: 0;
          padding: 0
        }
    
        textarea {
          overflow: auto;
          vertical-align: top
        }
    
        table {
          border-collapse: collapse;
          border-spacing: 0
        }
    
        /* custom client-specific styles including styles for different online clients */
        .ReadMsgBody {
          width: 100%;
        }
    
        .ExternalClass {
          width: 100%;
        }
    
        /* hotmail / outlook.com */
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
    
        /* hotmail / outlook.com */
        table,
        td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          border-radius: 15px;
        }
    
        /* Outlook */
        #outlook a {
          padding: 0;
        }
    
        /* Outlook */
        img {
          -ms-interpolation-mode: bicubic;
          display: block;
          outline: none;
          text-decoration: none;
        }
    
        /* IExplorer */
        body,
        table,
        td,
        p,
        a,
        li,
        blockquote {
          -ms-text-size-adjust: 100%;
          -webkit-text-size-adjust: 100%;
          font-weight: normal !important;
        }
    
        .ExternalClass td[class="ecxflexibleContainerBox"] h3 {
          padding-top: 10px !important;
        }
    
        /* hotmail */
        /* email template styles */
        h1 {
          display: block;
          font-size: 26px;
          font-style: normal;
          font-weight: normal;
          line-height: 100%;
        }
    
        h2 {
          display: block;
          font-size: 20px;
          font-style: normal;
          font-weight: normal;
          line-height: 120%;
        }
    
        h3 {
          display: block;
          font-size: 17px;
          font-style: normal;
          font-weight: normal;
          line-height: 110%;
        }
    
        h4 {
          display: block;
          font-size: 18px;
          font-style: italic;
          font-weight: normal;
          line-height: 100%;
        }
    
        .flexibleImage {
          height: auto;
        }
    
        table[class=flexibleContainerCellDivider] {
          padding-bottom: 0 !important;
          padding-top: 0 !important;
        }
    
        body,
        #bodyTbl {
          background-color: #E1E1E1;
        }
    
        #emailHeader {
          background-color: #E1E1E1;
        }
    
        #emailBody {
          background-color: #FFFFFF;
        }
    
        #emailFooter {
          background-color: #E1E1E1;
        }
    
        .textContent {
          color: #8B8B8B;
          font-family: Helvetica;
          font-size: 16px;
          line-height: 125%;
          text-align: Left;
        }
    
        .textContent a {
          color: #205478;
          text-decoration: underline;
        }
    
        .emailButton {
          background-color: #205478;
          border-collapse: separate;
        }
    
        .buttonContent {
          color: #FFFFFF;
          font-family: Helvetica;
          font-size: 18px;
          font-weight: bold;
          line-height: 100%;
          padding: 15px;
          text-align: center;
        }
    
        .buttonContent a {
          color: #FFFFFF;
          display: block;
          text-decoration: none !important;
          border: 0 !important;
        }
    
        #invisibleIntroduction {
          display: none;
          display: none !important;
        }
    
        /* hide the introduction text */
        /* other framework hacks and overrides */
        span[class=ios-color-hack] a {
          color: #275100 !important;
          text-decoration: none !important;
        }
    
        /* Remove all link colors in IOS (below are duplicates based on the color preference) */
        span[class=ios-color-hack2] a {
          color: #205478 !important;
          text-decoration: none !important;
        }
    
        span[class=ios-color-hack3] a {
          color: #8B8B8B !important;
          text-decoration: none !important;
        }
    
        /* phones and sms */
        .a[href^="tel"],
        a[href^="sms"] {
          text-decoration: none !important;
          color: #606060 !important;
          pointer-events: none !important;
          cursor: default !important;
        }
    
        .mobile_link a[href^="tel"],
        .mobile_link a[href^="sms"] {
          text-decoration: none !important;
          color: #606060 !important;
          pointer-events: auto !important;
          cursor: default !important;
        }
    
        /* responsive styles */
        @media only screen and (max-width: 480px) {
          body {
            width: 100% !important;
            min-width: 100% !important;
          }
    
          table[id="emailHeader"],
          table[id="emailBody"],
          table[id="emailFooter"],
          table[class="flexibleContainer"] {
            width: 100% !important;
          }
    
          td[class="flexibleContainerBox"],
          td[class="flexibleContainerBox"] table {
            display: block;
            width: 100%;
            text-align: left;
          }
    
          td[class="imageContent"] img {
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
    
          img[class="flexibleImage"] {
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
    
          img[class="flexibleImageSmall"] {
            height: auto !important;
            width: auto !important;
          }
    
          table[class="flexibleContainerBoxNext"] {
            padding-top: 10px !important;
          }
    
          table[class="emailButton"] {
            width: 100% !important;
          }
    
          td[class="buttonContent"] {
            padding: 0 !important;
          }
    
          td[class="buttonContent"] a {
            padding: 15px !important;
          }
        }
      </style>
      <!--
          MS Outlook custom styles
        -->
      <!--[if mso 12]>
          <style type="text/css">
            .flexibleContainer{display:block !important; width:100% !important;}
          </style>
        <![endif]-->
      <!--[if mso 14]>
          <style type="text/css">
            .flexibleContainer{display:block !important; width:100% !important;}
          </style>
        <![endif]-->
    </head>
    
    <body bgcolor="#E1E1E1" leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
      <center style="background-color:#E1E1E1;">
        <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTbl" style="table-layout: fixed;max-width:100% !important;width: 100% !important;min-width: 100% !important;">
          <tr>
            <td align="center" valign="top" id="bodyCell">
    
              <table bgcolor="#E1E1E1" border="0" cellpadding="0" cellspacing="0" width="500" id="emailHeader">
                <tr>
                  <td align="center" valign="top">
    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" valign="top">
    
                          <table border="0" cellpadding="10" cellspacing="0" width="500" class="flexibleContainer">
                            <tr>
                              <td valign="top" width="500" class="flexibleContainerCell">
    
                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td align="left" valign="middle" id="invisibleIntroduction" class="flexibleContainerBox" style="display:none;display:none !important;">
                                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:100%;">
                                        <tr>
                                          <td align="left" class="textContent">
                                            <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#828282;text-align:center;line-height:120%;">
                                              Here you can put short introduction of your email template.
                                            </div>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
    
                        </td>
                      </tr>
                    </table>
    
                  </td>
                </tr>
              </table>
    
              <table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="500" id="emailBody">
    
                <tr>
                  <td align="center" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="color:#FFFFFF;" bgcolor="#003061">
                      <tr>
                        <td align="center" valign="top">
                          <table border="0" cellpadding="0" cellspacing="0" width="500" class="flexibleContainer">
                            <tr>
                              <td align="center" valign="top" width="500" class="flexibleContainerCell">
                                <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                  <tr>
                                    <td align="center" valign="top" class="textContent">
                                      <h1 style="color:#FFFFFF;line-height:100%;font-family:Helvetica,Arial,sans-serif;font-size:35px;font-weight:normal;margin-bottom:5px;text-align:center;">Hi ${name} ${surname}!</h1>
                                      <h2 style="text-align:center;font-weight:normal;font-family:Helvetica,Arial,sans-serif;font-size:23px;margin-bottom:10px;color:#EEEE;line-height:135%;">Password reset</h2>
                                      <div style="text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:15px;margin-bottom:0;color:#FFFFFF;line-height:135%;">Someone requested for a reset of your password.</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" valign="top">
                          <table border="0" cellpadding="0" cellspacing="0" width="500" class="flexibleContainer">
                            <tr>
                              <td align="center" valign="top" width="500" class="flexibleContainerCell">
                                <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                  <tr>
                                    <td align="center" valign="top">
    
                                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                          <td valign="top" class="textContent">
                                            <h3 style="color:#5F5F5F;line-height:125%;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:normal;margin-top:0;margin-bottom:3px;text-align:left;">If this was you, click on the button below to reset your password.</h3>
                                            <div style="text-align:left;font-family:Helvetica,Arial,sans-serif;font-size:15px;margin-bottom:0;margin-top:3px;color:#5F5F5F;line-height:135%;">If you did not request for this action, please ignore this email.</div>
                                          </td>
                                        </tr>
                                      </table>
    
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
    
                <tr>
                  <td align="center" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F8F8F8">
                      <tr>
                        <td align="center" valign="top">
                          <table border="0" cellpadding="0" cellspacing="0" width="500" class="flexibleContainer">
                            <tr>
                              <td align="center" valign="top" width="500" class="flexibleContainerCell">
                                <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                  <tr>
                                    <td align="center" valign="top">
                                      <table border="0" cellpadding="0" cellspacing="0" width="50%" class="emailButton" style="background-color: #003061;">
                                        <tr>
                                          <td align="center" valign="middle" class="buttonContent" style="padding-top:15px;padding-bottom:15px;padding-right:15px;padding-left:15px;">
                                            <a style="color:#FFFFFF;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:20px;line-height:135%;" href="${url}" target="_blank">${urlText}</a>
                                          </td>
                                        </tr>
                                      </table>
    
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
    
              </table>
    
              <!-- footer -->
              <table bgcolor="#E1E1E1" border="0" cellpadding="0" cellspacing="0" width="500" id="emailFooter">
                <tr>
                  <td align="center" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" valign="top">
                          <table border="0" cellpadding="0" cellspacing="0" width="500" class="flexibleContainer">
                            <tr>
                              <td align="center" valign="top" width="500" class="flexibleContainerCell">
                                <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                  <tr>
                                    <td valign="top" bgcolor="#E1E1E1">
    
                                      <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#828282;text-align:center;line-height:120%;">
                                        <div>Copyright &#169; 2022. All rights reserved.</div>
                                        <div>If you don't want to receive these emails from us in the future, please <a href="https://app.omegaconstructionmanagement.com/profile" target="_blank" style="text-decoration:none;color:#828282;"><span style="color:#828282;">unsubscribe</span></a></div>
                                      </div>
    
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- // end of footer -->
    
            </td>
          </tr>
        </table>
      </center>
    </body>
    
    </html>`
}
const db = require("../models");
const passport = require('passport');

require('dotenv').config();

const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const keys = require("../keys");

const gmailClientId = keys.gmail_credentials.gmailClientId;
const gmailClientSecret = keys.gmail_credentials.gmailClientSecret;
const gmailRefreshToken = keys.gmail_credentials.gmailRefreshToken;


const oauth2Client = new OAuth2(
    gmailClientId, // ClientID
    gmailClientSecret, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
    refresh_token: gmailRefreshToken
});

const accessToken = oauth2Client.getAccessToken();

const smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: "applications.nickramsay@gmail.com",
        clientId: gmailClientId,
        clientSecret: gmailClientSecret,
        refreshToken: gmailRefreshToken,
        accessToken: accessToken
    }
});

module.exports = {

    login: (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            console.log(err);
            if (err) {
                return res.status(500).json({ message: 'Server error during login' });
            }

            if (!user) {
                return res.status(400).json({ message: info.message || 'Login failed' });
            }

            req.logIn(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Session error' });
                }

                return res.json({
                    message: 'Login successful',
                    user: {
                        id: user._id,
                        email: user.email
                    }
                });
            });
        })(req, res, next);
    },
    logout: (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: 'Logout error' });
            }
            res.json({ message: 'Logout successful' });
        });
    },
    getUser: (req, res) => {
        let currentPath = req.query.currentPath || '/';
        console.log(currentPath)
        if (req.isAuthenticated()) {
            res.json({
                user: {
                    firstname: req.user.firstname,
                    lastname: req.user.lastname,
                    email: req.user.email
                }
            });
        } else if (currentPath !== '/login') {
            res.status(401).json({ message: 'Not authenticated' });
        }
        else {
            res.json({ user: null });
        }
    },
    sendEmail: function (req, res) {
        console.log("Called send test e-mail controller...");

        //GMAIL CREDENTIALS BELOW...

        let mailOptions = {
            from: 'applications.nickramsay@gmail.com',
            to: messageParameters.recipientEmail,
            subject: '"' + messageParameters.subject + '" from ' + messageParameters.senderName,
            text: messageParameters.message
        };

        smtpTransport.sendMail(mailOptions, (error, response) => {
            error ? console.log(error) : "Email sent successfully ✅"
            smtpTransport.close();
        });
    },
    createAccount: function (req, res) {
        console.log("Called Create Account controller");
        db.User
            .create(req.body)
            .then(dbModel => res.json(dbModel))
            .then(console.log(req.body))
            .catch(err => res.status(422).json(err));
    },
    checkExistingAccountEmails: function (req, res) {
        console.log("Called check existing account emails controller...");
        console.log(req.body);
        db.User
            .find({ email: req.body[0] }, { email: 1, _id: 0 }).sort({})
            .then(dbModel => { res.json(dbModel[0]) })
            .catch(err => res.status(422).json(err));
    },
    setEmailVerficationToken: function (req, res) {
        console.log("Called check set e-mail verification token controller...");
        let email = req.body.email;
        let emailVerificationToken = Math.floor((Math.random() * 999999) + 100000).toString();

        db.UserCreationRequests
            .replaceOne({ email: email }, { email: email, emailVerificationToken: emailVerificationToken }, { upsert: true })
            .then(dbModel => {
                res.json(dbModel[0]),
                    smtpTransport.sendMail({
                        from: 'applications.nickramsay@gmail.com',
                        to: email,
                        subject: "Your Email Verification Code from Next.js Mongo Passport Template",
                        text: "Your e-mail verification code is: " + emailVerificationToken
                    }, (error, response) => {
                        error ? console.log(error) : console.log(response);
                        smtpTransport.close();
                    })
            })
            .catch(err => res.status(422).json(err));
    },
    resetPasswordRequest: function (req, res) {

        console.log("Called reset password request controller...");
        let email = req.body.email;
        let resetCode = Math.floor((Math.random() * 999999) + 100000).toString();

        db.ResetPasswordRequests
            .replaceOne({ email: email }, { email: email, resetCode: resetCode }, { upsert: true })
            .then(dbModel => {
                    res.json(dbModel),
                    smtpTransport.sendMail({
                        from: 'applications.nickramsay@gmail.com',
                        to: email,
                        subject: "Your Password Reset Code",
                        text: "Your password reset code is: " + resetCode
                    }, (error, response) => {
                        error ? console.log(error) : console.log(response);
                        smtpTransport.close();
                    })
            })
            .catch(err => res.status(422).json(err));
    },
    checkEmailAndToken: function (req, res) {
        console.log("Called check email and token controller...");
        db.User
            .find({ email: req.body.email, passwordResetToken: req.body.resetToken }, { email: 1 })
            .then(dbModel => res.json(dbModel[0]))
            .catch(err => res.status(422).json(err));
    },
    resetPassword: function (req, res) {
        async function hashPassword(plainPassword) {
            const saltRounds = 10;
            return await bcrypt.hash(plainPassword, saltRounds);
        }

        console.log("Called reset password controller...");
        db.ResetPasswordRequests.findOne({ email: req.body.email, resetCode: req.body.resetCode }).then(async (dbModel) => {
            console.log(dbModel);
            if (dbModel) {
                const hashedPassword = await hashPassword(req.body.newPassword);
                db.User.updateOne({ email: req.body.email }, { password: hashedPassword })
                    .then(() => {
                        res.json({ success: true, message: "Password reset successfully" });
                    })
                    .catch(err => res.status(422).json({ success: false, message: "Error resetting password", error: err }));
            } else {
                res.status(404).json({ success: false, message: "Invalid email or reset token" });
            }
        }).catch(err => res.status(422).json({ success: false, message: "Error checking reset request", error: err }));
    }
};
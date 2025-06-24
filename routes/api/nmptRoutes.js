const express = require('express');
const router = express.Router();
const nmptController = require("../../controllers/nmptController");

// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  console.log(req);
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};


//AUTHENTICATION_ROUTES START

router.post('/login', nmptController.login);
router.post('/logout', nmptController.logout);
router.get('/user', nmptController.getUser);

//AUTHENTICATION_ROUTES END


router
  .route("/send-email")
  .post(nmptController.sendEmail);

router
  .route("/set-email-verification-token")
  .post(nmptController.setEmailVerficationToken)

router
  .route("/create-account")
  .post(nmptController.createAccount); 

router
  .route("/check-existing-account-emails")
  .post(nmptController.checkExistingAccountEmails);

router
  .route("/reset-password-request")
  .post(nmptController.resetPasswordRequest);

router
  .route("/check-email-and-reset-token")
  .post(nmptController.checkEmailAndToken);

router
  .route("/reset-password")
  .post(nmptController.resetPassword);

module.exports = router;

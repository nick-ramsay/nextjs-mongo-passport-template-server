const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    console.log(password);
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return done(null, false, { message: 'No user found with that email' });
      }
      
      console.log("Found user: ", user);
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (isMatch) {
        console.log("Matched password");
        return done(null, user);
      } else {
          console.log("Wrong password");
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (error) {
      return done(error);
    }
  }));
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}; 
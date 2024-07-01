const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET; // Replace with your secret key

const User = require('../models/user'); // Assuming you have a User model

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret
}, async (jwtPayload, done) => {
  try {
    const user = await User.findById(jwtPayload.sub);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

const authenticate = passport.authenticate('jwt', { session: false });

module.exports = {
  authenticate,
  passport
};

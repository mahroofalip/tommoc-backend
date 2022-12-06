const passport = require('passport')
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const dotenv = require('dotenv');
dotenv.config();
const ExtractJWT = passportJWT.ExtractJwt;const 
User = require('./Models/User')
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey   : process.env.JWT_SECRET
},
 function (jwtPayload, done) {
   return User.findById(jwtPayload.sub)
   .then(user => 
   {
     return done(null, user);
   }
 ).catch(err => 
 {
   return done(err);
 });
}
))
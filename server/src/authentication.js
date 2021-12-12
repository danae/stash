const passportHttp = require('passport-http');
const passportJwt = require('passport-jwt');

const User = require('./models/user');


// Define the basic authentication strategy
module.exports.basicStrategy = function(app) {
  return new passportHttp.BasicStrategy(async function(email, password, done) {
    try {
      // Get the user from the database
      const user = await User.findOne({email: email});
      if (user == null) {
        app.locals.logger.verbose(`Basic authentication failed: Incorrect user`);
        return done(null, false);
      }

      // Check if the password of the user matches
      const passwordMatches = await user.comparePassword(password);
      if (!passwordMatches) {
        app.locals.logger.verbose(`Basic authentication failed: Incorrect password for user "${user._id}"`);
        return done(null, false);
      }

      // Return the authenticated user
      app.locals.logger.verbose(`Basic authentication succeeded for user "${user._id}"`)
      return done(null, user);
    } catch (err) {
      // Handle the error
      app.locals.logger.error(err);
      return done(err, false);
    }
  });
};

// Define the JWT authentication strategy
module.exports.jwtStrategy = function(app) {
  return new passportJwt.Strategy({
    secretOrKey: app.locals.serverAuthSecret,
    jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    algorithms: ['HS256']
  }, async function(jwt_payload, done) {
    try {
      // Get the user from the database
      const user = await User.findOne({_id: jwt_payload.sub});
      if (user == null) {
        app.locals.logger.verbose(`JWT authentication failed: Incorrect user`);
        return done(null, false);
      }

      // Return the authenticated user
      app.locals.logger.verbose(`JWT authentication succeeded for user "${user._id}"`)
      return done(null, user);
    } catch (err) {
      // Handle the error
      app.locals.logger.error(err);
      return done(err, false);
    }
  });
};

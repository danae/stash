const passportHttp = require('passport-http');
const passportJwt = require('passport-jwt');

const User = require('./models/user');


// Define the basic authentication strategy
module.exports.basicStrategy = function(app) {
  return new passportHttp.BasicStrategy(async function(email, password, done) {
    try {
      // Get the user from the database
      const user = await User.findOne({email: email});
      if (user == null)
        return done(null, false, {message: 'Incorrect username'});

      // Check if the password of the user matches
      const passwordMatches = await user.comparePassword(password);
      if (!passwordMatches)
        return done(null, false, {message: 'Incorrect password'});

      // Return the authenticated user
      return done(null, user);
    } catch (err) {
      // Handle the error
      return done(err, false);
    }
  })
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
      if (user == null)
        return done(null, false, {message: 'Incorrect user'});

      // Return the authenticated user
      return done(null, user);
    } catch (err) {
      // Handle the error
      return done(err, false);
    }
  });
};

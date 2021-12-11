const httpError = require('http-errors');
const passport = require('passport');


// Wrap a middleware function in another function that handles errors
module.exports.wrap = function(middleware) {
  return async function(req, res, next) {
    try {
      return await middleware(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};


// Authenticate a request
module.exports.authenticate = function(strategy) {
  return function(req, res, next) {
    return passport.authenticate(strategy, function(err, user) {
      // Check if there is an error
      if (err)
        return next(err);

      // Check if the user is authenticated
      if (!user)
        return next(httpError.Unauthorized());

      // Assign the authorized user to the request
      req.authUser = user;

      // Handle the next middleware
      return next();
    })(req, res, next);
  };
};

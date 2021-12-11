const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const wrapErrors = require('../utils/wrapErrors');

const User = require('../models/user');


// Configure the router
module.exports = function(app) {
  // Create the router
  const router = express.Router();

  // Authenticate a user and return a JWT token
  router.post('/token',
    passport.authenticate('basic', {session: false, assignProperty: 'authUser'}),
    wrapErrors(async function(req, res, next) {
      // Create a JWT for the user
      app.locals.logger.verbose(`Creating an access token for user with identifier "${req.authUser._id}"...`);
      const jwt = app.locals.generateJwt(req.authUser);

      // Respond with the JWT
      return res.json({accessToken: jwt});
    }));

  // Return the router
  return router;
}

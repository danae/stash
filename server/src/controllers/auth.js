const express = require('express');
const jwt = require('jsonwebtoken');

const requestUtils = require('../utils/requestUtils');

const User = require('../models/user');


// Configure the router
module.exports = function(app) {
  // Create the router
  const router = express.Router();

  // Authenticate a user and return a JWT token
  router.post('/token',
    requestUtils.authenticate('basic'),
    requestUtils.wrap(async function(req, res, next) {
      // Create a JWT for the user
      const jwt = app.locals.generateJwt(req.authUser);

      // Respond with the JWT
      return res.json({accessToken: jwt});
    }));

  // Return the router
  return router;
}

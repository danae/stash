const express = require('express');
const httpError = require('http-errors');
const passport = require('passport');
const validate = require('validate.js');

const getMetadata = require('../utils/getMetadata');
const wrapErrors = require('../utils/wrapErrors');

const Item = require('../models/item');
const User = require('../models/user');


// Configure the router
module.exports = function(app) {
  // Create the router
  const router = express.Router();

  // Create the routes
  router.get('/',
    wrapErrors(async function(req, res, next) {
      // Get the URL from the request
      const url = req.query?.url;
      if (url === undefined)
        throw httpError.BadRequest('No "url" parameter has been provided in the query parameters');

      // Get the metadata of the item ad respond
      const metadata = await getMetadata(url);
      return res.json(metadata);
    }));

  // Return the router
  return router;
};

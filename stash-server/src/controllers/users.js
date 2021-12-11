const express = require('express');
const httpError = require('http-errors');
const validate = require('validate.js');

const requestUtils = require('../utils/requestUtils');

const User = require('../models/user');


// Configure the router
module.exports = function(app) {
  // Create the router
  const router = express.Router();

  // Fetch a user from a parameter
  router.param('id', async function(req, res, next, id) {
    try {
      // Get the user from the database
      req.user  = await User.findOne({_id: id});
      if (req.user  === null)
        throw new httpError.NotFound(`A user with identifier "${id}" could not be found`);

      // Handle the request
      next();
    } catch (err) {
      // Handle the error
      next(err);
    }
  });

  // Create the routes
  router.post('/',
    requestUtils.wrap(async function(req, res, next) {
      // Validate the data
      const validator = {
        email: {presence: true, type: 'string', email: true},
        password: {presence: true, type: 'string', length: {minimum: 8}},
        name: {presence: true, type: 'string', length: {maximum: 32}},
        title: {type: 'string', length: {maximum: 64}},
        description: {type: 'string', length: {maximum: 512}},
        avatarUrl: {type: 'string', url: true},
        hidden: {type: 'boolean'},
      };

      const errors = validate.validate(req.body, validator);
      if (errors !== undefined)
        throw new httpError.UnprocessableEntity(Object.values(errors).join(', '));

      // Create the user
      const user = new User();

      user._id = app.locals.generateId();
      user.email = req.body.email;
      user.name = req.body.name;
      user.title = req.body.title ?? null;
      user.description = req.body.description ?? null;
      user.avatarUrl = req.body.avatarUrl ?? null;
      user.hidden = req.body.hidden ?? false;

      await user.hashPassword(req.body.password);
      await user.save();

      // Respond with the user
      return res.status(201).json(user);
    }));

  router.get('/',
    requestUtils.wrap(async function(req, res, next) {
      // Get the users from the database and respond with the users
      const users = await User.find();
      return res.json(users);
    }));

  router.get('/me',
    requestUtils.authenticate('jwt'),
    requestUtils.wrap(async function(req, res, next) {
      // Respond with the current user
      return res.json(req.authUser);
    }));

  router.get('/:id',
    requestUtils.wrap(async function(req, res, next) {
      // Respond with the user
      return res.json(req.user);
    }));

  router.patch('/me',
    requestUtils.authenticate('jwt'),
    requestUtils.wrap(async function(req, res, next) {
      // Validate the data
      const validator = {
        email: {type: 'string', email: true},
        password: {type: 'string', length: {minimum: 8}},
        name: {type: 'string', length: {maximum: 32}},
        title: {type: 'string', length: {maximum: 64}},
        description: {type: 'string', length: {maximum: 512}},
        avatarUrl: {type: 'string', url: true},
        hidden: {type: 'boolean'},
      };

      const errors = validate.validate(req.body, validator);
      if (errors !== undefined)
        throw new httpError.UnprocessableEntity(Object.values(errors).join(', '));

      // Update the current user
      const user = req.authUser;

      if (req.body.email !== undefined)
        user.email = req.body.email;
      if (req.body.name !== undefined)
        user.name = req.body.name;
      if (req.body.title !== undefined)
        user.title = req.body.title;
      if (req.body.description !== undefined)
        user.description = req.body.description;
      if (req.body.avatarUrl !== undefined)
        user.avatarUrl = req.body.avatarUrl;
      if (req.body.hidden !== undefined)
        user.hidden = req.body.hidden;

      if (req.body.password !== undefined)
        await user.hashPassword(req.body.password);
      await user.save();

      // Respond with the user
      return res.json(user);
    }));

  router.delete('/me',
    requestUtils.authenticate('jwt'),
    requestUtils.wrap(async function(req, res, next) {
      // Delete the current user and respond with no content
      await User.deleteOne({_id: req.authUser._id});
      return res.status(204).end();
    }));

  // Return the router
  return router;
};

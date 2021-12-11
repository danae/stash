const express = require('express');
const httpError = require('http-errors');
const passport = require('passport');
const validate = require('validate.js');

const wrapErrors = require('../utils/wrapErrors');

const Item = require('../models/item');
const User = require('../models/user');


// Configure the router
module.exports = function(app) {
  // Create the router
  const router = express.Router();

  // Fetch an item from a parameter
  router.param('id', async function(req, res, next, id) {
    try {
      // Get the item from the database
      req.item  = await Item.findOne({_id: id});
      if (req.item  === null)
        throw new httpError.NotFound(`An item with identifier "${id}" could not be found`);

      // Handle the request
      next();
    } catch (err) {
      // Handle the error
      next(err);
    }
  });

  // Create the routes
  router.post('/',
    passport.authenticate('jwt', {session: false, assignProperty: 'authUser'}),
    wrapErrors(async function(req, res, next) {
      // Validate the data
      const validator = {
        title: {presence: true, type: 'string', length: {maximum: 64}},
        description: {type: 'string', length: {maximum: 512}},
        linkUrl: {type: 'string', url: true},
        imageUrl: {type: 'string', url: {allowDataUrl: true}},
        category: {type: 'string'},
        tags: {type: 'array'},
        hidden: {type: 'boolean'},
      };

      const errors = validate.validate(req.body, validator);
      if (errors !== undefined)
        throw new httpError.UnprocessableEntity(Object.values(errors).join(', '));

      // Create the item
      const item = new Item();

      item._id = app.locals.generateId();
      item.owner = req.authUser;
      item.title = req.body.title;
      item.description = req.body.description ?? '';
      item.linkUrl = req.body.linkUrl ?? null;
      item.imageUrl = req.body.imageUrl ?? null;
      item.category = req.body.category ?? null;
      item.tags = req.body.tags ?? [];
      item.hidden = req.body.hidden ?? false;

      await item.save();

      // Respond with the item
      return res.status(201).json(item);
    }));

  router.get('/',
    wrapErrors(async function(req, res, next) {
      // Get the items from the database and respond with the items
      const items = await Item.find();
      return res.json(items);
    }));

  router.get('/:id',
    wrapErrors(async function(req, res, next) {
      // Respond with the item
      return res.json(req.item);
    }));

  router.patch('/:id',
    passport.authenticate('jwt', {session: false, assignProperty: 'authUser'}),
    wrapErrors(async function(req, res, next) {
      // Validate the data
      const validator = {
        title: {type: 'string', length: {maximum: 64}},
        description: {type: 'string', length: {maximum: 512}},
        linkUrl: {type: 'string', url: true},
        imageUrl: {type: 'string', url: {allowDataUrl: true}},
        category: {type: 'string'},
        tags: {type: 'array'},
        hidden: {type: 'boolean'},
      };

      const errors = validate.validate(req.body, validator);
      if (errors !== undefined)
        throw new httpError.UnprocessableEntity(Object.values(errors).join(', '));

      // Update the item
      const item = req.item;

      if (req.body.title !== undefined)
        item.title = req.body.title;
      if (req.body.description !== undefined)
        item.description = req.body.description;
      if (req.body.linkUrl !== undefined)
        item.linkUrl = req.body.linkUrl;
      if (req.body.imageUrl !== undefined)
        item.imageUrl = req.body.imageUrl;
      if (req.body.category !== undefined)
        item.category = req.body.category;
      if (req.body.tags !== undefined)
        item.tags = req.body.tags;
      if (req.body.hidden !== undefined)
        item.hidden = req.body.hidden;

      await item.save();

      // Respond with the item
      return res.json(item);
    }));

  router.delete('/:id',
    passport.authenticate('jwt', {session: false, assignProperty: 'authUser'}),
    wrapErrors(async function(req, res, next) {
      // Delete the item and respond with no content
      await Item.deleteOne({_id: req.item._id});
      return res.status(204).end();
    }));

  // Return the router
  return router;
};

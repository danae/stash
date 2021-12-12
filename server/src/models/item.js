const mongoose = require('mongoose');

const User = require('./user');


// Create the item schema
const itemSchema = new mongoose.Schema({
  _id: {type: String, required: true},
  ownerId: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String},
  linkUrl: {type: String},
  imageUrl: {type: String},
  category: {type: String},
  tags: {type: [String]},
  hidden: {type: Boolean, required: true},
}, {
  collection: 'items',
  versionKey: '_version',
  timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'},
});

// Set the JSON options
itemSchema.options.toJSON = {
  versionKey: false,
  transform: function(doc, ret, options) {
    ret.id = doc._id;

    delete ret._id;
    return ret;
  },
};

// Virtual method to get or set the owner
itemSchema.virtual('owner')
  .get(function() {
    return this.ownerId !== null ? User.findOne({_id: this.ownerId}) : null;
  })
  .set(function(owner) {
    this.ownerId = owner._id;
  });

// Create and export the item model
module.exports = mongoose.model('Item', itemSchema);

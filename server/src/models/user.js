const bcrypt = require('bcrypt');
const mongoose = require('mongoose');


// Create the user schema
const userSchema = new mongoose.Schema({
  _id: {type: String, required: true},
  email: {type: String, required: true},
  passwordHash: {type: String, required: true},
  name: {type: String, required: true},
  title: {type: String},
  description: {type: String},
  avatarUrl: {type: String},
  hidden: {type: Boolean, required: true},
}, {
  collection: 'users',
  versionKey: '_version',
  timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'},
});

// Set the JSON options
userSchema.options.toJSON = {
  versionKey: false,
  transform: function(doc, ret, options) {
    ret.id = doc._id;

    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
};

// Method to hash the password
userSchema.methods.hashPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

// Method to compare the password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Create and export the user model
module.exports = mongoose.model('User', userSchema);

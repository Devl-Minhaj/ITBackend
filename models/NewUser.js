// models/NewUser.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    phoneNumber: String,
});
  
  
  module.exports =mongoose.model('NewUser', userSchema);
  
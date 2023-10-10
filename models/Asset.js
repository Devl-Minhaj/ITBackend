// models/Asset.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assetSchema =new Schema({
  UserName: String,
  SerialNumber: String,
  RAM: String,
  HDD: String,
  Processor: String,
  OS: String,
  Office: String,
  LanNo: String,
  AssetType: String,
  Location: String,
  Designation: String,
  empHistory:Array
});

module.exports =mongoose.model('Assets', assetSchema);

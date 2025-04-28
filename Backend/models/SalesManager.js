// models/SalesManager.js

const mongoose = require("mongoose");

const SalesManagerSchema = new mongoose.Schema({
  name: String,
  address: String,
  contact: String,
  email: { type: String, unique: true },
  gstin: String,
});

module.exports = mongoose.model("SalesManager", SalesManagerSchema);

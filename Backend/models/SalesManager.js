const mongoose = require("mongoose");

const SalesManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  contact: { type: String },
  email: { type: String },
  gstin: { type: String },
});

const SalesManager = mongoose.model("SalesManager", SalesManagerSchema);

module.exports = SalesManager;

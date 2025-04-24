// models/Client.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  name: String,
  address: String,
  contact: String,
  email: { type: String, unique: true },
  gstin: String,
});

module.exports = mongoose.model("Client", ClientSchema);

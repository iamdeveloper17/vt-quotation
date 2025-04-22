const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  model: String,
  hsn: String,
  price: Number,
  gst: Number
});

module.exports = mongoose.model("Item", ItemSchema);

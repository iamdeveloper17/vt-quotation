const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  description: String,
  model: String,
  hsn: String,
  quantity: Number,
  unit: String,
  price: Number,
  gst: Number,
  gstAmount: Number,
  totalAmount: Number,
});

const PurchaseOrderSchema = new mongoose.Schema({
  purchaseNumber: Number,
  date: String,
  orderAgainst: String,
  deliveryPeriod: String,
  placeInstallation: String,

  companyName: String,
  companyAddress: String,
  companyContact: String,
  companyEmail: String,
  companyGSTIN: String,

  clientName: String,
  clientAddress: String,
  clientContact: String,
  clientEmail: String,
  clientGSTIN: String,

  items: [PurchaseSchema],
  terms: String,
  subTotal: Number,
  totalGST: Number,
  grandTotal: Number,
  userEmail: String,
}, { timestamps: true });

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);

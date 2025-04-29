const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  quotationNumber: Number,
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
  date: String,
  validUntil: String,
  items: [
    {
      description: String,
      hsn: String,
      quantity: Number,
      unit: String,
      price: Number,
      gst: Number,
      gstAmount: Number,
      totalAmount: Number,
      model: String,
      hasFeature: Boolean,           // ✅ Add this
      feature: String                // ✅ Add this
    },
  ],
  subTotal: Number,
  totalGST: Number,
  grandTotal: Number,
  terms: String,
  footerNote: String,
  userEmail: String,
  purchaseNumber: Number,
  orderAgainst: String,
  deliveryPeriod: String,
  placeInstallation: String
});

  const counterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
  });

  const Counter = mongoose.model("Counter", counterSchema);

  const InvoiceModel = mongoose.model("invoices", InvoiceSchema)
  module.exports = { InvoiceModel, Counter }
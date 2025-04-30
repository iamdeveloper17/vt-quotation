const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  visiblePassword: String, // new field to store actual password
  role: {
    type: String,
    enum: ['admin', 'manager', 'tender', 'accounts'], 
    // default: "user", // user or admin
  },
  canCreateQuotation: {
    type: Boolean,
    default: false,
  },
  canCreatePurchaseOrder: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Employee", EmployeeSchema);

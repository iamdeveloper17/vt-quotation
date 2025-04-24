// const mongoose = require('mongoose')

// const EmployeeSchema = new mongoose.Schema({
//     name: String,
//     email: String,
//     password: String,
//     number: Number,
//     companyName: String,
//     taxID: String,
//     userType: String,
//     role: {
//         type: String,
//         enum: ['admin', 'user'],
//         default: 'user' // Default role is user
//       }
// })

// const EmployeeModel = mongoose.model("employees", EmployeeSchema)
// module.exports = EmployeeModel

// models/Employee.js or wherever your user schema is defined
const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
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

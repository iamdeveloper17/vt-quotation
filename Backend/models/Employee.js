const mongoose = require('mongoose')

const EmployeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    number: Number,
    companyName: String,
    taxID: String,
    userType: String,
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user' // Default role is user
      }
})

const EmployeeModel = mongoose.model("employees", EmployeeSchema)
module.exports = EmployeeModel
// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// const User = mongoose.model('User', userSchema);
// export default User;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    taxID: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ["admin", "employee", "user"], // Optional: Set allowed roles
        default: "user"
    }
}, { timestamps: true });

// Hash Password Before Saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Create User Model
const User = mongoose.model("User", UserSchema);

module.exports = User;

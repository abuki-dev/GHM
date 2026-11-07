const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const usersSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["admin", "staff", "trainer", "member"],
  },
  gender: { type: String, enum: ["male", "female", "other"] },
  age: { type: Number },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: [/^\d{10}$/, "Please fill a valid 10-digit phone number"],
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});
usersSchema.pre("validate", async function () {
  console.log("validating userId for document:");
  await incrementId(this, "userId");
});

const Users = mongoose.model("users", usersSchema);

module.exports = Users;

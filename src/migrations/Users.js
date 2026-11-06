const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["admin", "staff", "trainer", "member"],
  },
  phone: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});
const Users = mongoose.model("Users", usersSchema);
module.exports = Users;

const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.JS");

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
  phone: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});
usersSchema.pre("save", async function () {
  await incrementId(this, "userId");
});
const Users = mongoose.model("users", usersSchema);
module.exports = Users;

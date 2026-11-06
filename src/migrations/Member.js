const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  sex: { type: String, enum: ["male", "female"], required: true },
  age: { type: Number, required: true },
  weight: { type: Number, required: true },
  phone: { type: String, required: true },
});
module.exports = mongoose.model("Member", memberSchema);

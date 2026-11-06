const mongoose = require("mongoose");
const memberSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, ref: "Users" },
  gender: { type: String, required: true, enum: ["male", "female"] },
  dateOfBirth: { type: Date, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
});
const Member = mongoose.model("Members", memberSchema);
module.exports = Member;

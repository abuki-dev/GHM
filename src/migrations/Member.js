const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");
const memberSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "users",
    index: true,
    unique: true,
  },
  memberId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  dateOfBirth: { type: Date, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
});
memberSchema.pre("validate", async function () {
  await incrementId(this, "memberId");
});
const Members = mongoose.model("members", memberSchema);
module.exports = Members;

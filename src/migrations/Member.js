const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.JS");
const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
    ref: "users",
    index: true,
  },
  dateOfBirth: { type: Date, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
});
memberSchema.pre("save", async function () {
  await incrementId(this, "memberId");
});
const Member = mongoose.model("members", memberSchema);
module.exports = Member;

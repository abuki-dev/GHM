const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const membershpPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  duration_days: {
    type: Number,
    required: true,
    min: [1, "duration_days must be at least 1"],
    validate: {
      validator: Number.isInteger,
      message: "duration_days must be a whole number",
    },
  },
  price: {
    type: Number,
    required: true,
    min: [1, "price must be greater than 0"],
  },
  tier: { type: String, enum: ["vip", "vvip", "normal"], required: true },
  training_id: {
    type: String,
    ref: "trainings",
    index: true,
  },
  shiftId: {
    type: String,
    ref: "shifts",
    index: true,
  },
});
membershpPlanSchema.pre("validate", async function () {
  await incrementId(this, "planId");
});

membershpPlanSchema.index({ title: 1, tier: -1 }, { unique: true });
const MembershipPlan = mongoose.model("membershipplans", membershpPlanSchema);
module.exports = MembershipPlan;

const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const membershpPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  duration_days: { type: Number, required: true },
  tier: { type: String, enum: ["vip", "vvip", "normal"], required: true },
  price: { type: Number, required: true },
  training_id: {
    type: String,
    ref: "trainings",
    required: true,
    index: true,
  },
  shiftId: {
    type: String,
    ref: "shifts",
    required: true,
  },
});
membershpPlanSchema.pre("validate", async function () {
  await incrementId(this, "planId");
});
membershpPlanSchema.index({ title: 1, tier: -1 }, { unique: true });
const MembershipPlan = mongoose.model("membershipplans", membershpPlanSchema);
module.exports = MembershipPlan;

const mongoose = require("mongoose");

const membershpPlanSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true, index: true },
  Title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  duration_days: { type: Number, required: true },
  tier: { type: String, enum: ["vip", "vvip", "normal"], required: true },
  price: { type: Number, required: true },
  training_id: {
    type: String,
    ref: "Trainings",
    required: true,
  },
});
membershpPlanSchema.index({ tier: 1, price: -1 });
module.exports = mongoose.model("MembershipPlan", membershpPlanSchema);

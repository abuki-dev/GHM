const mongoose = require("mongoose");

const membershpPlanSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  Title: { type: String, required: true },
  description: { type: String, required: true },
  duration_days: { type: Number, required: true },
  tier: { type: String, enum: ["vip", "vvip", "normal"], required: true },
  price: { type: Number, required: true },
  training_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Training",
    required: true,
  },
});
module.exports = mongoose.model("MembershipPlan", membershpPlanSchema);

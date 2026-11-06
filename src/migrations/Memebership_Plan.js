const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const membershpPlanSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true, index: true },
  Title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  duration_days: { type: Number, required: true },
  tier: { type: String, enum: ["vip", "vvip", "normal"], required: true },
  price: { type: Number, required: true },
  training_id: {
    type: String,
    ref: "trainings",
    required: true,
  },
});
membershpPlanSchema.pre("save", async function () {
  await incrementId(this, "planId");
});
membershpPlanSchema.index({ tier: 1, price: -1 });
module.exports = mongoose.model("membershipplans", membershpPlanSchema);

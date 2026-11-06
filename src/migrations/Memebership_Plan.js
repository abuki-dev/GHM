const mongoose = require("mongoose");

const membershipPurchaseSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  membership_plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MembershipPlan",
    required: true,
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired"], required: true },
});
module.exports = mongoose.model("MembershipPurchase", membershipPurchaseSchema);

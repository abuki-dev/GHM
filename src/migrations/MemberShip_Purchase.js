const mongoose = require("mongoose");

const membershipPurchaseSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true, index: true },
  member_id: {
    type: String,
    ref: "Members",
    required: true,
    index: true,
  },
  membership_plan_id: {
    type: String,
    ref: "MembershipPlans",
    required: true,
  },
  payment_id: {
    type: String,
    ref: "Payments",
    required: true,
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "expired"],
    required: true,
    index: true,
  },
});
module.exports = mongoose.model("MembershipPurchase", membershipPurchaseSchema);

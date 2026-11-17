const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const membershipPurchaseSchema = new mongoose.Schema({
  purchaseId: { type: String, required: true, unique: true, index: true },
  member_id: {
    type: String,
    ref: "users",
    required: true,
    index: true,
  },
  membership_plan_id: {
    type: String,
    ref: "membershipplans",
    required: true,
  },
  payment_id: {
    type: String,
    ref: "payments",
    required: true,
    unique: true,
  },
  start_date: { type: Date, required: true, index: true },
  end_date: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ["active", "expired", "frozen", "pending", "upcoming", "cancelled"],
    default: "active",
    required: true,
    index: true,
  },
});
membershipPurchaseSchema.pre("validate", async function () {
  await incrementId(this, "purchaseId");
});
const MembershipPurchase = mongoose.model(
  "membershippurchases",
  membershipPurchaseSchema,
);
module.exports = MembershipPurchase;

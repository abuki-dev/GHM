const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.JS");

const membershipPurchaseSchema = new mongoose.Schema({
  purchaseId: { type: String, required: true, unique: true, index: true },
  member_id: {
    type: String,
    ref: "members",
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
membershipPurchaseSchema.pre("save", async function () {
  await incrementId(this, "purchaseId");
});
module.exports = mongoose.model("MembershipPurchase", membershipPurchaseSchema);

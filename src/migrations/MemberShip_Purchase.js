const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const membershipPurchaseSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, required: true, unique: true, index: true },
    member_id: {
      type: String,
      ref: "users",
      required: true,
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
      index: true,
    },
    freezeUntill: { type: Date, default: null },
    freezeStartedAt: { type: Date, default: null },
    freezeDaysUsed: { type: Number, default: 0 },
    remindersSent: { type: [Number], default: [] },
    expiredNotifiedAt: { type: Date, default: null },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "expired", "frozen", "pending", "upcoming", "cancelled"],
      default: "active",
      required: true,
      index: true,
    },
    shiftId: {
      type: String,
      ref: "shifts",
      index: true,
    },
  },
  { timestamps: true },
);
membershipPurchaseSchema.pre("validate", async function () {
  await incrementId(this, "purchaseId");
});
membershipPurchaseSchema.index(
  { member_id: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["active", "frozen"] } },
  },
);
const MembershipPurchase = mongoose.model(
  "membershippurchases",
  membershipPurchaseSchema,
);
module.exports = MembershipPurchase;

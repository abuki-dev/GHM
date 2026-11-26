const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, ref: "users" },
    planId: { type: String, required: true, ref: "membershipplans" },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    method: {
      type: String,
      required: true,
      enum: ["CBE", "BOA", "Dashen", "teleBirr", "manual"],
    },
    category: {
      type: String,
      required: true,
      enum: ["new", "renew"],
      default: "new",
    },
    status: {
      type: String,
      index: true,
      enum: [
        "pending",
        "processing",
        "verified",
        "failed",
        "cancelled",
        "refund_pending",
        "refunded",
      ],
      default: "pending",
    },
    reason: { type: String, default: "unknown", index: true, required: true },
    verifiedBy: { type: String, ref: "users", index: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);
paymentSchema.index({ userId: 1, date: 1 });
paymentSchema.index({ transactionId: 1, method: 1 }, { unique: true });
const Payment = mongoose.model("payments", paymentSchema);
module.exports = Payment;

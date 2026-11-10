const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "users" },
  planId: { type: String, required: true, ref: "membershipplans" },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  status: {
    type: String,
    default: "pending",
    enum: ["verified", "pending", "failed"],
  },
  verifiedBy: { type: String, ref: "users", index: true },
  date: { type: Date, default: Date.now ,index:true},
});
paymentSchema.index({ userId: 1, status: 1 });
const Payment = mongoose.model("payments", paymentSchema);
module.exports = Payment;

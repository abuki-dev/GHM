const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "users" },
  planId: { type: String, required: true, ref: "membershipplans" },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  method: {
    type: String,
    required: true,
    enum: ["CBE", "BOA", "Dashen", "teleBirr"],
  },
  status: {
    type: String,
    default: "pending",
    index: true,
    enum: ["verified", "pending", "failed"],
  },
  verifiedBy: { type: String, ref: "users", index: true },
  date: { type: Date, default: Date.now, index: true },
});
paymentSchema.index({ userId: 1, date: 1 });
paymentSchema.index({ transactionId: 1, method: 1 }, { unique: true });
const Payment = mongoose.model("payments", paymentSchema);
module.exports = Payment;

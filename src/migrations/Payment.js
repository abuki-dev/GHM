const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "Users" },
  planId: { type: String, required: true, ref: "Plans" },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  status: {
    type: String,
    required: true,
    enum: ["verified", "pending", "failed"],
  },
  verifiedBy: { type: String, required: true, ref: "Users", index: true },
  date: { type: Date, default: Date.now },
});
paymentSchema.index({ userId: 1, status: 1 });
const Payment = mongoose.model("Payments", paymentSchema);
module.exports = Payment;

const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "Users" },
  planid: { type: String, required: true, ref: "Plans" },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  status: {
    type: String,
    required: true,
    enum: ["verified", "pending", "failed"],
  },
  verifiedBy: { type: String, ref: "Users" },
  date: { type: Date, default: Date.now },
});
const Payment = mongoose.model("Payments", paymentSchema);
module.exports = Payment;

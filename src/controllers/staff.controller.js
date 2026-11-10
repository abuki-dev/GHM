const { Payment, Member } = require("../migrations");

module.exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    payment.status = "approved";
    payment.verifiedBy = req.user.userId;
    await payment.save();
    res.json({ message: "Payment approved successfully", payment });
  } catch (error) {
    next(error);
  }
};

module.exports.getPendingPayments = async (req, res, next) => {
  try {
    const pendingPayments = await Payment.find({ status: "pending" });
    res.json({ pendingPayments });
  } catch (error) {
    next(error);
  }
};

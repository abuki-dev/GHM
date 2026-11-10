const { Payments, Member } = require("../migrations");

module.exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payments.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    payment.status = "verified";
    payment.verifiedBy = req.user.userId;
    await payment.save();

    res.json({ message: `payment verified Sucssfuly`, payment });
  } catch (error) {
    next(error);
  }
};

module.exports.declinePaymnet = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payments.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    payment.status = "failed";
    payment.verifiedBy = req.user.userId;
    await payment.save();

    res.json({ message: `payment Declined Sucssfuly`, payment });
  } catch (error) {
    next(error);
  }
};

module.exports.getPendingPayments = async (req, res, next) => {
  try {
    const pendingPayments = await Payments.find({ status: "pending" });
    res.json({ pendingPayments });
  } catch (error) {
    next(error);
  }
};

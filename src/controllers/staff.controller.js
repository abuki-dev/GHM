const { Payments, Member } = require("../migrations");
const {decline} = require("../services/staff.service");

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

module.exports.declinePayment = async (req, res, next) => {
  try {
    await decline(req.body);
    res.json({ message: `payment Declined sucussfully`, payment });
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

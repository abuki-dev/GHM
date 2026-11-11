const { Payments, Member } = require("../migrations");
const { findOne } = require("../migrations/Users");
const { decline } = require("../services/staff.service");

module.exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const staffId = req.user.id || req.user.userId;
    const payment = await satffService.approve({ paymentId }, { id: staffId });

    res.json({ message: `payment verified Sucssfuly`, payment });
  } catch (error) {
    next(error);
  }
};

module.exports.declinePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const staffId = req.user.id || req.user.userId;

    const payment = await satffService.approve({ paymentId }, { id: staffId });

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

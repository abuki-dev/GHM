const { Payments } = require("../migrations");
const { decline, sendPayments } = require("../services");
const { approve } = require("../services/staff.service");

module.exports.approvePayment = async (req, res, next) => {
  try {
    const payment = await approve(req.body, req.user);
    res.json({ message: `payment verified Sucssfuly`, payment });
  } catch (error) {
    next(error);
  }
};

module.exports.declinePayment = async (req, res, next) => {
  try {
    const payment = await decline(req.body, req.user);
    res.json({ message: `payment Declined sucussfully`, payment });
  } catch (error) {
    next(error);
  }
};

module.exports.getPendingPayments = async (req, res, next) => {
  try {
    const pendingPayments = await sendPayments(req.query.page);
    res.json({ pendingPayments });
  } catch (error) {
    next(error);
  }
};

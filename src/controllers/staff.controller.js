const { decline, sendPayments, approve } = require("../services");
const {
  refund,
  // renewPurchaseRequest,
  getRenewalPayments,
  manualCheckin,
  getTodaysAttendance,
} = require("../services/staff.service");

module.exports.approvePayment = async (req, res, next) => {
  try {
    const result = await approve(req.body, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports.declinePayment = async (req, res, next) => {
  try {
    const result = await decline(req.body, req.user);
    res.status(200).json(result);
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
module.exports.markPaymentRefunded = async (req, res, next) => {
  try {
    const payment = await refund(req.body);
    res.json({ message: "Refund marked complete", payment });
  } catch (error) {
    next(error);
  }
};
// module.exports.approveRenewal = async (req, res, next) => {
//   try {
//     const response = await renewPurchaseRequest(req.body, req.user);
//     res.json(response);
//   } catch (error) {
//     next(error);
//   }
// };
module.exports.renewalRequests = async (req, res, next) => {
  try {
    const renewalRequests = await getRenewalPayments(req.query.page);
    res.json({ renewalRequests });
  } catch (error) {
    next(error);
  }
};

module.exports.ManualCheckin = async (req, res, next) => {
  try {
    const response = await manualCheckin(req.body, req.user);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports.todaysAttendance = async (req, res, next) => {
  try {
    const response = await getTodaysAttendance(req.body, req.user);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

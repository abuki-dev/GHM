const {
  getMembershipPlans,
  getMemberSubscriptions,
  savePaymentInfos,
  getUsrePaymentHistory,
} = require("../services");
const memberService = require("../services/member.service");

// get all subscriptions from the database
module.exports.sendMembershipPlans = async (req, res, next) => {
  try {
    // here we use teh service to end all datas to the members
    const allPlans = await getMembershipPlans(req.query.page, req.user.id);
    res.status(200).json({ allPlans });
  } catch (error) {
    next(error);
  }
};
module.exports.sendMemberSubscriptions = async (req, res, next) => {
  try {
    //here we send the all subscriptions of the membe
    // console.log("Fetching subscriptions for userId:", req.user);
    const memberSubscriptions = await getMemberSubscriptions(
      req.user,
      req.query.page,
    );
    res.status(200).json({ memberSubscriptions });
  } catch (error) {
    next(error);
  }
};
module.exports.purchaseForPlan = async (req, res, next) => {
  try {
    const message = await savePaymentInfos(req.body, req.user);
    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};
module.exports.sendHistory = async (req, res, next) => {
  try {
    const paymentHistory = await getUsrePaymentHistory(req.user);
    res.json({ Hostory: paymentHistory });
  } catch (error) {
    next(error);
  }
};

module.exports.getGympass = async (req, res, next) => {
  try {
    const { qrToken, exp } = await memberService.generateGympass(req.user);
    res.status(200).json({
      qrToken,
      expiresAt: exp,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.requestRenewal = async (req, res, next) => {
  try {
    const message = await memberService.createRenewalRequest(
      req.body,
      req.user,
    );
    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

module.exports.getMyAttendance = async (req, res, next) => {
  try {
    const attendance = await memberService.getMyAttendance(
      req.query.page,
      req.user,
    );
    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

module.exports.cancelMyPayment = async (req, res, next) => {
  try {
    const payment = await memberService.cancelMyPayment(
      req.params.id,
      req.user,
    );
    res.json(payment);
  } catch (error) {
    next(error);
  }
};

module.exports.freezeMyMembership = async (req, res, next) => {
  try {
    const purchase = await memberService.freezeMyMembership(
      Number(req.body.days),
      req.user,
    );
    res.json(purchase);
  } catch (error) {
    next(error);
  }
};

module.exports.resumeMyMembership = async (req, res, next) => {
  try {
    const purchase = await memberService.resumeMyMembership(req.user);
    res.json(purchase);
  } catch (error) {
    next(error);
  }
};

module.exports.feedbacks = async (req, res, next) => {
  try {
    const feedback = await memberService.createFeedback(req.user, req.body);
    res.status(200).json(feedback);
  } catch (error) {
    next(error);
  }
};

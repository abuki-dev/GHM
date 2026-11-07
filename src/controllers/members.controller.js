const { getMembershipPlans } = require("../services");
const {
  getMemberSubscriptions,
  savePaymentInfos,
  getUsrePaymentHistory,
} = require("../services/member.service");

// get all subscriptions from the database
module.exports.sendMembershipPlans = async (req, res, next) => {
  try {
    // here we use teh service to end all datas to the members
    const allPlans = await getMembershipPlans(req.body.page);
    res.status(200).json({ allPlans });
  } catch (error) {
    next(error);
  }
};
module.exports.sendMemberSubscriptions = async (req, res, next) => {
  try {
    //here we send the all subscriptions of the member
    const memberId = req.user.userId;
    const memberSubscriptions = await getMemberSubscriptions(memberId);
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
    const paymentHistory = await getUsrePaymentHistory(req.user.userId);
    res.json({ Hostory: paymentHistory });
  } catch (error) {
    next(error);
  }
};

const {
  getMembershipPlans,
  getMemberSubscriptions,
  savePaymentInfos,
  getUsrePaymentHistory,
} = require("../services");

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
    //here we send the all subscriptions of the membe
    // console.log("Fetching subscriptions for userId:", req.user);
    const memberSubscriptions = await getMemberSubscriptions(req.user);
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

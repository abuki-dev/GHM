const {
  newtraining,
  newshift,
  removeshift,
  removetraining,
  newMembershipPlan,
} = require("./admin.service");
const { insertUser, loginUser, createStandard } = require("./auth.service");
const {
  getMembershipPlans,
  getUsrePaymentHistory,
  getMemberSubscriptions,
  savePaymentInfos,
  generateUserSession,
  generateGympass,
} = require("./member.service");
const { approve, decline, refund, sendPayments } = require("./staff.service");
module.exports = {
  getMembershipPlans,
  insertUser,
  loginUser,
  getUsrePaymentHistory,
  getMemberSubscriptions,
  savePaymentInfos,
  decline,
  refund,
  createStandard,
  sendPayments,
  newtraining,
  newshift,
  removeshift,
  removetraining,
  newMembershipPlan,
  approve,
  generateUserSession,
  generateGympass
};

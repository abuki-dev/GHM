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
} = require("./member.service");
const { approve, decline, sendPayments } = require("./staff.service");

module.exports = {
  getMembershipPlans,
  insertUser,
  loginUser,
  getUsrePaymentHistory,
  getMemberSubscriptions,
  savePaymentInfos,
  decline,
  createStandard,
  sendPayments,
  newtraining,
  newshift,
  removeshift,
  removetraining,
  newMembershipPlan,
  approve,
  generateUserSession,
};

const {
  newtraining,
  newshift,
  removeshift,
  removetraining,
} = require("./admin.service");
const { insertUser, loginUser, createStandard } = require("./auth.service");
const {
  getMembershipPlans,
  getUsrePaymentHistory,
  getMemberSubscriptions,
  savePaymentInfos,
} = require("./member.service");
const { decline, sendPayments } = require("./staff.service");

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
};

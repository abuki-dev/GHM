const { Router } = require("express");
const {
  sendMembershipPlans,
  sendMemberSubscriptions,
  purchaseForPlan,
  sendHistory,
  getGympass,
  requestRenewal,
} = require("../controllers/members.controller");

// te user gets all avalble subscriptons
const memberRouter = Router();

memberRouter.get("/allmembershipPlans", sendMembershipPlans);
memberRouter.get("/mysubscriptions", sendMemberSubscriptions);
memberRouter.post("/purchasePlan", purchaseForPlan);
memberRouter.get("/paymentHistory", sendHistory);
memberRouter.get("/gympass", getGympass);
memberRouter.post("/requestRenewal", requestRenewal);
module.exports = memberRouter;

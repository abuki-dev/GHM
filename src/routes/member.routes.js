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
// 1. Public Route: Guests can view plans & available shift spots before signing up
memberRouter.get("/plans", sendMembershipPlans);

// 3. Member Dashboard & Subscription Routes
memberRouter.get("/my-subscriptions", sendMemberSubscriptions);
memberRouter.get("/payment-history", sendHistory);
memberRouter.get("/gym-pass", getGympass);

memberRouter.post("/purchasePlan", purchaseForPlan);
memberRouter.post("/requestRenewal", requestRenewal);
module.exports = memberRouter;

const { Router } = require("express");
const {
  sendMembershipPlans,
  sendMemberSubscriptions,
  purchaseForPlan,
  sendHistory,
  getGympass,
  requestRenewal,
  getMyProfile,
  updateMyProfile,
  getMyAttendance,
  cancelMyPayment,
  freezeMyMembership,
  resumeMyMembership,
  feedbacks,
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

memberRouter.get("/profile", getMyProfile);
memberRouter.patch("/profile", updateMyProfile);
memberRouter.get("/attendance", getMyAttendance);
memberRouter.delete("/payments/:id", cancelMyPayment);
memberRouter.post("/membership/freeze", freezeMyMembership);
memberRouter.post("/membership/resume", resumeMyMembership);
memberRouter.post("/feedback", feedbacks);
module.exports = memberRouter;

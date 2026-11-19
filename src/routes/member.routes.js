const { Router } = require("express");
const {
  sendMembershipPlans,
  sendMemberSubscriptions,
  purchaseForPlan,
  sendHistory,
  getGympass,
  renewPurchase,
} = require("../controllers/members.controller");

// te user gets all avalble subscriptons
const memberRouter = Router();

memberRouter.get("/allmembershipPlans", sendMembershipPlans);
memberRouter.get("/mysubscriptions", sendMemberSubscriptions);
memberRouter.post("/purchasePlan", purchaseForPlan);
memberRouter.get("/paymentHistory", sendHistory);
memberRouter.get("/gympass", getGympass);
memberRouter.patch("/renewPurchase", renewPurchase);
module.exports = memberRouter;

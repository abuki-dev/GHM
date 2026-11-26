const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middlewares/auth");
const authRouter = require("./auth.router");
const memebrRouter = require("./member.routes");
const staffRouter = require("./staff.routes");
const adminRoutes = require("./admin.routes");
const trainerRouter = require("./trainer.routes");

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
router.use("/auth", authRouter);
router.use(authenticate);
router.use("/member", requireRole("member", "admin"), memebrRouter);

router.use("/staff", requireRole("staff", "admin"), staffRouter);
router.use("/admin", requireRole("admin"), adminRoutes);
router.use("/trainer", requireRole("trainer", "admin"), trainerRouter);
module.exports = router;
// validate transaction id at the staff service when approving and declining
// decline verfied apayemt issue
// reservation issue when declining payment and refunding
// transaction when account creating
// purchase renew N' 1 purchase at a time
//  renew started from the end date if puchased befor expiration and more than one puchase for 1 plan
// 1 day extra added for renew without expiration
// if expired buy a new purchase from date now
// one member can have 2 plans
// sending warning email for the users by checking every day status if remaining day is 5  and automatically expire after z day ends even before the checkin expire it
// fixing the gympass token generator generates for every pychase name token
// daysof teh week never enforced at the chekign

//--->

//-->>creatinng session for the user when they enter the gym inperson // must be staff ad and teh anmin whi does this
//-->>Fxiign the session time with the server time xone toem is now ethiopisn
// -->usinng difffrecnt Secrert for the gympass token generation and the jwt token generation
//--> adding capacity for each Tier no need for this
//-->>donot count capacity for the normal tier when aproving the payment
//-->SHIFT AND sessions are not linked to each other
// shift time ceration issue..?
// counting the plans for the users..?
// default start time for sesiion as froxem..?
//-->>gympass eroro handling
// -->plan id validation when creatung the payment
// new renew route for purchases and fixing approvign logics

//
// user renewpurchase purchase
// staff aproveRenewal

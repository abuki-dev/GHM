const {
  Payments,
  Member,
  MembershipPlans,
  Shifts,
  Users,
} = require("../migrations");
const MembershipPurchase = require("../migrations/MemberShip_Purchase");
const { BadRequestError } = require("../utils/app.errors");

module.exports.approve = async ({ transactionId }, { id, userId } = {}) => {
  const payment = await Payments.findOne({ transactionId });
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }

  const staffId = id || userId;

  if (payment.status !== "pending") {
    throw new BadRequestError("payment is not pending");
  }

  const existingPurchase = await MembershipPurchase.findOne({
    payment_id: payment._id,
  });
  if (existingPurchase) {
    ((payment.status = "verified"), (payment.verifiedBy = staffId));
    await payment.save();

    return { payment, membershipPurchase: existingPurchase };
  }

  const user = await Users.findOne({ userId: payment.userId });
  if (!user) {
    throw new BadRequestError("Member Not Found");
  }

  const plan = await MembershipPlans.findOne({ planId: payment.planId });
  if (!plan) {
    throw new BadRequestError("Membership Plan Not Found");
  }

  const shift = await Shifts.findOne({ shiftId: plan.shiftId });
  if (!shift) {
    throw new BadRequestError("Shift not found");
  }

  const plansOnShift = await MembershipPlans.find({
    shiftId: plan.shiftId,
  }).select("planId");

  const planIds = plansOnShift.map((item) => item.planId);

  const occupiedSpots = await membershipPurchase.countDocuments({
    membership_plan_id: { $in: planIds },
    status: "active",
    end_date: { $gt: new Date() },
  });

  if (occupiedSpots >= shift.max_capacity) {
    payment.status = "failed";
    payment.verifiedBy = staffId;
    await payment.save();

    throw new BadRequestError(
      "there is no spot available so the payment declined",
    );
  }
  let startDate = new Date();
  let endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(plan.duration_days || 30));

  const membershipPurchase = await MembershipPurchase.create({
    member_id: payment.userId || payment.member_id,
    membership_plan_id: payment.planId || payment.membership_plan_id,
    payment_id: payment.paymentId.toString(),
    start_date: startDate,
    end_date: endDate,
    status: "active",
  });

  payment.status = "verified";
  payment.verifiedBy = staffId;
  await payment.save();
  return { payment, membershipPurchase };
};
// paymentid user id nad planid
//
module.exports.decline = async ({ paymentId }, { id, userId } = {}) => {
  const payment = await Payments.findOne({ paymentId });
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }
  const staffId = id || userId;
  payment.status = "failed";
  payment.verifiedBy = staffId;
  await payment.save();

  const member = await Member.findOne({
    memberId: payment.userId,
  });
  if (member && member.subscriptions) {
    const pendingSub = member.subscriptions.find(
      (sub) => sub.status === "pending",
    );
    if (pendingSub) {
      pendingSub.status = "failed";
      await member.save();
    }
  }
  return payment;
};
module.exports.sendPayments = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  const filteredPayments = await Payments.aggregate([
    { $sort: { date: -1 } },
    { $match: { status: "pending" } },
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 0,
        userId: 1,
        planId: 1,
        amount: 1,
        status: 1,
        verifiedBy: 1,
        transactionId: 1,
        date: 1,
      },
    },
  ]);
  return filteredPayments;
};

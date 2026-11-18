const {
  Payments,
  Member,
  MembershipPlans,
  Shifts,
  Users,
  MembershipPurchase,
} = require("../migrations");
const { markPaymentRefunded } = require("../routes");
const { BadRequestError } = require("../utils/app.errors");

module.exports.approve = async ({ transactionId }, { id }) => {
  const payment = await Payments.findOneAndUpdate(
    { transactionId, status: "pending" },
    { $set: { status: "processing", verifiedBy: id } },
    { new: true },
  );

  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }

  const staffId = id;


  const user = await Users.findOne({ userId: payment.userId });
  if (!user) {
    throw new BadRequestError("Member Not Found");
  }

  const plan = await MembershipPlans.findOne({ planId: payment.planId });
  if (!plan) {
    throw new BadRequestError("Membership Plan Not Found");
  }

  if (plan.tier !== "normal") {
    const shift = await Shifts.findOne({ shiftId: plan.shiftId });
    if (!shift) {
      throw new BadRequestError("Shift not found");
    }

    const plansOnShift = await MembershipPlans.find({
      shiftId: plan.shiftId,
    }).select("planId");

    const planIds = plansOnShift.map((item) => item.planId);
    const occupiedSpots = await MembershipPurchase.countDocuments({
      membership_plan_id: { $in: planIds },
      status: "active",
      end_date: { $gt: new Date() },
    });

  if (occupiedSpots >= shift.max_capacity) {
    payment.status = "refund_pending";
    payment.verifiedBy = staffId;
    payment.refundReason = "Shift is full";
    payment.refundRequestedAt = new Date();
    await payment.save();

    throw new BadRequestError("Shift is full. This payment requires a refund.");
  }


  const now = new Date();

  const latestPurchase = await MembershipPurchase.findOne({
    member_id:payment.userId,
    membership_plan_id:payment.planId,
    status: { $in: ["active", "upcoming"]},
    end_date: { $gt: now},
  }).sort({ end_date : -1});

  let startDate = latestPurchase ? new Date(Math.max(now.getTime(), latestPurchase.end_date.getTime())) : now;
  let endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(plan.duration_days || 30));

  const membershipPurchase = await MembershipPurchase.create({
    member_id: payment.userId || payment.member_id,
    membership_plan_id: payment.planId || payment.membership_plan_id,
    payment_id: payment._id.toString(),
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: "active",
  });

  payment.status = "verified";
  payment.verifiedBy = staffId;
  await payment.save();
  return { payment, membershipPurchase };
};

module.exports.refund = async ({ transactionId }) => {
  const payment = await Payments.findOneAndUpdate(
    { transactionId, status: "refund_pending" },
    { $set: { status: "refunded", refundCompletedAt: new Date() } },
    { new: true },
  );

  if (!payment) {
    throw new BadRequestError("Refund-pending payment not found");
  }

  return payment;
};
// paymentid user id nad planid

module.exports.decline = async ({ transactionId }, { id }) => {
  const payment = await Payments.findOneAndUpdate(
    { transactionId, status: "pending" },
    { $set: { status: "failed", verifiedBy: id } },
    { new: true },
  );
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }

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
        transactionId: 1,
        date: 1,
      },
    },
  ]);
  return filteredPayments;
};

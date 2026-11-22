const { startSession } = require("mongoose");
const {
  Payments,
  MembershipPlans,
  Shifts,
  Users,
  MembershipPurchase,
} = require("../migrations");
const { BadRequestError, ConflictError } = require("../utils/app.errors");
const { isPurchaseaAllowed } = require("../utils/helpers");

module.exports.approve = async ({ transactionId }, { id }) => {
  if (!transactionId || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  const payment = await Payments.findOneAndUpdate(
    {
      transactionId,
      category: "new",
      status: { $in: ["pending", "processing"] },
    },
    { $set: { status: "processing", verifiedBy: id } },
    { new: true },
  );

  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }
  try {
    const staffId = id;

    const user = await Users.findOne({ userId: payment.userId });

    if (!user) {
      throw new BadRequestError("Member Not Found");
    }
    // let us chek if the user have the purchace
    // if the purchase is the same as the one he have ... extend him teh expiry date
    // if the purchase is not the same check the remaining date
    // if the remaning day less than 5 createhim  one below and mark the exisiting as expired
    // if is not throw cnfilict error that the user cannot have 2 purchases
    const plan = await MembershipPlans.findOne({ planId: payment.planId });
    if (!plan) {
      throw new BadRequestError("Membership Plan Not Found");
    }
    const session = await startSession();

    session
      .withTransaction(async () => {
        const result = await isPurchaseaAllowed(user.userId, plan, session);
        if (result !== "allowed") {
          throw new ConflictError("the user already have exxisting purchase ");
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
          const occupiedSpots = await MembershipPurchase.countDocuments(
            {
              membership_plan_id: { $in: planIds },
              status: "active",
              end_date: { $gt: new Date() },
            },
            { session },
          );

          if (occupiedSpots >= shift.max_capacity) {
            payment.status = "refund_pending";
            payment.verifiedBy = staffId;
            payment.refundReason = "Shift is full";
            payment.refundRequestedAt = new Date();
            await payment.save();

            throw new BadRequestError(
              "Shift is full. This payment requires a refund.",
            );
          }
        }

        const now = new Date();
        const startDate = now;
        const endDate = new Date(
          now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000,
        );

        const membershipPurchase = await MembershipPurchase.create(
          {
            member_id: payment.userId || payment.member_id,
            membership_plan_id: payment.planId || payment.membership_plan_id,
            payment_id: payment._id.toString(),
            start_date: startDate,
            end_date: endDate,
            status: "active",
            shiftId: plan.shiftId || null,
          },
          { session },
        );

        payment.status = "verified";
        payment.verifiedBy = staffId;
        await payment.save({ session });
        return { payment, membershipPurchase };
      })
      .finally(async () => {
        await session.endSession();
      });
  } catch (error) {
    payment.status = "pending";
    await payment.save();
    throw new error(`Error processing payment approval: ${error.message}`);
  }
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
  if (!transactionId || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  const payment = await Payments.findOneAndUpdate(
    { transactionId, status: { $in: ["pending", "processing"] } },
    { $set: { status: "failed", verifiedBy: id } },
    { new: true },
  );
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }

  return payment;
};
module.exports.sendPayments = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  const filteredPayments = await Payments.aggregate([
    { $sort: { date: -1 } },
    { $match: { status: { $in: ["pending", "processing"] }, category: "new" } },
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
module.exports.renewPurchaseRequest = async ({ transactionId }, { id }) => {
  if (!transactionId || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  const payment = await Payments.findOneAndUpdate(
    {
      transactionId,
      category: "renew",
      status: { $in: ["pending", "processing"] },
    },
    { $set: { status: "processing", verifiedBy: id } },
    { new: true },
  );
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }
  // extend the membership purchase
  const membershipPurchase = await MembershipPurchase.findOne({
    member_id: payment.userId,
    membership_plan_id: payment.planId,
    status: { $in: ["expired", "active"] },
  });
  if (!membershipPurchase) {
    throw new BadRequestError("Active membership purchase not found");
  }

  if (membershipPurchase.status == "expired") {
    payment.category = "new";
    await payment.save();
    return {
      message:
        "Membership has expired. This payment will be treated as a new purchase.",
      payment,
    };
  }
  const plan = await MembershipPlans.findOne({ planId: payment.planId });
  if (!plan) {
    throw new BadRequestError("Membership Plan Not Found");
  }
  const newEndDate = new Date(
    membershipPurchase.end_date.getTime() +
      plan.duration_days * 24 * 60 * 60 * 1000,
  );

  membershipPurchase.end_date = newEndDate;
  await membershipPurchase.save();
  payment.status = "verified";
  payment.verifiedBy = id;
  await payment.save();

  return {
    message: "Membership renewed successfully",
    payment,
    membershipPurchase,
  };
};
module.exports.getRenewalPayments = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const filteredPayments = await Payments.aggregate([
    { $sort: { date: -1 } },
    { $match: { status: "pending", category: "renew" } },
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

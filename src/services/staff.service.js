const { startSession } = require("mongoose");
const {
  Payments,
  MembershipPlans,
  Shifts,
  Users,
  MembershipPurchase,
  Checkins,
} = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");
const { isPurchaseaAllowed } = require("../utils/helpers");

module.exports.approve = async ({ transactionId, method }, { id }) => {
  if (!transactionId || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  const payment = await Payments.findOneAndUpdate(
    {
      transactionId,
      category: "new",
      method,
      status: { $in: ["pending"] },
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
    if (payment.amount !== plan.price) {
      payment.status = "refund_pending";
      await payment.save();
      return {
        message: `Amount ${payment.amount} does not match the plan price ${plan.price}. This payment requires a refund.`,
      };
    }
    const session = await startSession();

    const result = await session
      .withTransaction(async () => {
        if (plan.tier !== "normal") {
          const shift = await Shifts.findOne({
            shiftId: plan.shiftId,
            $inc: { version: 1 },
          }).session(session);
          if (!shift) {
            throw new BadRequestError("Shift not found");
          }

          const plansOnShift = await MembershipPlans.find({
            shiftId: plan.shiftId,
          })
            .select("planId")
            .session(session);

          const planIds = plansOnShift.map((item) => item.planId);
          const occupiedSpots = await MembershipPurchase.countDocuments({
            membership_plan_id: { $in: planIds },
            status: "active",
            end_date: { $gt: new Date() },
          }).session(session);

          if (occupiedSpots >= shift.max_capacity) {
            payment.status = "refund_pending";
            payment.verifiedBy = staffId;
            payment.refundReason = "Shift is full";
            payment.refundRequestedAt = new Date();
            await payment.save({ session });

            return {
              message: "Shift is full. This payment requires a refund.",
            };
          }
        }
        const allowed = await isPurchaseaAllowed(user.userId, plan, session);
        if (allowed === "extended") {
          return { message: "the purchase has been extended scuccessfully" };
        }
        if (allowed === "notallowed") {
          payment.status = "refund_pending";
          payment.verifiedBy = staffId;
          payment.refundReason = "Purchase not allowed";
          payment.refundRequestedAt = new Date();
          await payment.save({ session });

          return {
            message: "Purchase not allowed. This payment requires a refund.",
          };
        }

        const now = new Date();
        const startDate = now;
        const endDate = new Date(
          now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000,
        );

        const [membershipPurchase] = await MembershipPurchase.create(
          [
            {
              member_id: payment.userId || payment.member_id,
              membership_plan_id: payment.planId || payment.membership_plan_id,
              payment_id: payment._id.toString(),
              start_date: startDate,
              end_date: endDate,
              status: "active",
              shiftId: plan.shiftId || null,
            },
          ],
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
    return result;
  } catch (error) {
    payment.status = "pending";
    await payment.save();
    throw error;
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

module.exports.decline = async ({ transactionId, method, reason }, { id }) => {
  if (!transactionId || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  const payment = await Payments.findOneAndUpdate(
    { transactionId, method },
    { $set: { status: "failed", verifiedBy: id, reason } },
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
    { $match: { status: { $in: ["pending"] }, category: "new" } },
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
      status: { $in: ["pending"] },
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
    payment.status = "refund_pending";
    await payment.save();
    throw new BadRequestError("Active membership purchase not found");
  }

  if (membershipPurchase.status == "expired") {
    payment.category = "new";
    payment.status = "pending";
    await payment.save();
    return {
      message:
        "Membership has expired. This payment will be treated as a new purchase.",
      payment,
    };
  }
  const plan = await MembershipPlans.findOne({ planId: payment.planId });
  if (!plan) {
    payment.status = "refund_pending";
    await payment.save();
    throw new BadRequestError("Membership Plan Not Found");
  }
  if (payment.amount !== plan.price) {
    payment.status = "refund_pending";
    await payment.save();
    return {
      message: `Amount ${payment.amount} does not match the plan price ${plan.price}. This payment requires a refund.`,
    };
  }
  const session = await startSession();
  try {
    const result = await session
      .withTransaction(async () => {
        const newEndDate = new Date(
          membershipPurchase.end_date.getTime() +
            plan.duration_days * 24 * 60 * 60 * 1000,
        );

        membershipPurchase.end_date = newEndDate;
        await membershipPurchase.save();
        payment.status = "verified";
        payment.verifiedBy = id;
        await payment.save({ session });

        return {
          message: "Membership renewed successfully",
          payment,
          membershipPurchase,
        };
      })
      .finally(async () => {
        await session.endSession();
      });
    return result;
  } catch (error) {
    payment.status = "pending";
    payment.verifiedBy = id;
    await payment.save();
    throw error;
  }
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
module.exports.manualCheckin = async ({ member_id, phone }) => {
  if (!member_id && !phone) {
    throw new BadRequestError("Provider a member ID or phone number");
  }
  const user = await Users.findOne({
    role: "member",
    ...(member_id ? { userId: member_id } : { phone }),
  }).select("userId full_name phone");

  if (!user) throw new BadRequestError("Memeber not found.");

  const checkin = await Checkins.create({
    userId: user.userId,
    checkinTime: new Date(),
  });
  return { member: user, checkin };
};

module.exports.getTodaysAttendance = async () => {
  const shifted = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const start = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) -
      3 * 60 * 60 * 1000,
  );
  const end = new Date(start.getTime() + 86_400_000);

  return Checkins.aggregate([
    {
      $match: { checkinTime: { $gte: start, $lt: end } },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "userId",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        userId: 1,
        checkinTime: 1,
        full_name: "$user.full_name",
        phone: "$user.phone",
      },
    },
    { $sort: { checkinTime: -1 } },
  ]);
};

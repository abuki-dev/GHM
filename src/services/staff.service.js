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
  if (typeof transactionId !== "string" || !transactionId.trim()) {
    throw new BadRequestError("A valid transaction Id is required");
  }

  if (!method || !Payments.schema.path("method").enumValues.includes(method)) {
    throw new BadRequestError("Invalid Payment method");
  }
  const session = await startSession();

  try {
    const result = await session.withTransaction(async () => {
      const staffId = id;
      const trans = transactionId.trim();
      const payment = await Payments.findOneAndUpdate(
        {
          transactionId: trans,
          category: { $in: ["new", "renew"] },
          method,
          status: { $in: ["pending"] },
        },
        { $set: { status: "processing", verifiedBy: id } },
        { new: true },
      ).session(session);

      if (!payment) {
        throw new BadRequestError(
          "Payment Not Found try again or The payment Is already Verfied",
        );
      }

      const user = await Users.findOne({ userId: payment.userId });

      if (!user) {
        throw new BadRequestError("Member Not Found");
      }
      // let us chek if the user have the purchace
      // if the purchase is the same as the one he have ... extend him teh expiry date
      // if the purchase is not the same check the remaining date
      // if the remaning day less than 5 createhim  one below and mark the exisiting as expired
      // if is not throw cnfilict error that the user cannot have 2 purchases
      const plan = await MembershipPlans.findOne({
        planId: payment.planId,
        isActive: true,
      }).session(session);
      if (!plan) {
        throw new BadRequestError("Membership Plan Not Found or IS Inactive");
      }
      if (payment.amount !== plan.price) {
        payment.status = "refund_pending";
        payment.verifiedBy = staffId;
        payment.reason = "Amount does not match the plan price";
        await payment.save({ session });
        return {
          message: `Amount ${payment.amount} does not match the plan price ${plan.price}. This payment requires a refund.`,
          success: false,
        };
      }
      const ownLive = await MembershipPurchase.findOne({
        member_id: payment.userId,
        membership_plan_id: payment.planId,
        status: { $in: ["active", "frozen"] },
        end_date: { $gt: new Date() },
      }).session(session);

      if (plan.tier !== "normal" && !ownLive) {
        const shift = await Shifts.findOneAndUpdate(
          { shiftId: plan.shiftId }, // 1. filter: which shift
          { $inc: { version: 1 } }, // 2. update: add 1 to version
          { session, new: true }, // 3. run inside the transaction, return the updated shift
        );
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
          status: { $in: ["active", "frozen"] },
          end_date: { $gt: new Date() },
        }).session(session);

        if (occupiedSpots >= shift.max_capacity) {
          payment.status = "refund_pending";
          payment.verifiedBy = staffId;
          payment.reason = "Shift is full. This payment requires a refund.";
          await payment.save({ session });

          return {
            message: "Shift is full. This payment requires a refund.",
            success: false,
          };
        }
      }
      const allowed = await isPurchaseaAllowed(user.userId, plan, session);
      if (allowed === "extended") {
        payment.status = "verified";
        payment.verifiedBy = staffId;
        await payment.save({ session });
        return {
          message: "the purchase has been extended scuccessfully",
          success: true,
        };
      }
      if (allowed === "notallowed") {
        payment.status = "refund_pending";
        payment.verifiedBy = staffId;
        payment.reason = "Purchase not allowed. For the user";
        await payment.save({ session });

        return {
          message: "Purchase not allowed. This payment requires a refund.",
          success: false,
        };
      }

      const now = new Date();
      const startDate = now;
      const endDate = new Date(
        now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000,
      );

      await MembershipPurchase.create(
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
      payment.reason = "Payment verified successfully";
      await payment.save({ session });
      return {
        message:
          "Payment verified successfully and membership purchase created.",
        success: true,
      };
    });
    return result;
  } finally {
    await session.endSession();
  }
};
module.exports.refund = async ({ transactionId }) => {
  const payment = await Payments.findOneAndUpdate(
    { transactionId, status: "refund_pending" },
    { $set: { status: "refunded" } },
    { new: true },
  );

  if (!payment) {
    throw new BadRequestError("Refund-pending payment not found");
  }

  return { message: "payment refunded successfully completed", success: true };
};
// paymentid user id nad planid

module.exports.decline = async ({ transactionId, method, reason }, { id }) => {
  if (typeof transactionId !== "string" || !transactionId.trim() || !id) {
    throw new BadRequestError("transactionId and user id are required");
  }
  if (!method || !Payments.schema.path("method").enumValues.includes(method)) {
    throw new BadRequestError("Invalid Payment method");
  }
  const trans = transactionId.trim();
  const payment = await Payments.findOneAndUpdate(
    { transactionId: trans, method, status: "pending" },
    {
      $set: {
        status: "failed",
        verifiedBy: id,
        reason: reason?.trim() || "Declined by staff",
      },
    },
    { new: true },
  );
  if (!payment) throw new BadRequestError("Payment Not Found try again");
  return { message: "Payment declined successfully", success: true };
};
module.exports.sendPayments = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  const filteredPayments = await Payments.aggregate([
    { $sort: { date: -1 } },
    {
      $match: {
        status: { $in: ["pending"] },
        category: { $in: ["new", "renew"] },
      },
    },
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 0,
        userId: 1,
        planId: 1,
        amount: 1,
        status: 1,
        category: 1,
        transactionId: 1,
        method: 1,
        date: 1,
      },
    },
  ]);
  return filteredPayments;
};
// module.exports.renewPurchaseRequest = async (
//   { transactionId, method },
//   { id },
// ) => {
//   if (typeof transactionId !== "string" || !transactionId.trim() || !id) {
//     throw new BadRequestError("transactionId and user id are required");
//   }
//   if (!method || !Payments.schema.path("method").enumValues.includes(method)) {
//     throw new BadRequestError("Invalid payment method");
//   }
//   const session = await startSession();
//   let payment;
//   try {
//     const trans = transactionId.trim();
//     payment = await Payments.findOneAndUpdate(
//       {
//         transactionId: trans,
//         category: "renew",
//         method,
//         status: { $in: ["pending"] },
//       },
//       { $set: { status: "processing", verifiedBy: id } },
//       { new: true },
//     );
//     if (!payment) {
//       throw new BadRequestError("Payment Not Found try again");
//     }
//     // extend the membership purchase

//     const result = await session.withTransaction(async () => {
//       const membershipPurchase = await MembershipPurchase.findOne({
//         member_id: payment.userId,
//         membership_plan_id: payment.planId,
//         status: { $in: ["expired", "active"] },
//       })
//         .sort({ end_date: -1 })
//         .session(session);
//       if (!membershipPurchase) {
//         payment.status = "refund_pending";
//         await payment.save({ session });
//         throw new BadRequestError("Active membership purchase not found");
//       }

//       if (
//         membershipPurchase.status === "expired" ||
//         membershipPurchase.end_date < new Date()
//       ) {
//         payment.category = "new";
//         payment.status = "pending";
//         await payment.save({ session });
//         return {
//           message:
//             "Membership has expired. This payment will be treated as a new purchase.",
//           payment,
//         };
//       }
//       const plan = await MembershipPlans.findOne({ planId: payment.planId });
//       if (!plan) {
//         payment.status = "refund_pending";
//         await payment.save({ session });
//         throw new BadRequestError("Membership Plan Not Found");
//       }
//       if (payment.amount !== plan.price) {
//         payment.status = "refund_pending";
//         await payment.save();
//         return {
//           message: `Amount ${payment.amount} does not match the plan price ${plan.price}. This payment requires a refund.`,
//         };
//       }

//       const newEndDate = new Date(
//         membershipPurchase.end_date.getTime() +
//           plan.duration_days * 24 * 60 * 60 * 1000,
//       );

//       membershipPurchase.end_date = newEndDate;
//       await membershipPurchase.save({ session });
//       payment.status = "verified";
//       payment.verifiedBy = id;
//       await payment.save({ session });

//       return {
//         message: "Membership renewed successfully",
//         payment,
//         membershipPurchase,
//       };
//     });
//     return result;
//   } catch (error) {
//     await Payments.updateOne(
//       { _id: payment._id, status: "processing" },
//       { $set: { status: "pending" } },
//     );
//     throw error;
//   } finally {
//     await session.endSession();
//   }
// };
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
        category: 1,
        transactionId: 1,
        method: 1,
        date: 1,
      },
    },
  ]);

  return filteredPayments;
};
module.exports.manualCheckin = async ({ member_id, phone }) => {
  if (!member_id && !phone) {
    throw new BadRequestError("Provide a member ID or phone number");
  }

  const user = await Users.findOne({
    role: "member",
    ...(member_id ? { userId: member_id } : { phone }),
  }).select("userId full_name phone");

  if (!user) throw new BadRequestError("Member not found.");

  const now = new Date();
  const purchase = await MembershipPurchase.findOne({
    member_id: user.userId,
    status: "active",
    start_date: { $lte: now },
    end_date: { $gt: now },
  }).sort({ end_date: -1 });

  if (!purchase) {
    throw new BadRequestError("Member has no active membership.");
  }

  const recent = await Checkins.findOne({
    userId: user.userId,
    $or: [
      { checkinTime: { $gte: new Date(now.getTime() - 5 * 60_000) } },
      { chekinTime: { $gte: new Date(now.getTime() - 5 * 60_000) } },
    ],
  }).sort({ createdAt: -1 });

  if (recent) {
    throw new BadRequestError("Member was checked in recently.");
  }

  const checkin = await Checkins.create({
    userId: user.userId,
    checkinTime: now,
    chekinTime: now,
  });

  const plan = await MembershipPlans.findOne({
    planId: purchase.membership_plan_id,
  }).select("title tier planId");

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const todayVisitCount = await Checkins.countDocuments({
    userId: user.userId,
    $or: [
      { checkinTime: { $gte: dayStart, $lt: dayEnd } },
      { chekinTime: { $gte: dayStart, $lt: dayEnd } },
    ],
  });

  return {
    member: {
      userId: user.userId,
      full_name: user.full_name,
      phone: user.phone,
    },
    plan,
    expiry: purchase.end_date,
    todayVisitCount,
    checkin,
  };
};

module.exports.getTodaysAttendance = async (date) => {
  const shifted = new Date(date);
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
      $match: {
        $or: [
          { checkinTime: { $gte: start, $lt: end } },
          { chekinTime: { $gte: start, $lt: end } },
        ],
      },
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
        checkinTime: { $ifNull: ["$checkinTime", "$chekinTime"] },
        full_name: "$user.full_name",
        phone: "$user.phone",
      },
    },
    { $sort: { checkinTime: -1 } },
  ]);
};

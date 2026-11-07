const {
  MembershipPlans,
  MembershipPurchase,
  Payments,
} = require("../migrations");

module.exports.getMembershipPlans = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  console.log("Findign from teh databse");

  const allPlans = await MembershipPlans.aggregate([
    // 1. MUST sort first so skip/limit order is deterministic
    { $sort: { planId: 1 } },

    // 2. Pass variables directly without inner curly braces
    { $skip: skip },
    { $limit: limit },

    // 3. Join with trainings collection
    {
      $lookup: {
        from: "trainings",
        localField: "training_id",
        foreignField: "trainingId",
        as: "Trainings",
      },
    },

    // 4. Flatten the array, keeping plans even if training is unassigned
    {
      $unwind: {
        path: "$Trainings",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 5. Clean projection and field renaming
    {
      $project: {
        _id: 0,
        planId: 1,
        Title: 1,
        description: 1,
        Duration: "$duration_days",
        tier: 1,
        training: "$Trainings.category",
      },
    },
  ]);

  return allPlans;
};
module.exports.getMemberSubscriptions = async (memberId) => {
  const allPuschases = await MembershipPurchase.aggregate([
    { $sort: { member_id: 1 } },
    { $match: { member_id: memberId } },
    {
      $project: {
        _id: 0,
        membership_plan_id: 1,
        payment_id: 1,
        start_date: 1,
        end_date: 1,
        status: 1,
      },
    },
  ]);
  return allPuschases;
};
module.exports.savePaymentInfos = async (
  { planId, amount, transactionId },
  { userId },
) => {
  await Payments.create({
    planId,
    amount,
    transactionId,
    userId,
  });
  return { message: `Sucussfully payed ${amount} for plan ${planId}` };
};
module.exports.getUsrePaymentHistory = async (userId) => {
  const histories = await Payments.aggregate([
    { $sort: { userId: 1, status: -1 } },
    {
      $lookup: {
        from: "membershipplans",
        localField: "planId",
        foreignField: "planId",
        as: "Plans",
      },
    },
    {
      $unwind: {
        path: "$Plans",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        planId: 1,
        PlanTitle: "$Plans.Title",
        amount: 1,
        transactionId: 1,
        status: 1,
        date: 1,
      },
    },
  ]);

  return histories;
};

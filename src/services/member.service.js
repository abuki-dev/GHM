const {
  MembershipPlans,
  MembershipPurchase,
  Payments,
  Member,
} = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");

module.exports.getMembershipPlans = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  console.log("Findign from teh databse");

  //1 get palns by embendig with training  shift
  // use facets the first gets panswirh the training
  // the seceond gets the planshifts
  // after get the shifts get the trainer by loocup
  const allPlans = await MembershipPlans.aggregate([
    // 1. Deterministic pagination
    { $sort: { planId: 1 } },
    { $skip: skip },
    { $limit: limit },

    // 2. Join Training Category
    {
      $lookup: {
        from: "trainings",
        localField: "training_id",
        foreignField: "trainingId",
        as: "training",
      },
    },
    { $unwind: { path: "$training", preserveNullAndEmptyArrays: true } },

    // 3. Join Shift + Nested Trainer & User
    {
      $lookup: {
        from: "shifts",
        let: { shiftId: "$shiftId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shiftId", "$$shiftId"] } } },
          {
            $lookup: {
              from: "trainers",
              localField: "trainerId",
              foreignField: "trainerId",
              as: "trainer",
            },
          },
          { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "trainer.userId",
              foreignField: "userId",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        ],
        as: "shift",
      },
    },
    { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },

    // 4. Count Active Subscriptions for this Shift to calculate Available Spots
    {
      $lookup: {
        from: "subscriptionpurchases",
        let: { shiftId: "$shiftId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$assignedShiftId", "$$shiftId"] },
                  { $eq: ["$status", "ACTIVE"] },
                  { $gte: ["$endDate", new Date()] },
                ],
              },
            },
          },
          { $count: "activeCount" },
        ],
        as: "occupancy",
      },
    },

    // 5. Clean Output Projection
    {
      $project: {
        _id: 0,
        planId: 1,
        planTitle: "$title",
        planDescription: "$description",
        planDurationDays: "$duration_days",
        planTier: "$tier",
        planPrice: "$price",

        // Training Details
        trainingTitle: "$training.title",
        trainingCategory: "$training.category",
        trainingLevel: "$training.level",

        // Shift & Dynamic Capacity Details
        shiftGroup: "$shift.group",
        shiftPeriod: "$shift.period",
        shiftDaysOfWeek: "$shift.days_of_week",
        shiftStartTime: "$shift.startTime",
        shiftEndTime: "$shift.endTime",
        shiftMaxCapacity: "$shift.max_capacity",
        availableSpots: {
          $subtract: [
            { $ifNull: ["$shift.max_capacity", 0] },
            { $ifNull: [{ $arrayElemAt: ["$occupancy.activeCount", 0] }, 0] },
          ],
        },

        // Trainer Details
        trainerExperience: "$shift.trainer.experience",
        trainerName: "$shift.user.full_name",
        trainerEmail: "$shift.user.email",
      },
    },
  ]);

  return allPlans;
};
module.exports.getMemberSubscriptions = async ({ id }) => {
  console.log("Getting subscriptions for userId:", id);
  const allPuschases = await MembershipPurchase.aggregate([
    { $sort: { member_id: 1 } },
    { $match: { member_id: id } },
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
  { id },
) => {
  //check the avalable spots by using thepna id iside teh ouchases
  await Payments.create({
    planId,
    amount,
    transactionId,
    userId: id,
  });
  return { message: `Sucussfully payed ${amount} for plan ${planId}` };
};
module.exports.getUsrePaymentHistory = async ({ id }) => {
  console.log("Getting payment history for userId:", id);
  const histories = await Payments.aggregate([
    { $sort: { userId: 1, status: -1 } },
    { $match: { userId: id } },
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
module.exports.generateUserSession = async ({ userId }) => {
  // first let us find teh user form teh memembers data if he actual y exest
  // if exeists find him also in the ourchaes if he have  aplan
  // if he got aplan chek its the  esxpired
  // if expoted throm error the that tg
  const ismemberExits = await Member.findOne({ userId });
  if (!ismemberExits) {
    throw new BadRequestError();
  }
};

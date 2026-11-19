const { verify, sign } = require("jsonwebtoken");
const {
  MembershipPlans,
  MembershipPurchase,
  Payments,
  Shifts,
  Sessions,
} = require("../migrations");
const { BadRequestError, ConflictError } = require("../utils/app.errors");
const { toMinutes } = require("../utils/helpers");
const env = require("../config/env");

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
        from: "membershipplans",
        let: { targetShiftId: "$shiftId" },
        pipeline: [
          // 1. Find all plans that share this shiftId
          { $match: { $expr: { $eq: ["$shiftId", "$$targetShiftId"] } } },

          // 2. Join active purchases belonging to ANY of those plans
          {
            $lookup: {
              from: "membershippurchases",
              let: { currentPlanId: "$planId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$membership_plan_id", "$$currentPlanId"] },
                        { $eq: ["$status", "active"] },
                        { $gte: ["$end_date", new Date()] },
                      ],
                    },
                  },
                },
              ],
              as: "activePurchases",
            },
          },

          // 3. Count purchases per plan, then sum them across all plans in this shift
          {
            $group: {
              _id: null,
              totalActiveCount: { $sum: { $size: "$activePurchases" } },
            },
          },
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
            {
              $ifNull: [
                { $arrayElemAt: ["$occupancy.totalActiveCount", 0] },
                0,
              ],
            },
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
  { planId, amount, transactionId, method },
  { id },
) => {
  //check the avalable spots by using thepna id iside teh ouchases
  if (
    !planId ||
    !amount ||
    !transactionId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    transactionId.trim() === "" ||
    isNaN(planId) === ""
  ) {
    throw new BadRequestError(
      "Missing required fields: planId, amount, or transactionId",
    );
  }
  const paymentExists = await Payments.findOne({ transactionId });
  if (paymentExists) {
    throw new ConflictError(
      "Payment with this transactionId already exists and used",
    );
  }
  await Payments.create({
    planId,
    amount,
    transactionId,
    userId: id,
    method,
  });
  return { message: `Sucussfully payed ${amount} for plan ${planId}` };
};
module.exports.getUsrePaymentHistory = async ({ id }) => {
  console.log("Getting payment history for userId:", id);
  const histories = await Payments.aggregate([
    { $sort: { userId: 1, date: -1 } },
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
        PlanTitle: "$Plans.title",
        amount: 1,
        transactionId: 1,
        status: 1,
        date: 1,
      },
    },
  ]);

  return histories;
};
module.exports.generateUserSession = async ({ qrToken }) => {
  // first let us find teh user form teh memembers data if he actual y exest
  // if exeists find him also in the ourchaes if he have  aplan
  // if he got aplan chek its the  esxpired
  // if expoted throm error the that tg
  let decoded;
  // If someone tampered with userId or purchaseId, jwt.verify() throws an error!
  decoded = verify(qrToken, env.GYMPASS_SECRET);
  const { u: userId, p: purchaseId } = decoded;
  const existingPurchase = await MembershipPurchase.findOne({
    purchaseId,
    member_id: userId,
  });
  if (!existingPurchase) {
    throw new BadRequestError(
      "The purchase is not found for this user, please check your purchase ID and try again.  If the issue persists, contact support for assistance.",
    );
  }
  // 2. Check manual cancellation/suspension status
  if (existingPurchase.status !== "active") {
    throw new BadRequestError(
      `Your subscription is currently ${existingPurchase.status}. Please contact support.`,
    );
  }
  const now = new Date();
  if (now >= existingPurchase.end_date) {
    await MembershipPurchase.updateOne(
      { _id: existingPurchase._id },
      { $set: { status: "expired" } },
    );
    throw new BadRequestError(
      "Your subscription has expired. Please renew or Try subscribing one.",
    );
  }
  // the us find the user purchase plan expired or not
  // chek if the puchease actualy have a plan
  const plan = await MembershipPlans.findOne({
    planId: existingPurchase.membership_plan_id,
  });
  if (!plan) {
    throw new BadRequestError("Error the Plan Is not fouded try agan ");
  }
  // is the user plan is normal no creatign session just  allowe him to go inside
  if (plan.tier === "normal") {
    return { message: "Normal member's paln ,You can go inside" };
  }
  //  chck if teh user is allowed to get in this shift at currunt time
  // else let us chek the shift start and end time
  const shift = await Shifts.findOne({ shiftId: plan.shiftId });
  if (!shift) {
    throw new BadRequestError("shift Not found contact The staffs");
  }
  // if vip or vvip chek the time by date.now vs teh start and end time
  // the memeber is allowed to go only if the time is betwen tehstart and end tine
  const daysByGroup = {
    "MON-WED-FRI": ["Mon", "Wed", "Fri"],
    "TU-TH-SA": ["Tue", "Thu", "Sat"],
  };

  const localTimeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const localParts = Object.fromEntries(
    localTimeParts.map(({ type, value }) => [type, value]),
  );

  const allowedDays = new Set(
    (shift.days_of_week || []).flatMap((group) => daysByGroup[group] || []),
  );

  if (!allowedDays.has(localParts.weekday)) {
    throw new BadRequestError(
      `your shift does not run today. Scheduled days: ${shift.days_of_week.join(", ")}`,
    );
  }
  const sessiinexits = await Sessions.findOne({
    member_id: userId,
    createdAt: new Date().toISOString(),
  });

  if (sessiinexits) {
    return {
      message: "Session already live go and finish irt",
      session: sessiinexits,
    };
  }
  const currentMinutes =
    Number(localParts.hour) * 60 + Number(localParts.minute);
  const startMinutes = toMinutes(shift.startTime);
  const endMinutes = toMinutes(shift.endTime);

  if (currentMinutes < startMinutes) {
    throw new BadRequestError(
      `You are too early to enter the gym, please come back at ${shift.startTime}`,
    );
  }

  if (currentMinutes > endMinutes) {
    throw new BadRequestError(
      `You are too late to enter the gym, your shift ended at ${shift.endTime}`,
    );
  }
  const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  // now we can create the session for the user and let him go inside
  const trainerId = shift.trainerId;
  const createdSession = await Sessions.create({
    trainer_id: trainerId,
    member_id: userId,
    start_time: formattedTime,
    status: "in_progress",
    createdAt: new Date().toISOString(),
    siftId: shift.shiftId,
  });
  return { message: "Session created successfully", session: createdSession };
};
module.exports.generateGympass = async ({ id, purchaseId }) => {
  if (!purchaseId) {
    throw new BadRequestError("PurchaseId is required");
  }

  const now = new Date();
  const activePurchase = await MembershipPurchase.findOne({
    purchaseId,
    member_id: id,
    status: "active",
    start_date: { $lte: now },
    end_date: { $gt: new Date() },
  });

  if (!activePurchase) {
    throw new BadRequestError("No active subscription found.");
  }

  // 2. Calculate exact seconds left until end_date so the QR expires at the exact second the plan ends
  const secondsRemaining = Math.floor(
    (activePurchase.end_date.getTime() - now.getTime()) / 1000,
  );

  // 3. Sign a compact JWT (keep keys short so the QR code squares stay big & easy to scan)
  const qrToken = sign(
    { u: id, p: activePurchase.purchaseId },
    env.JWT_SECRET,
    { expiresIn: secondsRemaining },
  );
  return { qrToken: qrToken, exp: activePurchase.end_date };
};

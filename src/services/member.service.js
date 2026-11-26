const { verify, sign } = require("jsonwebtoken");
const {
  MembershipPlans,
  MembershipPurchase,
  Payments,
  Shifts,
  Sessions,
  Users,
  Checkins,
  Feedbacks,
} = require("../migrations");
const { BadRequestError, ConflictError } = require("../utils/app.errors");
const { toMinutes } = require("../utils/helpers");
const env = require("../config/env");
const { expireStalePurchase, getActivePurchase } = require("./purchase.rules");

module.exports.getMembershipPlans = async (page = 1, member_id = null) => {
  const currentPurchase = member_id ? await getActivePurchase(member_id) : null;
  const currentPlanId = currentPurchase?.membership_plan_id ?? null;
  const total = await MembershipPlans.countDocuments({});
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
          $max: [
            0,
            {
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
          ],
        },

        // Trainer Details
        trainerExperience: "$shift.trainer.experience",
        trainerName: "$shift.user.full_name",
        trainerEmail: "$shift.user.email",
      },
    },
  ]);

  return { items: allPlans, total, page: currentPage, limit, currentPlanId };
};
module.exports.getMemberSubscriptions = async ({ id }, page = 1) => {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const limit = 10;
  const now = new Date();

  const [items, total] = await Promise.all([
    MembershipPurchase.aggregate([
      { $match: { member_id: id } },
      { $sort: { end_date: -1 } },
      { $skip: (currentPage - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "membershipplans",
          localField: "membership_plan_id",
          foreignField: "planId",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          purchaseId: 1,
          membership_plan_id: 1,
          planTitle: "$plan.title",
          planTier: "$plan.tier",
          start_date: 1,
          end_date: 1,
          status: 1,
          daysRemaining: {
            $max: [
              0,
              {
                $ceil: {
                  $divide: [{ $subtract: ["$end_date", now] }, 86_400_000],
                },
              },
            ],
          },
        },
      },
    ]),
    MembershipPurchase.countDocuments({ member_id: id }),
  ]);

  return { items, total, page: currentPage, limit };
};
module.exports.savePaymentInfos = async (
  { planId, amount, transactionId, method },
  { id },
) => {
  const trans = typeof transactionId === "string" ? transactionId.trim() : "";

  // check the available spots by using the plan ID inside the purchases
  if (
    typeof planId !== "string" ||
    !planId.trim() ||
    !trans ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Payments.schema.path("method").enumValues.includes(method)
  ) {
    throw new BadRequestError(
      "Missing required fields: planId, amount, or transactionId",
    );
  }

  await expireStalePurchase(id);
  const [plan, openPayment] = await Promise.all([
    MembershipPlans.findOne({ planId: planId.trim() }),
    Payments.findOne({
      userId: id,
      status: { $in: ["pending", "processing"] },
    }),
  ]);

  if (!plan) throw new BadRequestError("Membership plan not found.");
  if (amount !== plan.price) {
    throw new BadRequestError("Payment amount does not match the plan price.");
  }
  if (openPayment) {
    throw new ConflictError("You already have a payment awaiting review.");
  }

  const activePurchase = await getActivePurchase(id);
  if (activePurchase && activePurchase.status === "frozen") {
    throw new ConflictError("Resume your frozen membership before purchasing.");
  }
  if (activePurchase && activePurchase.membership_plan_id !== plan.planId) {
    throw new ConflictError(
      "You already have an active membership on a different plan.",
    );
  }

  const duplicate = await Payments.findOne({ transactionId: trans, method });
  if (duplicate) {
    throw new ConflictError("This transaction has already been submitted.");
  }

  await Payments.create({
    planId: plan.planId,
    amount,
    transactionId: trans,
    userId: id,
    method,
    category: activePurchase ? "renew" : "new",
  });

  return {
    message: activePurchase
      ? "Renewal payment submitted for staff review."
      : "Purchase payment submitted for staff review.",
    category: activePurchase ? "renew" : "new",
  };
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
  try {
    decoded = verify(qrToken, env.GYMPASS_SECRET);
  } catch {
    throw new BadRequestError("QR invalid or expired.");
  }
  const { u: userId, p: purchaseId, typ } = decoded;
  if (typ !== "gympass") {
    throw new BadRequestError("QR invalid or expired");
  }
  await expireStalePurchase(userId);
  const existingPurchase = await MembershipPurchase.findOne({
    purchaseId,
    member_id: userId,
    status: "active",
    start_date: { $lte: new Date() },
    end_date: { $gt: new Date() },
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
  const user = await Users.findOne({ userId })
    .select("userId full_name phone")
    .lean();

  const recentCheckin = await Checkins.findOne({
    userId,
    $or: [
      { checkinTime: { $gte: new Date(now.getTime() - 5 * 60_000) } },
      { chekinTime: { $gte: new Date(now.getTime() - 5 * 60_000) } },
    ],
  }).sort({ createdAt: -1 });

  if (recentCheckin) {
    throw new BadRequestError("You have already been checked in recently.");
  }

  // Normal members do not need a coached session, but they still need attendance.
  if (plan.tier === "normal") {
    const checkin = await Checkins.create({
      userId,
      checkinTime: now,
      chekinTime: now,
    });

    return {
      message: "Normal member pass accepted. You can go inside.",
      member: user,
      plan,
      expiry: existingPurchase.end_date,
      checkin,
    };
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
  const sessionExists = await Sessions.findOne({
    member_id: userId,
    status: "in_progress",
    createdAt: { $gte: new Date(now.getTime() - 5 * 60_000) },
  }).sort({ createdAt: -1 });

  if (sessionExists) {
    return {
      message: "Session already live go and finish irt",
      session: sessionExists,
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
  const formattedTime = `${String(localParts.hour).padStart(2, "0")}:${String(localParts.minute).padStart(2, "0")}`;
  // now we can create the session for the user and let him go inside
  const trainerId = shift.trainerId;
  const createdSession = await Sessions.create({
    trainer_id: trainerId,
    member_id: userId,
    start_time: formattedTime,
    status: "in_progress",
    shiftId: shift.shiftId,
  });
  const checkin = await Checkins.create({
    userId,
    checkinTime: now,
    chekinTime: now,
  });

  return {
    message: "Session created successfully",
    member: user,
    plan,
    expiry: existingPurchase.end_date,
    checkin,
    session: createdSession,
  };
};
module.exports.generateGympass = async ({ id }) => {
  const purchase = await getActivePurchase(id);
  const now = new Date();

  if (
    !purchase ||
    purchase.status !== "active" ||
    purchase.start_date > now ||
    purchase.end_date <= now
  ) {
    throw new BadRequestError("No active subscription found.");
  }

  const qrToken = sign(
    { u: id, p: purchase.purchaseId, typ: "gympass" },
    env.GYMPASS_SECRET,
    { expiresIn: 60 },
  );

  return { qrToken, exp: new Date(Date.now() + 60_000) };
};
module.exports.createRenewalRequest = async (
  { planId, amount, transactionId, method },
  { id },
) => {
  const trans = typeof transactionId === "string" ? transactionId.trim() : "";
  const cleanPlanId = typeof planId === "string" ? planId.trim() : "";

  if (
    !cleanPlanId ||
    !trans ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Payments.schema.path("method").enumValues.includes(method)
  ) {
    throw new BadRequestError(
      "Missing required fields: planId, amount, or transactionId",
    );
  }
  const [plan, paymentExists, activePurchase] = await Promise.all([
    MembershipPlans.findOne({ planId: cleanPlanId }),
    Payments.findOne({ transactionId: trans, method }),
    getActivePurchase(id),
  ]);

  if (!plan) throw new BadRequestError("Membership plan not found.");
  if (amount !== plan.price) {
    throw new BadRequestError("Payment amount does not match the plan price.");
  }
  if (!activePurchase) {
    throw new BadRequestError("No existing purchase is available to renew.");
  }
  if (activePurchase.membership_plan_id !== plan.planId) {
    throw new ConflictError("Renewal must use the member's current plan.");
  }
  if (paymentExists) {
    throw new ConflictError(
      "Payment with this transactionId already exists and used",
    );
  }

  await Payments.create({
    planId: cleanPlanId,
    amount,
    transactionId: trans,
    userId: id,
    method,
    category: "renew",
  });
  return {
    message: `Successfully sent renewal for ${amount} for plan ${planId} pleas wait few business days for the payment to be processed.`,
  };
};

module.exports.getMyProfile = async ({ id }) => {
  const user = await Users.findOne({ userId: id })
    .select("userId full_name email phone gender age role")
    .lean();

  if (!user) throw new BadRequestError("Member not found.");
  return user;
};

module.exports.updateMyProfile = async (
  { full_name, phone, gender, age },
  { id },
) => {
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (gender !== undefined) updates.gender = gender;
  if (age !== undefined) updates.age = age;

  const user = await Users.findOneAndUpdate(
    { userId: id, role: "member" },
    { $set: updates },
    { new: true, runValidators: true },
  ).select("userId full_name email phone gender age role");

  if (!user) throw new BadRequestError("Member not found.");
  return user;
};

module.exports.getMyAttendance = async ({ id }, page = 1) => {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const limit = 20;
  const [items, total] = await Promise.all([
    Checkins.find({ userId: id })
      .sort({ checkinTime: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean(),
    Checkins.countDocuments({ userId: id }),
  ]);

  return { items, total, page: currentPage, limit };
};

module.exports.cancelMyPayment = async ({ id }, paymentId) => {
  const payment = await Payments.findOneAndUpdate(
    { _id: paymentId, userId: id, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true },
  );

  if (!payment) {
    throw new BadRequestError("Pending payment not found.");
  }
  return payment;
};

module.exports.freezeMyMembership = async ({ id }, days) => {
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new BadRequestError("Freeze duration must be from 1 to 30 days.");
  }

  const purchase = await getActivePurchase(id);
  if (!purchase || purchase.status !== "active") {
    throw new BadRequestError("No active membership can be frozen.");
  }
  if ((purchase.freezeDaysUsed || 0) + days > 30) {
    throw new BadRequestError(
      "This membership has reached its 30-day freeze limit.",
    );
  }

  const now = new Date();
  purchase.freezeStartedAt = now;
  purchase.freezeUntil = new Date(now.getTime() + days * 86_400_000);
  purchase.freezeUntill = purchase.freezeUntil;
  purchase.status = "frozen";
  await purchase.save();
  return purchase;
};

module.exports.resumeMyMembership = async ({ id }) => {
  const purchase = await MembershipPurchase.findOne({
    member_id: id,
    status: "frozen",
  });

  if (!purchase) throw new BadRequestError("No frozen membership found.");

  const now = new Date();
  const freezeStartedAt = purchase.freezeStartedAt;
  const freezeUntil = purchase.freezeUntil || purchase.freezeUntill;

  if (!freezeStartedAt || !freezeUntil) {
    throw new BadRequestError("Freeze dates are missing. Contact staff.");
  }

  const elapsedMs = Math.max(
    0,
    Math.min(now.getTime(), freezeUntil.getTime()) - freezeStartedAt.getTime(),
  );
  const remainingFreezeLimit = 30 - (purchase.freezeDaysUsed || 0);
  const extendedMs = Math.min(elapsedMs, remainingFreezeLimit * 86_400_000);

  purchase.end_date = new Date(purchase.end_date.getTime() + extendedMs);
  purchase.freezeDaysUsed =
    (purchase.freezeDaysUsed || 0) + extendedMs / 86_400_000;
  purchase.freezeUntil = null;
  purchase.freezeUntill = null;
  purchase.freezeStartedAt = null;
  purchase.status = "active";
  await purchase.save();
  return purchase;
};
module.exports.createFeedback = async ({ id }, { title, body }) => {
  if (!title?.trim() || !body?.trim()) {
    throw new BadRequestError("Title and feedback body are required.");
  }

  return Feedbacks.create({
    userId: id,
    title: title.trim(),
    body: body.trim(),
  });
};

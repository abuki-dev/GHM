const {
  Training,
  Shifts,
  MembershipPlans,
  Users,
  Trainer,
  MembershipPurchase,
  Payments,
  Feedbacks,
  Checkins,
} = require("../migrations");
const { BadRequestError, ConflictError } = require("../utils/app.errors");
const { formatHours, getPagination } = require("../utils/helpers");

module.exports.newtraining = async function ({
  title,
  description,
  level,
  category,
}) {
  const training = await Training.create({
    title: title,
    description: description,
    level: level,
    category: category,
  });
  return { message: "Training created successfully", success: true, training };
};

module.exports.newshift = async function ({
  trainerId,
  period,
  days_of_week,
  startTime,
  endTime,
  room,
  max_capacity,
}) {
  if (!startTime || !endTime || !room || !days_of_week) {
    throw new BadRequestError("Required fileds are empty try gan");
  }

  const istrainerexist = await Trainer.findOne({ trainerId });
  if (!istrainerexist)
    throw new BadRequestError("Trainer Id is invalid, try again");
  const isValidUser = await Users.findOne({
    userId: istrainerexist.userId,
    role: "trainer",
  });
  if (!isValidUser)
    throw new BadRequestError("Trainer Id is invalid, try again");

  const start = formatHours(startTime);
  const end = formatHours(endTime);
  // same trainer OR same room, same days, overlapping time
  const clash = await Shifts.findOne({
    $or: [{ trainerId }, { room }],
    days_of_week: { $in: days_of_week },
    startTime: { $lt: end }, // Existing shift starts BEFORE new shift ends
    endTime: { $gt: start },
  });
  if (clash)
    throw new BadRequestError(
      `This overlaps shift ${clash.shiftId} (same trainer or room)`,
    );

  const shift = await Shifts.create({
    trainerId: trainerId,
    period: period,
    startTime: start,
    endTime: end,
    days_of_week: days_of_week,
    max_capacity: max_capacity,
    room: room,
  });
  return { message: "Shift created successfully", success: true, shift };
};
module.exports.removeshift = async function ({ shiftId }) {
  //first find all purchases in this shift that are actively attended by teh memebere
  // i fexist throw errrow there are active purchaaes exits
  if (!shiftId) {
    throw new BadRequestError("Shift ID is required. Try again.");
  }
  const planUsesShift = await MembershipPlans.exists({ shiftId });
  if (planUsesShift) {
    throw new ConflictError(
      "Cannot delete: membership plans still use this shift. Delete those plans first.",
    );
  }
  const deleted = await Shifts.deleteOne({ shiftId });
  if (deleted.deletedCount == 0) {
    throw new BadRequestError("the shift is not Founded in the Database");
  }
  //// 3. Clean up (or deactivate) any MembershipPlans tied to this deleted shift
  await MembershipPlans.updateMany({ shiftId }, { $set: { isActive: false } });
  return { message: "Shift deleted successfully", success: true };
};
module.exports.removeTraining = async function ({ trainingId }) {
  if (!trainingId) {
    throw new BadRequestError("Training ID is required. Try again.");
  }

  // 1. Check if the training program actually exists first
  const training = await Training.findOne({ trainingId });
  if (!training) {
    throw new BadRequestError("Training program not found.");
  }

  // 2. Get all planIds tied to this training in one clean array
  const planIds = await MembershipPlans.distinct("planId", {
    training_id: trainingId,
  });

  // 3. Single fast index check: does ANY active or frozen purchase use these plans?
  if (planIds.length > 0) {
    const hasActiveSubscribers = await MembershipPurchase.exists({
      membership_plan_id: { $in: planIds },
      status: { $in: ["active", "frozen"] },
    });

    if (hasActiveSubscribers) {
      throw new ConflictError(
        "Cannot delete: members currently have active or frozen subscriptions on this training.",
      );
    }

    // 4. Optional but recommended: deactivate or remove orphaned plans so nobody buys them
    await MembershipPlans.deleteMany({ planId: { $in: planIds } });
  }

  // 5. Safe to delete the training program
  await Training.deleteOne({ trainingId });

  return { message: "Training deleted successfully", success: true };
};
module.exports.newMembershipPlan = async ({
  title,
  description,
  duration_days,
  tier,
  price,
  trainingId,
  shiftId,
}) => {
  if (!price || price <= 0 || isNaN(price)) {
    throw new BadRequestError(
      "Price must be a positive number greater than zero. Please provide a valid price.",
    );
  }
  if (!title || !description || !duration_days || !tier) {
    throw new BadRequestError(
      "Missing required fields: title, description, duration_days, or tier. Please provide all necessary information.",
    );
  }
  const trainigfound = await Training.findOne({ trainingId });
  if (!trainigfound) throw new BadRequestError("Training program not found.");

  if (tier !== "normal") {
    const shiftfound = await Shifts.findOne({ shiftId });
    if (!shiftfound) throw new BadRequestError("Shift not found.");
    if (
      (tier === "vip" && shiftfound.max_capacity > 15) ||
      (tier === "vvip" && shiftfound.max_capacity > 5)
    ) {
      throw new BadRequestError(
        `Error the shift and plan mismatched plan is ${tier} and shift capacity is ${shiftfound.max_capacity}`,
      );
    }
  }
  const newPlan = new MembershipPlans({
    title,
    description,
    duration_days,
    tier,
    price,
    training_id: trainingId,
    shiftId,
  });
  if (tier === "normal") {
    newPlan.shiftId = null;
  }
  await newPlan.save();

  return {
    message: "Membership plan created successfully",
    success: true,
    plan: newPlan,
  };
};
module.exports.removePlan = async function ({ planId }) {
  if (!planId) throw new BadRequestError("planId is required");
  const plan = await MembershipPlans.findOne({ planId });
  if (!plan) throw new BadRequestError("Plan not found");

  const inUse = await MembershipPurchase.exists({
    membership_plan_id: planId,
    status: { $in: ["active", "frozen"] },
  });
  if (inUse) {
    throw new ConflictError(
      "Cannot delete: members currently have active or frozen subscriptions on this plan.",
    );
  }
  const waiting = await Payments.exists({
    planId,
    status: { $in: ["pending", "processing", "refund_pending"] },
  });
  if (waiting) {
    throw new ConflictError(
      "Cannot delete: there are unprocessed payments for this plan.",
    );
  }
  await MembershipPlans.updateOne({ planId }, { $set: { isActive: false } });
  return { message: "Plan deleted successfully", success: true };
};
module.exports.allDatabaseUsers = async (page = 1) => {
  const { limit, skip } = getPagination(page);

  return await Users.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $skip: skip,
    },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        full_name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        isActive: 1,
        gender: 1,
        age: 1,
        phone: 1,
      },
    },
  ]);
};
// Helper to keep pagination logic clean and consistent across all functions

// 1. Checkins
module.exports.allDatabaseCheckins = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await Checkins.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        userId: 1,
        checkinTime: 1,
        createdAt: 1,
      },
    },
  ]);
};

// 2. Membership Purchases
module.exports.allDatabaseMembershipPurchases = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await MembershipPurchase.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        purchaseId: 1,
        member_id: 1,
        membership_plan_id: 1,
        payment_id: 1,
        freezeUntil: 1,
        freezeStartedAt: 1,
        freezeDaysUsed: 1,
        remindersSent: 1,
        expiredNotifiedAt: 1,
        start_date: 1,
        end_date: 1,
        status: 1,
        shiftId: 1,
        createdAt: 1,
      },
    },
  ]);
};

// 3. Membership Plans
module.exports.allDatabaseMembershipPlans = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await MembershipPlans.aggregate([
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        planId: 1,
        title: 1,
        description: 1,
        duration_days: 1,
        price: 1,
        training_id: 1,
        shiftId: 1,
        isActive: 1,
      },
    },
  ]);
};

// 4. Payments
module.exports.allDatabasePayments = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await Payments.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        userId: 1,
        planId: 1,
        amount: 1,
        transactionId: 1,
        method: 1,
        category: 1,
        status: 1,
        reason: 1,
        verifiedBy: 1,
        date: 1,
        createdAt: 1,
      },
    },
  ]);
};

// 5. Shifts
module.exports.allDatabaseShifts = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await Shifts.aggregate([
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        shiftId: 1,
        trainerId: 1,
        group: 1,
        room: 1,
        period: 1,
        days_of_week: 1,
        startTime: 1,
        endTime: 1,
        max_capacity: 1,
        version: 1,
      },
    },
  ]);
};

// 6. Trainings
module.exports.allDatabaseTrainings = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await Training.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        trainingId: 1,
        title: 1,
        category: 1,
        description: 1,
        level: 1,
        createdAt: 1,
      },
    },
  ]);
};

// 7. Feedbacks
module.exports.allDatabaseFeedbacks = async (page = 1) => {
  const { limit, skip } = getPagination(page);
  return await Feedbacks.aggregate([
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        userId: 1,
        title: 1,
        body: 1,
      },
    },
  ]);
};

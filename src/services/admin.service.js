const {
  Training,
  Shifts,
  MembershipPlans,
  Users,
  Trainer,
  MembershipPurchase,
} = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");
const { formatHours } = require("../utils/helpers");

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
  return training;
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
  if (!startTime || !endTime || !room) {
    throw new BadRequestError("Required fileds are empty try gan");
  }

  const istrainerexist = await Trainer.findOne({
    trainerId: trainerId,
  });
  const isValidUser = await Users.findOne({
    userId: istrainerexist.userId,
    role: "trainer",
  });
  if (!istrainerexist || !isValidUser) {
    throw new BadRequestError("Trainer Id is invalid try agan ");
  }
  const foramedTime = formatHours(startTime);
  const foramedTime2 = formatHours(endTime);
  const shift = await Shifts.create({
    trainerId: trainerId,
    period: period,
    startTime: foramedTime,
    endTime: foramedTime2,
    days_of_week: days_of_week,
    max_capacity: max_capacity,
    room: room,
  });
  return shift;
};
module.exports.removeshift = async function ({ shiftId }) {
  //first find all purchases in this shift that are actively attended by teh memebere
  // i fexist throw errrow there are active purchaaes exits

  const isActive = Boolean(
    await MembershipPurchase.exists({
      shiftId,
      status: { $in: ["active", "frozen"] },
    }),
  );
  if (isActive) {
    throw new BadRequestError(
      `The shift is Already giving service to Users Try again `,
    );
  }
  const deleted = await Shifts.deleteOne({ shiftId });
  if (deleted.deletedCount == 0) {
    throw new BadRequestError("the shift is not Founded in the Database");
  }
  //// 3. Clean up (or deactivate) any MembershipPlans tied to this deleted shift
  //await MembershipPlans.deleteMany({ shiftId });
  return deleted;
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
      throw new BadRequestError(
        "Cannot delete: members currently have active or frozen subscriptions on this training.",
      );
    }

    // 4. Optional but recommended: deactivate or remove orphaned plans so nobody buys them
    //await MembershipPlans.deleteMany({ planId: { $in: planIds } });
  }

  // 5. Safe to delete the training program
  await Training.deleteOne({ trainingId });

  return { message: "Training deleted successfully", training };
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
  const trainigfound = await Training.findOne({ trainingId });
  const shiftfound = await Shifts.findOne({ shiftId });
  if (!trainigfound || !shiftfound) {
    throw new BadRequestError(
      "Training program not found or Shift not founded.",
    );
  }
  // now let us cheke the tier vvip =25 peopeles vvip 5 peoples / shift
  // if the tier is normal just passit
  if (
    (tier === "vip" && shiftfound.max_capacity >= 15) ||
    (tier === "vvip" && shiftfound.max_capacity >= 5)
  ) {
    throw new BadRequestError(
      `Error the shift and plan mismatched plan is ${tier} and shift capacity is ${shiftfound.max_capacity}`,
    );
  }

  const newPlan = new MembershipPlans({
    title,
    description,
    duration_days,
    tier,
    price,
    trainingId,
    shiftId,
  });
  if (tier === "normal") {
    newPlan.shiftId = null;
  }
  await newPlan.save();

  return newPlan;
};
module.exports.removePlan = async function ({ planId }) {
  const deletePlan = await MembershipPlans.deleteOne({ planId });
  return deletePlan;
};

const {
  Training,
  Shifts,
  MembershipPlans,
  Users,
  Trainer,
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
  if (!istrainerexist || isValidUser) {
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
  });
  return shift;
};
module.exports.removeshift = async function ({ shiftId }) {
  const deleted = await Shifts.deleteOne({ shiftId });
  return deleted;
};
module.exports.removetraining = async function ({ trainingId }) {
  const training = await Training.findOneAndDelete({ trainingId });

  if (!training) {
    throw new BadRequestError("training Program Not Found");
  }
  return { message: "training deleted successsfully", training };
};
module.exports.newMembershipPlan = async ({
  title,
  description,
  duration_days,
  tier,
  price,
  training_id,
  shiftId,
}) => {
  const trainigfound = await Training.findOne({ trainingId: training_id });
  const shiftfound = await Shifts.findOne({ shiftId: shiftId });
  if (!trainigfound || !shiftfound) {
    throw new BadRequestError(
      "Training program not found or Shift not founded.",
    );
  }
  // now let us cheke the tier vvip =25 peopeles vvip 5 peoples / shift
  // if the tier is normal just passit
  if (
    (tier === "vip" && shiftfound.max_capacity !== 15) ||
    (tier === "vvip" && shiftfound.max_capacity !== 5)
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
    training_id,
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

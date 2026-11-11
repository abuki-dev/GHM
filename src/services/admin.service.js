const { Training, Shifts, MembershipPlans } = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");

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
  group,
  period,
  days_of_week,
  startTime,
  endTime,
  max_capacity,
}) {
  if (!startTime || !endTime || endTime < startTime) {
    throw new BadRequestError("Time is out of range or ");
  }

  const shift = await Shifts.create({
    trainerId: trainerId,
    group: group,
    period: period,
    startTime: startTime,
    endTime: endTime,
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
  const training = await training.findOneAndDelete({ trainingId });

  if (!training) {
    throw new BadRequestError("training Program Not Found");
  }
  return { message: "training created successsfully", training };
};
module.exports.newMembershipPlan = async ({
  Title,
  description,
  duration_days,
  tier,
  price,
  training_id,
  shiftId,
}) => {
  const existingPlan = await MembershipPlans.findOne({ Title });
  if (existingPlan) {
    throw new BadRequestError(
      "A membership plan with this title already exists.",
    );
  }

  const newPlan = await MembershipPlans.create({
    Title,
    description,
    duration_days,
    tier,
    price,
    training_id,
    shiftId,
  });

  return newPlan;
};

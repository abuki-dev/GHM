const { Training, MembershipPlans } = require("../migrations");
const MembershipPlan = require("../migrations/Memebership_Plan");
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
  const existingPlan = await MembershipPlan.findOne({ Title });
  if (existingPlan) {
    throw new BadRequestError(
      "A membership plan with this title already exists.",
    );
  }

  const newPlan = await MembershipPlan.create({
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

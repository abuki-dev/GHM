const { Training, Shifts } = require("../migrations");
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
module.exports.removetraining = async function ({ trainingId }) {};
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

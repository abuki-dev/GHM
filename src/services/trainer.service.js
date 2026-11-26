const { Trainer, Shifts, Sessions } = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");

async function getTrainer(user) {
  const trainer = await Trainer.findOne({ userId: user.id });
  if (!trainer) throw new BadRequestError("Trainer profile not found.");
  return trainer;
}

module.exports.getMyShifts = async (user) => {
  const trainer = await getTrainer(user);
  return Shifts.find({ trainerId: trainer.trainerId }).sort({ startTime: 1 });
};

module.exports.getMySessions = async (user) => {
  const trainer = await getTrainer(user);
  const shifted = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(),
  ) - 3 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 86_400_000);

  return Sessions.find({
    trainer_id: trainer.trainerId,
    createdAt: { $gte: start, $lt: end },
  }).sort({ start_time: 1 });
};

module.exports.updateMySession = async (user, sessionId, updates) => {
  const trainer = await getTrainer(user);
  const allowed = {};
  for (const field of ["client_note", "calories_burned", "status"]) {
    if (updates[field] !== undefined) allowed[field] = updates[field];
  }

  const session = await Sessions.findOneAndUpdate(
    { _id: sessionId, trainer_id: trainer.trainerId },
    { $set: allowed },
    { new: true, runValidators: true },
  );
  if (!session) throw new BadRequestError("Session not found.");
  return session;
};
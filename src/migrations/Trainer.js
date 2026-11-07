const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");
const trainerSchema = new mongoose.Schema({
  trainerId: { type: String, required: true, unique: true, ref: "users" },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  salary: { type: Number, required: true },
  hireDate: { type: Date, required: true },
});
trainerSchema.pre("save", async function () {
  await incrementId(this, "trainerId");
});
const Trainer = mongoose.model("trainers", trainerSchema);
module.exports = Trainer;

const mongoose = require("mongoose");
const trainerSchema = new mongoose.Schema({
  trainerId: { type: String, required: true, unique: true, ref: "Users" },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  salary: { type: Number, required: true },
  hireDate: { type: Date, required: true },
});
const Trainer = mongoose.model("Trainers", trainerSchema);
module.exports = Trainer;

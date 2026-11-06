const mongoose = require("mongoose");
const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true },
  trainerId: { type: String, required: true, ref: "Trainers" },
  Group: { type: String, required: true },
  period: {
    type: String,
    required: true,
    enum: ["Dawn", "morning", "noon", "night"],
  },
  days_of_week: {
    type: [String],
    required: true,
    index: true,
    enum: ["MON-WED-FRI", "TU-TH-SA"],
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  max_capacity: { type: Number, required: true, check: (value) => value >= 0 },
});
const Shift = mongoose.model("Shifts", shiftSchema);
module.exports = Shift;

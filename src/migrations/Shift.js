const mongoose = require("mongoose");
const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true },
  trainerId: { type: String, required: true, ref: "Trainers" },
  name: { type: String, required: true },
  period: {
    type: String,
    required: true,
    enum: ["Dawn", "morning", "noon", "night"],
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  max_capacity: { type: Number, required: true, check: (value) => value >= 0 },
});
const Shift = mongoose.model("Shifts", shiftSchema);
module.exports = Shift;

const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");
const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true, index: true },
  trainerId: { type: String, required: true, ref: "trainers", idnex: true },
  group: { type: String, required: true, unique: true },
  room: {
    type: String,
    required: true,
    enum: ["Main hall", "VVIP Room", "VIP Room"],
  },
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
  startTime: {
    type: String,
    required: [true, "start time is required"],
    trim: true,
    match: [
      /^([01]?\d|2[0-3]):[0-5]\d$/,
      "Invalid time format. Use H:MM or HH:MM (e.g., 4:00 or 14:30)",
    ],
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
    trim: true,
    match: [
      /^([01]?\d|2[0-3]):[0-5]\d$/,
      "Invalid time format. Use H:MM or HH:MM (e.g., 4:00 or 14:30)",
    ],
  },
  max_capacity: { type: Number, required: true, min: 0 },
  version: { type: Number, default: 0 },
});
shiftSchema.pre("validate", async function () {
  await incrementId(this, "shiftId");
  await incrementId(this, "group");
});
const Shift = mongoose.model("shifts", shiftSchema);
module.exports = Shift;

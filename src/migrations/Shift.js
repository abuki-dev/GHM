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
    enum: ["MON-WED-FRI", "TU-TH-SA"],
    validate: {
      validator: (v) => v.length > 0,
      message: "Choose at least one day pattern",
    },
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
      "Invalid time format. Use H:MM or HH:MM",
    ],
    validate: {
      validator: function (v) {
        const m = (t) => {
          const [h, min] = t.split(":").map(Number);
          return h * 60 + min;
        };
        return m(v) > m(this.startTime);
      },
      message: "End time must be after start time",
    },
  },
  max_capacity: {
    type: Number,
    required: true,
    min: [1, "max_capacity must be at least 1"],
    validate: {
      validator: Number.isInteger,
      message: "max_capacity must be a whole number",
    },
  },
  version: { type: Number, default: 0 },
});
shiftSchema.pre("validate", async function () {
  await incrementId(this, "shiftId");
  await incrementId(this, "group");
});
const Shift = mongoose.model("shifts", shiftSchema);
module.exports = Shift;

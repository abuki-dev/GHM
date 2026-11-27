const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    member_id: {
      type: String,
      ref: "members",
      required: true,
      index: true,
    },
    trainer_id: {
      type: String,
      ref: "trainers",
      index: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: { type: Date },
    calories_burned: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "in_progress"],
      required: true,
      index: true,
    },
    client_note: { type: String },
    shiftId: { type: String, ref: "shifts" },
  },
  { timestamps: true },
);
const Session = mongoose.model("sessions", sessionSchema);
module.exports = Session;
